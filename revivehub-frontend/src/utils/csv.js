// Small CSV reader for the bulk-upload feature.
// Handles quoted fields ("a, b"), doubled quotes ("") and Windows line endings.

export const CSV_COLUMNS = [
  'title',
  'category',
  'condition',
  'quantity',
  'original_price',
  'price',
  'city',
  'postal_code',
  'description',
];

export const CSV_TEMPLATE =
  CSV_COLUMNS.join(',') +
  '\n"Wireless earbuds, bulk lot",Electronics,new,400,1999,899,Pune,411001,"Sealed boxes, original packaging"\n';

function splitLine(line) {
  const cells = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

// Returns an array of objects keyed by the header names (lower-cased).
export function parseCsv(text) {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] || '').trim();
    });
    return row;
  });
}

export function hasRequiredColumns(text) {
  const firstLine = text.replace(/^﻿/, '').split(/\r?\n/)[0] || '';
  const headers = splitLine(firstLine).map((h) => h.trim().toLowerCase());
  return ['title', 'quantity', 'original_price', 'price', 'city'].every((c) => headers.includes(c));
}
