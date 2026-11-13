# API Documentation – Smart CRM L2 (Warranty Intake & Classification)

Release `v1.0` · Base URL `http://localhost:3000` · Business endpoints live under `/api` (16 endpoints) plus `GET /health` = **17 endpoints**, the same as the routes in `src/backend/src/app.js` and `src/backend/src/api/routes/index.js`.
Design notes in Vietnamese (use cases, business rules): `docs/api-contract.md`.

**Examples are real.** Each "Real example" block is written by `node src/backend/scripts/api-examples.js`. The script calls the running system (`docker compose up`), copies each request and response verbatim, and replaces only the JWT (`eyJ…(redacted)`) and the login password. It exits with an error if any status code differs from this document.

## 1. Conventions

### 1.1 Format
- Bodies are JSON (`Content-Type: application/json`), UTF-8. Field names are camelCase.
- Timestamps are ISO 8601 in Vietnam time (`2026-10-02T10:00:00.000+07:00`). Dates are `YYYY-MM-DD` and must exist on the calendar (`2026-02-30` is rejected).
- Every response has an `X-Request-Id` header. For a 5xx error, the same id is shown to the user as *"Mã tra cứu"* and can be found in the API log.

### 1.2 Authentication and roles
- `POST /api/auth/login` returns a **JWT (HS256) valid for 8 hours**. Every other `/api` endpoint requires the header `Authorization: Bearer <token>`.
- The token carries `staffId`, `role` and `centerCode`. The centre and the receiving staff member are **always taken from the token**, never from the request body.
- Roles: **NV** = `NV_TIEP_NHAN` (intake staff) and **QL** = `QL_TRUNG_TAM` (centre manager). Sample accounts: `nv01` (NV) and `ql01` (QL) at centre TT-CT01; `nv02` (NV) at TT-CT02.
- Phone numbers are **masked** (`090****567`) for every role except QL.

### 1.3 Error body
```json
{ "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ", "fields": ["issueDesc", "categoryCode"] }
```
`message` is Vietnamese text for the UI. Clients should branch on `code`. `fields` appears only on input errors.

