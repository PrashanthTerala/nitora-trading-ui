/**
 * Minimal RFC 4180 writing. Kept apart from the page that uses it because getting this
 * wrong is silent: the journal previously replaced every quote in a trader's note with an
 * apostrophe, which produced a file that parsed cleanly and no longer said what they wrote.
 */

/** Quote a field only when it needs it, doubling any quote inside. */
export function csvCell(v: unknown): string {
  const str = v === undefined || v === null ? '' : String(v);
  const needsQuotes = str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r');
  return needsQuotes ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Join rows into a document. The BOM is deliberate: without it Excel on Windows decodes
 * the file as the system codepage and mangles any non-ASCII character a trader typed.
 */
export function toCsv(header: readonly string[], rows: readonly unknown[][]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))];
  return '\ufeff' + lines.join('\r\n');
}
