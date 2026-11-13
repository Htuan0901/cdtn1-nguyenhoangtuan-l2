# Deployment Guide – Smart CRM L2 (Warranty Intake & Classification)

Student: Nguyễn Hoàng Tuấn – 2374802010542 · Track SE · Release: tag **`v1.0`** · Repo: https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2

The system has three services: PostgreSQL 16, the REST API, and the web UI. It starts with **two commands** on a machine that has only Git and Docker. The sample data loads automatically.

## 1. Requirements

| Item | Requirement | Check with |
|---|---|---|
| OS | Windows 10/11 64-bit (Docker Desktop with WSL 2, plus Git Bash), macOS 13+, or Ubuntu 22.04+ | — |
| Docker Engine | **24.0 or newer** (on Windows/macOS: Docker Desktop 4.25 or newer, running) | `docker --version` |
| Docker Compose | **v2.20 or newer**, used as `docker compose` (with a space) | `docker compose version` |
| Git | 2.30 or newer | `git --version` |
| Free disk | about **1.5 GB** (images `postgres:16-alpine` and `node:20-alpine`, plus the data volume) | `docker system df` |
| Free ports | **3000** (API) and **5173** (web UI). PostgreSQL is **not** published to the host | Windows: `netstat -ano \| findstr ":3000 :5173"` · macOS/Linux: `lsof -i :3000 -i :5173` |
| Network | internet access during the first build (pulls images and npm packages) | — |

Node.js and PostgreSQL do **not** need to be installed on the host; they run in the containers.
Tested on Windows 11 with Docker Desktop, and on every push in the GitHub Actions job `dong-goi` (`ubuntu-latest`).

## 2. Setup steps

Run in a terminal (Git Bash on Windows) **in an empty folder**, with Docker running.

| # | Command | Expected result |
|---|---|---|
| 1 | `git clone --branch v1.0 https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2.git smartcrm` | folder `smartcrm` checked out at tag `v1.0` |
| 2 | `cd smartcrm` | you are in the repository root (it contains `docker-compose.yml`) |
| 3 | `cp .env.example .env` | `.env` created. Its sample values work as-is on a local machine (see §3) |
| 4 | `docker compose up -d --build` | builds and starts `db` → `api` → `web`. The first run takes 2–5 min. **Migrations and sample data are loaded automatically** by `api` before it starts |
| 5 | `docker compose ps` | after 30–60 s, all three services show `Up … (healthy)`. If one still shows `starting`, wait 30 s and run it again |
| 6 | Open **http://localhost:5173** | the login page. Sign in as `nv01` with the sample password from README §3 |

The only commands that build the system are **steps 3 and 4**. Stop it with `docker compose down`. Stop it and delete all data with `docker compose down -v`; the next `up` starts clean.

## 3. Environment variables

The variables live in `.env` at the repository root, which is created from `.env.example`. `.env` is listed in `.gitignore` (never committed) and in `.dockerignore` (never copied into an image). Compose passes the values to the containers when they start.

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `POSTGRES_PASSWORD` | Password of the database user `postgres`. Used by `db`, and to build the API connection string | `<strong-db-password>` | **Yes**. Compose stops with `Thiếu POSTGRES_PASSWORD trong .env` if it is missing |
| `JWT_SECRET` | Key used to sign login tokens (HS256, valid 8 h) | `<random string, 32+ characters>` | **Yes**. Compose stops with `Thiếu JWT_SECRET trong .env` if it is missing |
| `FRONTEND_ORIGIN` | Browser origins the API accepts (CORS), comma-separated | `http://localhost:5173,http://127.0.0.1:5173` | No (this is the default) |
| `LOG_LEVEL` | API log level: `debug` · `info` · `warn` · `error` | `info` | No (default `info`) |
| `DATABASE_URL` | Connection string, used only when the API runs **without** Docker (README, way A). Under Compose it is built automatically from `POSTGRES_PASSWORD` with host `db` | `postgres://postgres:<strong-db-password>@localhost:5432/smartcrm` | Only without Docker |
| `PORT` | API port, used only without Docker. Under Compose it is fixed at 3000 | `3000` | No |

The values in `.env.example` are **samples for a local machine only**. Anywhere else, set your own values, for example with `openssl rand -hex 32`. If you change `POSTGRES_PASSWORD` after the first start, run `docker compose down -v` first, because the database volume keeps the old password.

## 4. Sample data

The data loads with no extra command. Every time `api` starts it runs:

1. `node scripts/migrate.js`. It creates the 6 tables, plus reference data: 6 issue categories and 3 staff accounts (`nv01` and `ql01` at TT-CT01, `nv02` at TT-CT02). Migrations that already ran are skipped.
2. `node scripts/seed-mau.js`. It loads the course sample files `data/mau/*.csv`. Phones are normalised, invalid rows are skipped and reported, and tickets go through the same business rules as the API. **Running it again adds nothing** (C8).

Expected row counts right after the first `up` on an empty volume:

| Table | Rows | Check with |
|---|---|---|
| `customer` · `device` · `ticket` | **667 · 293 · 122** | `docker compose exec -T db psql -U postgres -d smartcrm -tAc "SELECT (SELECT count(*) FROM customer)\|\|'/'\|\|(SELECT count(*) FROM device)\|\|'/'\|\|(SELECT count(*) FROM ticket)"` → `667/293/122` |
| `staff` · `issue_category` | **3 · 6** | `docker compose exec -T db psql -U postgres -d smartcrm -tAc "SELECT count(*) FROM staff"` → `3` |

The import summary (rows loaded and rejected per file) is in the API log: `docker compose logs api | grep -A12 "Nguồn: data/mau"`.

## 5. Verify it works