### 1.4 Errors common to every endpoint

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_JSON` | the body is not valid JSON |
| 400 | `VALIDATION_ERROR` | wrong type, length or enum value; `fields` lists the bad fields |
| 401 | `UNAUTHORIZED` | token missing, invalid, expired or not HS256 (all endpoints except `/health` and login) |
| 403 | `FORBIDDEN` | the role may not call this endpoint, or the record belongs to another centre |
| 404 | `ROUTE_NOT_FOUND` | no such endpoint |
| 413 | `PAYLOAD_TOO_LARGE` | the body is over 100 KB |
| 500 | `LOI_HE_THONG` | unexpected error. The body has only a generic message and a `requestId` (no stack trace, SQL, or table name) |
| 503 | `LOI_HE_THONG` | the database cannot be reached |

### 1.5 Limits for all endpoints
- Body ≤ 100 KB.
- Ids are integers 1 … 2,147,483,647.
- `page` is digits only, ≤ 10,000 (0 or missing means page 1). Lists return **20 rows per page**.
- The database connection times out after 5 s.
- There is no rate limiting in v1.0 (see `docs/checklist-bao-mat.md`).

## 2. Endpoint index

| # | Method & path | Roles | Purpose |
|---|---|---|---|
| 2.1 | `GET /health` | public | liveness and DB check |
| 2.2 | `POST /api/auth/login` | public | sign in |
| 2.3 | `POST /api/customers/lookup` | NV, QL | find customer by phone (UC01) |
| 2.4 | `GET /api/customers` | NV, QL | customer list / search |
| 2.5 | `GET /api/customers/{id}` | NV, QL | customer detail |
| 2.6 | `POST /api/customers` | NV | create customer (UC02) |
| 2.7 | `PATCH /api/customers/{id}` | NV, QL | edit customer |
| 2.8 | `DELETE /api/customers/{id}` | QL | delete unused customer |
| 2.9 | `POST /api/devices` | NV | find or register device (UC03) |
| 2.10 | `GET /api/devices/{id}` | NV, QL | device detail |
| 2.11 | `PATCH /api/devices/{id}` | NV, QL | edit device |
| 2.12 | `DELETE /api/devices/{id}` | QL | delete unused device |
| 2.13 | `GET /api/issue-categories` | NV, QL | issue categories (UC05) |
| 2.14 | `POST /api/tickets` | NV | create warranty ticket (UC04) |
| 2.15 | `GET /api/tickets` | NV, QL | ticket list of own centre (UC06) |
| 2.16 | `GET /api/tickets/{ticketCode}` | NV, QL | ticket detail + history (UC08) |
| 2.17 | `POST /api/tickets/{ticketCode}/review` | QL | verify warranty (UC07) |

Shared response objects:
- **Customer**: `{ customerId, fullName, phone, devices: Device[] }`
- **Device**: `{ deviceId, serialImei, modelName, purchaseDate | null, warrantyMonths }`
- **Ticket**: `{ ticketCode, customerName, phone, categoryName, priority, status, receivedAt, dueAt, categoryCode, warrantyResult, issueDesc, centerCode, receivedBy, device: Device }`
- **History item**: `{ changedAt, fromStatus | null, toStatus, changedBy, note }`

Enumerations:
- `priority`: `CAO` · `TRUNG_BINH` · `THAP`
- `status`: `MOI` (new) · `CHO_XAC_MINH` (waiting for warranty verification)
- `warrantyResult`: `CON_BAO_HANH` (in warranty) · `HET_BAO_HANH` (expired) · `CHUA_XAC_MINH` (no purchase date)

---

### 2.1 `GET /health`
- **Description:** liveness and readiness check. It pings PostgreSQL and is used by the Docker HEALTHCHECK.
- **Auth:** none.
- **Parameters:** none.
- **Success:** `200 { "status": "OK", "db": "OK", "service": "smartcrm-l2" }`
- **Errors:**

| HTTP | Body | When |
|---|---|---|
| 503 | `{ "status": "DEGRADED", "db": "DOWN", "service": "smartcrm-l2" }` | the database does not answer |

- **Limits:** none. It is cheap enough to poll every 10 s.

<!-- vd:health -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /health
```
Response `200`
```json
{
  "status": "OK",
  "db": "OK",
  "service": "smartcrm-l2"
}
```
<!-- /vd:health -->

### 2.2 `POST /api/auth/login`
- **Description:** sign a staff member in and return a JWT.
- **Auth:** none.
- **Body:** `username` string 1–50 (case-insensitive, trimmed) · `password` string 1–100.
- **Success:** `200 { token, staff: { staffId, role, centerCode, fullName, username } }`. The password hash is never returned.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `username` or `password` is missing or empty |
| 401 | `INVALID_CREDENTIALS` | wrong username **or** wrong password. The message is the same in both cases, so it does not reveal which usernames exist |
| 403 | `FORBIDDEN` | the account is locked |

- **Limits:** the token lives 8 h. Passwords are stored as salted scrypt hashes.

<!-- vd:login -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/auth/login
Content-Type: application/json

{"username":"nv01","password":"<sample password>"}
```
Response `200`
```json
{
  "token": "eyJ…(redacted)",
  "staff": {
    "staffId": 1,
    "role": "NV_TIEP_NHAN",
    "centerCode": "TT-CT01",
    "fullName": "Trần Thị Bình",
    "username": "nv01"
  }
}
```

*Error*
```http
POST /api/auth/login
Content-Type: application/json

{"username":"nv01","password":"wrong-password"}
```
Response `401`
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Sai tên đăng nhập hoặc mật khẩu"
}
```
<!-- /vd:login -->

