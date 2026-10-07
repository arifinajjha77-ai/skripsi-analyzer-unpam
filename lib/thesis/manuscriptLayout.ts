import { AlignmentType, BorderStyle, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, WidthType } from 'docx';
import { academicRuns } from '@/lib/docx/feb2021';

/** Treat a source with and without its URL as one entry; keep the fullest copy. */
export function uniqueReferences(entries: string[]): string[] {
  const sources = new Map<string, string>();
  for (const value of entries) {
    const text = value.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const key = text.replace(/https?:\/\/\S+|\bdoi:\s*\S+/gi, '').normalize('NFKC').toLocaleLowerCase('id').replace(/[\s.,;]+$/g, '').replace(/\s+/g, ' ').trim();
    const previous = sources.get(key);
    if (!previous || text.length > previous.length) sources.set(key, text);
  }
  return [...sources.values()].sort((a, b) => a.localeCompare(b, 'id'));
}

/** Fixed widths fit the 14 cm text area; rows and headings stay readable. */
export function manuscriptTable(headers: string[], rows: string[][], widths: number[], size = 24, numericColumns: number[] = []): Table {
  const cell = (text: string, index: number, header: boolean) => new TableCell({
    width: { size: widths[index], type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    ...(header ? { shading: { fill: 'F2F2F2' } } : {}),
    children: text.split(/\n+/).map(line => new Paragraph({
      children: header ? [new TextRun({ text: line, bold: true, font: 'Times New Roman', size })] : academicRuns(line, size),
      spacing: { before: 0, after: 0, line: 240 },
      alignment: header ? AlignmentType.CENTER : numericColumns.includes(index) ? AlignmentType.RIGHT : AlignmentType.LEFT,
      widowControl: true,
    })),
  });
  const border = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
  return new Table({
    width: { size: widths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
    columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map(row => new TableRow({ cantSplit: true, children: row.map((text, i) => cell(text, i, false)) }))],
  });
}
