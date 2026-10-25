type Row = Record<string, unknown>;

// Added by InstantSearch to each hit; not part of the document.
const SEARCH_ONLY_KEYS = new Set([
  '_highlightResult',
  '_snippetResult',
  '_rawTypesenseHit',
  '__position',
  '__queryID',
]);

const FORMULA_START = /^[=+\-@\t\r]/;

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text: string;
  if (typeof value === 'string') {
    // Stop spreadsheets from running text such as "=SUM(A1)" as a formula. Numbers are left alone.
    text = FORMULA_START.test(value) ? `'${value}` : value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    text = String(value);
  } else {
    // objects and arrays
    text = JSON.stringify(value);
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * RFC 4180 CSV. Columns are the union of all keys, in order of first appearance, so documents
 * with different fields still line up. Nested values (objects, arrays) become JSON text.
 */
export function toCsv(rows: Row[]): string {
  const columns: string[] = [];
  const seen = new Set<string>();
  const cleaned = rows.map((row) => {
    const out: Row = {};
    Object.entries(row).forEach(([key, value]) => {
      if (SEARCH_ONLY_KEYS.has(key)) return;
      // The InstantSearch adapter repeats the document id as objectID.
      if (key === 'objectID' && row.objectID === row.id) return;
      out[key] = value;
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    });
    return out;
  });
  const lines = [columns.map(formatCell).join(',')];
  cleaned.forEach((row) => lines.push(columns.map((c) => formatCell(row[c])).join(',')));
  return lines.join('\r\n');
}