### 2.3 `POST /api/customers/lookup`
- **Description:** find a customer by phone number (UC01). The response includes the customer's devices, so a ticket can be started.
- **Auth:** Bearer, NV or QL.
- **Body:** `phone` string ≤ 20. It is normalised first: spaces, dots and dashes are removed, and `+84` or `84` is replaced by `0`.
- **Success:** `200` **Customer**.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_PHONE` | not 10 digits starting with 0 after normalisation |
| 404 | `CUSTOMER_NOT_FOUND` | no customer has this number |

- **Limits:** POST is used so the phone number never appears in a URL or an access log.

<!-- vd:lookup -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/customers/lookup
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"phone":"+84 901 234 567"}
```
Response `200`
```json
{
  "customerId": 1,
  "fullName": "Nguyễn Minh Anh",
  "phone": "090****567",
  "devices": [
    {
      "deviceId": 1,
      "serialImei": "MM-IMEI-000123",
      "modelName": "Mekong X5",
      "purchaseDate": "2026-03-15",
      "warrantyMonths": 12
    }
  ]
}
```

*Error*
```http
POST /api/customers/lookup
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"phone":"09012"}
```
Response `400`
```json
{
  "code": "INVALID_PHONE",
  "message": "Số điện thoại không hợp lệ: cần 10 chữ số, bắt đầu bằng 0",
  "fields": [
    "phone"
  ]
}
```
<!-- /vd:lookup -->

### 2.4 `GET /api/customers`
- **Description:** paged customer list with search (screen M4).
- **Auth:** Bearer, NV or QL.
- **Query (all optional):** `q` string ≤ 100. If it normalises to a phone number it must match exactly; otherwise it matches part of the full name, ignoring case. `page`.
- **Success:** `200 { page, pageSize: 20, total, items: [{ customerId, fullName, phone, deviceCount, ticketCount }] }`. No match returns `items: []`.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[q]` / `[page]` | `q` is longer than 100, repeated (`?q=a&q=b`) or an object; `page` is not digits or is > 10,000 |

- **Limits:** 20 rows per page, newest customer first.

<!-- vd:list-customers -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/customers?q=0901%20234%20567
Authorization: Bearer <JWT of nv01>
```
Response `200`
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "items": [
    {
      "customerId": 1,
      "fullName": "Nguyễn Minh Anh",
      "phone": "090****567",
      "deviceCount": 1,
      "ticketCount": 1
    }
  ]
}
```

*Error*
```http
GET /api/customers?page=10001
Authorization: Bearer <JWT of nv01>
```
Response `400`
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fields": [
    "page"
  ]
}
```
<!-- /vd:list-customers -->

### 2.5 `GET /api/customers/{id}`
- **Description:** one customer with their devices.
- **Auth:** Bearer, NV or QL. The phone is unmasked only for QL.
- **Path:** `id` integer.
- **Success:** `200` **Customer**.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[id]` | `id` is not a positive integer ≤ 2,147,483,647 |
| 404 | `CUSTOMER_NOT_FOUND` | unknown id |

- **Limits:** see §1.5.

<!-- vd:get-customer -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/customers/1
Authorization: Bearer <JWT of ql01>
```
Response `200`
```json
{
  "customerId": 1,
  "fullName": "Nguyễn Minh Anh",
  "phone": "0901234567",
  "devices": [
    {
      "deviceId": 1,
      "serialImei": "MM-IMEI-000123",
      "modelName": "Mekong X5",
      "purchaseDate": "2026-03-15",
      "warrantyMonths": 12
    }
  ]
}
```

*Error*
```http
GET /api/customers/999999
Authorization: Bearer <JWT of nv01>
```
Response `404`
```json
{
  "code": "CUSTOMER_NOT_FOUND",
  "message": "Không tìm thấy khách hàng"
}
```
<!-- /vd:get-customer -->

