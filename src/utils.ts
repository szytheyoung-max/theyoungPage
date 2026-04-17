export function toDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

export function todayStamp(): string {
  return new Date().toISOString();
}

export function trimText(value: string, max = 38): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function csvEscape(value: string): string {
  const quoted = value.split('"').join('""');
  return `"${quoted}"`;
}

export function downloadCsv(fileName: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