Run from the repository root. Use `exec -T` so that Git Bash on Windows does not fail with *"the input device is not a TTY"*.

| # | Command | Expected output |
|---|---|---|
| 1 | `docker compose ps` | `db`, `api` and `web` all `Up … (healthy)` |
| 2 | `curl -s http://localhost:3000/health` | `{"status":"OK","db":"OK","service":"smartcrm-l2"}` |
| 3 | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/` | `200` |
| 4 | the row-count command in §4 | `667/293/122` |
| 5 | **Unit tests (one command):** `docker compose exec -T api npm test` | the summary at the end shows `tests 64` · `pass 64` · `fail 0` |
| 6 | **The 12 test cases of the Test Report:** `docker compose exec -T api npm run st` | 12 blocks, each ending `KẾT QUẢ : PASS`, then `TỔNG: 12/12 PASS` |
| 7 | **One test case only** (any of ST-01 … ST-12): `docker compose exec -T api npm run st -- ST-05` | one block, then `TỔNG: 1/1 PASS` |
| 8 | **Second run of migrations and seed (C8):** `docker compose exec -T api npm run migrate` then `docker compose exec -T api npm run seed`, then the row-count command in §4 | migrate prints `- bỏ qua …` for all 3 files; the counts are unchanged (if you have not run the test cases yet, still `667/293/122`) |
| 9 | Other suites: `docker compose exec -T api npm run test:repo` · `… npm run e2e` · `… npm run crud` | summary `pass 8` · `fail 0` · then `10/10` steps · then `17/17` steps |
| 10 | Browser **http://localhost:5173** → sign in as `nv01` → *Danh sách phiếu* | the ticket list of centre TT-CT01, 20 rows per page |
| 11 | `docker compose logs api \| grep -iE "password\|token\|0[0-9]{9}"` | no phone number or token value; at most `[ĐÃ CHE]` |

Steps 6 and 7 create new test records (new customers, devices and tickets) each time, so after them the row counts in §4 increase. That is expected. Each test case reports its own before → after counts.
The same checks run automatically on every push in the CI job `dong-goi` (`.github/workflows/ci.yml`).

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `Thiếu POSTGRES_PASSWORD trong .env` | step 3 was skipped. Run `cp .env.example .env` |
| `port is already allocated` (3000 or 5173) | stop whatever uses the port: an old `npm start`, an older container (`docker ps`, then `docker stop <name>`), or this project in another folder (`docker compose down` there) |
| `api` exits with `password authentication failed` | the volume was created with another password. Run `docker compose down -v`, then `docker compose up -d --build` |
| `api` is `unhealthy` or `starting` for more than 2 min | `docker compose logs api --tail 50`. Usually `db` was not ready yet; run `docker compose restart api` |
| `the input device is not a TTY` (Git Bash) | add `-T` after `exec`, as in §5 |
| The browser shows a CORS error | `FRONTEND_ORIGIN` must contain the exact URL you open. Edit `.env`, then run `docker compose up -d` |

## 7. Public deployment (Render)

Live demo (free plan): **web** https://smartcrm-l2-web.onrender.com · **API** https://smartcrm-l2-api.onrender.com (`/health`).
Sign in with the sample account `nv01` (sample password, README §3). The free API instance **sleeps after 15 min idle**, so the first request takes about 1 min. Open `<API>/health` first and wait for `"status":"OK"`.

The whole stack is described in **`render.yaml`** (Render Blueprint). No secret is stored in the repo:

| Variable | Service | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | API | created by Render from the managed PostgreSQL 16 database `smartcrm-l2-db` (`fromDatabase`) |
| `JWT_SECRET` | API | generated by Render (`generateValue: true`, random 256-bit), never seen by anyone |
| `FRONTEND_ORIGIN` | API | entered in the Render Dashboard: the web URL (CORS allow-list) |
| `PORT`, `LOG_LEVEL` | API | `10000`, `info` (not secret, in `render.yaml`) |
| `API_BASE_URL` | web | entered in the Render Dashboard: `<API URL>/api`. Written into `/env.js` at build time, so the UI calls the right API with no URL hard-coded in source |

Steps taken to deploy:

1. Sign in at https://render.com with GitHub and allow access to this repository.
2. **New → Blueprint**, choose the repository and branch `main`. Render reads `render.yaml` and lists 3 resources: `smartcrm-l2-db` (PostgreSQL, free, Singapore), `smartcrm-l2-api` (Docker, free) and `smartcrm-l2-web` (static site).
3. When prompted for the `sync: false` variables, enter `FRONTEND_ORIGIN = https://smartcrm-l2-web.onrender.com` and `API_BASE_URL = https://smartcrm-l2-api.onrender.com/api`. Then **Deploy Blueprint**.
4. The API image is built from the same `src/backend/Dockerfile` used by Docker Compose. On start it runs `migrate.js` and `seed-mau.js` (sample data: 667 customers / 293 devices / 122 tickets), then the server. Render marks it *Live* when `GET /health` returns 200.
5. If Render gave a service a different URL (name taken), edit `FRONTEND_ORIGIN` on the API and `API_BASE_URL` on the web in **Environment**, then **Manual Deploy → Deploy latest commit** for that service.
6. Verify: `curl -s <API>/health` → `{"status":"OK","db":"OK",…}`. Open the web URL, sign in as `nv01`, and check that the ticket list (M1) loads. Every push to `main` redeploys both services automatically.

Limits of the free plan: the API sleeps when idle (cold start about 1 min, and the UI's 10 s timeout may show "Không kết nối được máy chủ API" on the very first click; reload after `/health` is OK). The free database expires 30 days after creation. There is no backup. This is a demo, not production.