### 2.6 `POST /api/customers`
- **Description:** create a customer profile (UC02). The phone number must be unique after normalisation (QT-01).
- **Auth:** Bearer, **NV** only.
- **Body:** `fullName` string 1–100 · `phone` string ≤ 20.
- **Success:** `201` **Customer** (with `devices: []`).
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[fullName]` | name is empty or longer than 100 |
| 400 | `INVALID_PHONE` | invalid phone after normalisation |
| 403 | `FORBIDDEN` | caller is QL |
| 409 | `PHONE_EXISTS` | a customer with this phone already exists (also when two requests race) |

- **Limits:** see §1.5.

<!-- vd:create-customer -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/customers
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"fullName":"API Example Customer","phone":"0978291319"}
```
Response `201`
```json
{
  "customerId": 685,
  "fullName": "API Example Customer",
  "phone": "097****319",
  "devices": []
}
```

*Error*
```http
POST /api/customers
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"fullName":"Duplicate Phone","phone":"0978291319"}
```
Response `409`
```json
{
  "code": "PHONE_EXISTS",
  "message": "Số điện thoại đã có hồ sơ khách hàng – dùng Tra cứu"
}
```
<!-- /vd:create-customer -->

### 2.7 `PATCH /api/customers/{id}`
- **Description:** change the name and/or the phone number. Send only the fields to change.
- **Auth:** Bearer, NV or QL.
- **Body:** at least one of `fullName` (1–100) or `phone` (≤ 20). The phone is normalised. Keeping your own number is not a conflict.
- **Success:** `200` **Customer** with the new values.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[body]` | neither field was sent |
| 400 | `INVALID_PHONE` | the new phone is invalid |
| 404 | `CUSTOMER_NOT_FOUND` | unknown id |
| 409 | `PHONE_EXISTS` | the new phone belongs to another customer |

- **Limits:** see §1.5.

<!-- vd:update-customer -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
PATCH /api/customers/685
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"fullName":"API Example Customer (edited)"}
```
Response `200`
```json
{
  "customerId": 685,
  "fullName": "API Example Customer (edited)",
  "phone": "097****319",
  "devices": []
}
```

*Error*
```http
PATCH /api/customers/685
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{}
```
Response `400`
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fields": [
    "body"
  ]
}
```
<!-- /vd:update-customer -->

### 2.8 `DELETE /api/customers/{id}`
- **Description:** delete a customer who has **no devices and no tickets**. Tickets are records and are never deleted in cascade.
- **Auth:** Bearer, **QL** only.
- **Path:** `id`.
- **Success:** `204`, no body.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 403 | `FORBIDDEN` | caller is NV |
| 404 | `CUSTOMER_NOT_FOUND` | unknown id |
| 409 | `CUSTOMER_IN_USE` | the customer still has devices or tickets |

- **Limits:** see §1.5.

<!-- vd:delete-customer -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
DELETE /api/customers/686
Authorization: Bearer <JWT of ql01>
```
Response `204`
_(no body)_

*Error*
```http
DELETE /api/customers/685
Authorization: Bearer <JWT of ql01>
```
Response `409`
```json
{
  "code": "CUSTOMER_IN_USE",
  "message": "Khách hàng đã có thiết bị hoặc phiếu bảo hành – không thể xoá"
}
```
<!-- /vd:delete-customer -->

### 2.9 `POST /api/devices`
- **Description:** find a device by Serial/IMEI for a customer, or register a new one (UC03). The Serial/IMEI is stored in upper case and must be unique.
- **Auth:** Bearer, **NV** only.
- **Body:** `customerId` integer · `serialImei` 1–50. To register a new device, also send `modelName` 1–100, plus the optional `purchaseDate` (`YYYY-MM-DD`, not in the future) and optional `warrantyMonths` 0–60 (default 12).
- **Success:** `201` **Device** + `created: true` (registered), or `200` + `created: false` (already exists for this customer).
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | bad type or range, or an impossible date |
| 400 | `PURCHASE_DATE_IN_FUTURE` | the purchase date is after today |
| 404 | `CUSTOMER_NOT_FOUND` | unknown `customerId` |
| 404 | `DEVICE_NOT_FOUND` | the serial is unknown and no `modelName` was sent |
| 409 | `DEVICE_OWNED_BY_OTHER` | the serial belongs to another customer |

