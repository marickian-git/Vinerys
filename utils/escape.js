const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Pentru orice valoare introdusă de utilizator inserată în HTML generat pe server
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// CSV: ghilimele + protecție la formula injection (Excel execută celule care încep cu = + - @)
export function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  s = s.replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}
