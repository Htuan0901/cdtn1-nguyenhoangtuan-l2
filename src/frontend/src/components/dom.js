// Tạo phần tử DOM an toàn: chữ luôn đặt qua textContent (không chèn HTML từ dữ liệu → tránh XSS).
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') node.className = v;
    else if (k === 'value') node.value = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === undefined || c === null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const clear = (node) => { node.replaceChildren(); return node; };

// Dòng báo lỗi chữ đỏ đặt ngay dưới trường liên quan (wireframe M2, M3)
export const errorLine = (text) => el('p', { class: 'field-error', role: 'alert' }, '⚠ ', text);