- **Limits:** see §1.5.

<!-- vd:register-device -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/devices
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"customerId":685,"serialImei":"API-EX-78291319","modelName":"Mekong X5","purchaseDate":"2026-10-14","warrantyMonths":12}
```
Response `201`
```json
{
  "deviceId": 311,
  "serialImei": "API-EX-78291319",
  "modelName": "Mekong X5",
  "purchaseDate": "2026-10-14",
  "warrantyMonths": 12,
  "created": true
}
```

*Error*
```http
POST /api/devices
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"customerId":685,"serialImei":"MM-IMEI-000123"}
```
Response `409`
```json
{
  "code": "DEVICE_OWNED_BY_OTHER",
  "message": "Serial/IMEI đã thuộc khách hàng khác – không thể liên kết"
}
```
<!-- /vd:register-device -->

### 2.10 `GET /api/devices/{id}`
- **Description:** one device and its owner.
- **Auth:** Bearer, NV or QL.
- **Path:** `id`.
- **Success:** `200` **Device** + `customerId`.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[id]` | bad id |
| 404 | `DEVICE_NOT_FOUND` | unknown id |

- **Limits:** see §1.5.

<!-- vd:get-device -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/devices/311
Authorization: Bearer <JWT of nv01>
```
Response `200`
```json
{
  "deviceId": 311,
  "serialImei": "API-EX-78291319",
  "modelName": "Mekong X5",
  "purchaseDate": "2026-10-14",
  "warrantyMonths": 12,
  "customerId": 685
}
```

*Error*
```http
GET /api/devices/999999
Authorization: Bearer <JWT of nv01>
```
Response `404`
```json
{
  "code": "DEVICE_NOT_FOUND",
  "message": "Không tìm thấy thiết bị"
}
```
<!-- /vd:get-device -->

### 2.11 `PATCH /api/devices/{id}`
- **Description:** change the model, the purchase date (`null` or `""` clears it, so the next ticket waits for verification) or the warranty months. The Serial/IMEI and the owner **cannot** be changed (QT-03).
- **Auth:** Bearer, NV or QL.
- **Body:** at least one of `modelName`, `purchaseDate`, `warrantyMonths`.
- **Success:** `200` **Device** + `customerId`.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[serialImei]` / `[customerId]` / `[body]` | the body tries to change the serial or the owner, or is empty |
| 400 | `PURCHASE_DATE_IN_FUTURE` | the date is after today |
| 404 | `DEVICE_NOT_FOUND` | unknown id |

- **Limits:** see §1.5.

<!-- vd:update-device -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
PATCH /api/devices/311
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"warrantyMonths":24}
```
Response `200`
```json
{
  "deviceId": 311,
  "serialImei": "API-EX-78291319",
  "modelName": "Mekong X5",
  "purchaseDate": "2026-10-14",
  "warrantyMonths": 24,
  "customerId": 685
}
```

*Error*
```http
PATCH /api/devices/311
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"serialImei":"NEW-SERIAL"}
```
Response `400`
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fields": [
    "body",
    "serialImei"
  ]
}
```
<!-- /vd:update-device -->

### 2.12 `DELETE /api/devices/{id}`
- **Description:** delete a device that has **no tickets**.
- **Auth:** Bearer, **QL** only.
- **Path:** `id`.
- **Success:** `204`, no body.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 403 | `FORBIDDEN` | caller is NV |
| 404 | `DEVICE_NOT_FOUND` | unknown id |
| 409 | `DEVICE_IN_USE` | the device has a ticket |

- **Limits:** see §1.5.

<!-- vd:delete-device -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
DELETE /api/devices/313
Authorization: Bearer <JWT of ql01>
```
Response `204`
_(no body)_

*Error*
```http
DELETE /api/devices/313
Authorization: Bearer <JWT of nv01>
```
Response `403`
```json
{
  "code": "FORBIDDEN",
  "message": "Không đủ quyền thực hiện thao tác này"
}
```
<!-- /vd:delete-device -->

### 2.13 `GET /api/issue-categories`
- **Description:** active issue categories with their default priority (UC05, QT-A1).
- **Auth:** Bearer, NV or QL.
- **Parameters:** none.
- **Success:** `200 { items: [{ code, name, defaultPriority }] }`, ordered by id. Sample data has 6 categories: NUOC_VAO, MAN_HINH, PIN, SAC, PHAN_MEM, KHAC.
- **Errors:** only the common errors in §1.4 (for example, 401 without a token).
- **Limits:** none.

<!-- vd:categories -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/issue-categories
Authorization: Bearer <JWT of nv01>
```
Response `200`
```json
{
  "items": [
    {
      "code": "NUOC_VAO",
      "name": "Nước vào",
      "defaultPriority": "CAO"
    },
    {
      "code": "MAN_HINH",
      "name": "Màn hình",
      "defaultPriority": "TRUNG_BINH"
    },
    {
      "code": "PIN",
      "name": "Pin",
      "defaultPriority": "TRUNG_BINH"
    },
    {
      "code": "SAC",
      "name": "Sạc",
      "defaultPriority": "TRUNG_BINH"
    },
    {
      "code": "PHAN_MEM",
      "name": "Phần mềm",
      "defaultPriority": "THAP"
    },
    {
      "code": "KHAC",
      "name": "Khác",
      "defaultPriority": "THAP"
    }
  ]
}
```

*Error*
```http
GET /api/issue-categories
```
Response `401`
```json
{
  "code": "UNAUTHORIZED",
  "message": "Thiếu JWT trong header Authorization"
}
```
<!-- /vd:categories -->

### 2.14 `POST /api/tickets`
- **Description:** create a warranty ticket (UC04). In **one transaction** the server checks the warranty (QT-05), sets the SLA due time (QT-15), generates the code `BH-NNNNNN/YYYY` from a DB sequence (QT-A2) and writes the first history row.
- **Auth:** Bearer, **NV** only. The centre and the receiver come from the token.
- **Body:** `customerId`, `deviceId` integers · `issueDesc` 1–5,000 characters, not just whitespace · `categoryCode` (see 2.13) · optional `priority` (default = the category's default priority).
- **Success:** `201` **Ticket**. `warrantyResult` is set from the purchase date and warranty months:
  - `CON_BAO_HANH` (in warranty) or `HET_BAO_HANH` (expired): `status` is `MOI`.
  - `CHUA_XAC_MINH` (no purchase date): `status` is `CHO_XAC_MINH`, and a manager must review the ticket (2.17).

  `dueAt` counts working days only (Mon–Sat): CAO = 24 h, TRUNG_BINH = 72 h, THAP = 120 h.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[issueDesc, categoryCode, …]` | missing or blank field, unknown enum value, or description over 5,000 characters |
| 400 | `CATEGORY_INACTIVE` | the category has been retired |
| 403 | `FORBIDDEN` | caller is QL |
| 404 | `CUSTOMER_NOT_FOUND` / `DEVICE_NOT_FOUND` / `CATEGORY_NOT_FOUND` | unknown reference |
| 409 | `DEVICE_OWNER_MISMATCH` | the device does not belong to that customer; nothing is written |

- **Limits:** `issueDesc` ≤ 5,000 characters. Ticket codes are unique under concurrent requests.

<!-- vd:create-ticket -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/tickets
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"customerId":685,"deviceId":311,"issueDesc":"Pin tụt nhanh, máy nóng khi sạc","categoryCode":"PIN"}
```
Response `201`
```json
{
  "ticketCode": "BH-000133/2026",
  "customerName": "API Example Customer (edited)",
  "phone": "097****319",
  "categoryName": "Pin",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "receivedAt": "2026-11-13T20:58:11.801+07:00",
  "dueAt": "2026-11-17T20:58:11.801+07:00",
  "categoryCode": "PIN",
  "warrantyResult": "CON_BAO_HANH",
  "issueDesc": "Pin tụt nhanh, máy nóng khi sạc",
  "centerCode": "TT-CT01",
  "receivedBy": "Trần Thị Bình",
  "device": {
    "deviceId": 311,
    "serialImei": "API-EX-78291319",
    "modelName": "Mekong X5",
    "purchaseDate": "2026-10-14",
    "warrantyMonths": 24
  }
}
```

*Error*
```http
POST /api/tickets
Authorization: Bearer <JWT of nv01>
Content-Type: application/json

{"customerId":685,"deviceId":311,"issueDesc":"   ","categoryCode":"LOA"}
```
Response `400`
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fields": [
    "issueDesc",
    "categoryCode"
  ]
}
```
<!-- /vd:create-ticket -->

### 2.15 `GET /api/tickets`
- **Description:** paged ticket list (UC06, screen M1). It returns **only tickets of the caller's centre** (QT-14).
- **Auth:** Bearer, NV or QL.
- **Query (all optional):** `from`, `to` (receive date `YYYY-MM-DD`) · `status` · `priority` · `q` (ticket code or phone number, ≤ 100) · `page`.
- **Success:** `200 { page, pageSize: 20, total, items: [{ ticketCode, customerName, phone, categoryName, priority, status, receivedAt, dueAt }] }`, newest first. No match returns `items: []`.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[from]` / `[status]` / `[priority]` / `[q]` / `[page]` | impossible date, unknown enum value, `q` repeated or used as an object (`?q[x]=1`), or page out of range |

- **Limits:** 20 rows per page.

<!-- vd:list-tickets -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/tickets?q=BH-000133%2F2026
Authorization: Bearer <JWT of nv01>
```
Response `200`
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "items": [
    {
      "ticketCode": "BH-000133/2026",
      "customerName": "API Example Customer (edited)",
      "phone": "097****319",
      "categoryName": "Pin",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "receivedAt": "2026-11-13T20:58:11.801+07:00",
      "dueAt": "2026-11-17T20:58:11.801+07:00"
    }
  ]
}
```

*Error*
```http
GET /api/tickets?status=DONE
Authorization: Bearer <JWT of nv01>
```
Response `400`
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fields": [
    "status"
  ]
}
```
<!-- /vd:list-tickets -->

### 2.16 `GET /api/tickets/{ticketCode}`
- **Description:** ticket detail with its full status history (UC08).
- **Auth:** Bearer, NV or QL of the **same centre** as the ticket.
- **Path:** `ticketCode`. It contains `/`, so URL-encode it: `BH-000001%2F2026`.
- **Success:** `200` **Ticket** + `history: HistoryItem[]` (oldest first).
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 403 | `FORBIDDEN` | the ticket belongs to another centre |
| 404 | `TICKET_NOT_FOUND` | unknown code |

- **Limits:** see §1.5.

<!-- vd:get-ticket -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
GET /api/tickets/BH-000133%2F2026
Authorization: Bearer <JWT of nv01>
```
Response `200`
```json
{
  "ticketCode": "BH-000133/2026",
  "customerName": "API Example Customer (edited)",
  "phone": "097****319",
  "categoryName": "Pin",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "receivedAt": "2026-11-13T20:58:11.801+07:00",
  "dueAt": "2026-11-17T20:58:11.801+07:00",
  "categoryCode": "PIN",
  "warrantyResult": "CON_BAO_HANH",
  "issueDesc": "Pin tụt nhanh, máy nóng khi sạc",
  "centerCode": "TT-CT01",
  "receivedBy": "Trần Thị Bình",
  "device": {
    "deviceId": 311,
    "serialImei": "API-EX-78291319",
    "modelName": "Mekong X5",
    "purchaseDate": "2026-10-14",
    "warrantyMonths": 24
  },
  "history": [
    {
      "changedAt": "2026-11-13T20:58:11.805+07:00",
      "fromStatus": null,
      "toStatus": "MOI",
      "changedBy": "Trần Thị Bình",
      "note": "Tạo phiếu"
    }
  ]
}
```

*Error*
```http
GET /api/tickets/BH-000133%2F2026
Authorization: Bearer <JWT of nv02 (centre TT-CT02)>
```
Response `403`
```json
{
  "code": "FORBIDDEN",
  "message": "Phiếu thuộc trung tâm khác"
}
```
<!-- /vd:get-ticket -->

### 2.17 `POST /api/tickets/{ticketCode}/review`
- **Description:** a manager decides on a ticket waiting for warranty verification (UC07, QT-06). The ticket row is locked (`SELECT … FOR UPDATE`), so two managers cannot overwrite each other.
- **Auth:** Bearer, **QL** of the same centre.
- **Path:** `ticketCode` (URL-encoded).
- **Body:**
  - `decision`: `CHAP_NHAN` (accept → `CON_BAO_HANH`) or `KHONG_CHAP_NHAN` (reject → `HET_BAO_HANH`).
  - `note`: 1–500 characters, required.
- **Success:** `200` **Ticket** + `history`. `status` becomes `MOI`, and a history row `CHO_XAC_MINH → MOI` is added with the manager's name and the note.
- **Errors:**

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` `[decision]` | unknown decision |
| 400 | `NOTE_REQUIRED` | note missing or blank |
| 403 | `FORBIDDEN` | caller is NV, or the ticket is in another centre |
| 404 | `TICKET_NOT_FOUND` | unknown code |
| 409 | `ALREADY_REVIEWED` | the ticket is no longer `CHO_XAC_MINH`; the earlier decision is kept |

- **Limits:** `note` ≤ 500 characters. A ticket can be reviewed only once.

<!-- vd:review -->
**Real example** – captured 2026-11-13 20:58 (UTC+7) by `node src/backend/scripts/api-examples.js` against `docker compose`.

*Success*
```http
POST /api/tickets/BH-000134%2F2026/review
Authorization: Bearer <JWT of ql01>
Content-Type: application/json

{"decision":"CHAP_NHAN","note":"Khách cung cấp tin nhắn xác nhận đơn hàng"}
```
Response `200`
```json
{
  "ticketCode": "BH-000134/2026",
  "customerName": "API Example Customer (edited)",
  "phone": "0978291319",
  "categoryName": "Màn hình",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "receivedAt": "2026-11-13T20:58:11.925+07:00",
  "dueAt": "2026-11-17T20:58:11.925+07:00",
  "categoryCode": "MAN_HINH",
  "warrantyResult": "CON_BAO_HANH",
  "issueDesc": "Màn hình sọc ngang, khách không còn hoá đơn",
  "centerCode": "TT-CT01",
  "receivedBy": "Trần Thị Bình",
  "device": {
    "deviceId": 312,
    "serialImei": "API-EX-78291319-B",
    "modelName": "Mekong A3",
    "purchaseDate": null,
    "warrantyMonths": 12
  },
  "history": [
    {
      "changedAt": "2026-11-13T20:58:11.927+07:00",
      "fromStatus": null,
      "toStatus": "CHO_XAC_MINH",
      "changedBy": "Trần Thị Bình",
      "note": "Tạo phiếu – thiếu ngày mua"
    },
    {
      "changedAt": "2026-11-13T20:58:11.940+07:00",
      "fromStatus": "CHO_XAC_MINH",
      "toStatus": "MOI",
      "changedBy": "Đặng Văn Khoa",
      "note": "Khách cung cấp tin nhắn xác nhận đơn hàng"
    }
  ]
}
```

*Error*
```http
POST /api/tickets/BH-000134%2F2026/review
Authorization: Bearer <JWT of ql01>
Content-Type: application/json

{"decision":"KHONG_CHAP_NHAN","note":"Xét lại"}
```
Response `409`
```json
{
  "code": "ALREADY_REVIEWED",
  "message": "Phiếu đã được xét duyệt – không ghi đè"
}
```
<!-- /vd:review -->
