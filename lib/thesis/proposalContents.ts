import {
  AlignmentType, Bookmark, HeadingLevel, InternalHyperlink, LeaderType, Paragraph,
  SimpleField, Tab, TableOfContents, TabStopType, TextRun, type IParagraphStyleOptions,
} from 'docx';
import { cmTwips, FEB_PAGE } from '@/lib/docx/feb2021';

const PAGE_WIDTH = FEB_PAGE.size.width - FEB_PAGE.margin.left - FEB_PAGE.margin.right;
const positions = (level: number) => ({ start: cmTwips(level === 1 ? 0 : level === 2 ? 1 : 1.5), text: cmTwips(level === 1 ? 2 : level === 2 ? 1 : 1.5) });
const tabs = (level: number) => [
  { type: TabStopType.LEFT, position: positions(level).text },
  { type: TabStopType.RIGHT, position: PAGE_WIDTH, leader: LeaderType.DOT },
];

/** Word recalculates the TOC after pagination; never guess page numbers from text length. */
export class ProposalContents {
  private entries: { title: string; level: 1 | 2 | 3; anchor: string; knownPage?: string }[] = [];

  heading(text: string, level: 1 | 2 | 3, title = text, knownPage?: string): Paragraph {
    const anchor = `SmartCampusHeading${this.entries.length + 1}`;
    this.entries.push({ title, level, anchor, knownPage });
    // Chapter headings occupy two body paragraphs, so TC joins their number and title in the TOC.
    const fieldTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ');
    return new Paragraph({
      ...(level > 1 ? { heading: level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3 } : {}),
      alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 480 }, keepNext: true,
      children: [new Bookmark({ id: anchor, children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })] }),
        ...(level === 1 ? [new SimpleField(`TC "${fieldTitle}" \\f P \\l "1"`)] : [])],
    });
  }

  styles(): IParagraphStyleOptions[] {
    return ([1, 2, 3] as const).map(level => ({
      id: `TOC${level}`, name: `toc ${level}`, basedOn: 'Normal', next: 'Normal',
      run: { font: 'Times New Roman', size: 24, color: '000000', bold: level === 1 },
      paragraph: {
        alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 360 },
        indent: { left: positions(level).text, hanging: positions(level).text - positions(level).start },
        tabStops: tabs(level), keepLines: true, widowControl: true,
      },
    }));
  }

  table(title: Paragraph): (Paragraph | TableOfContents)[] {
    const rows = this.entries.map(entry => {
      // Keep numbered headings together: an extra tab after 1.4.1 can skip to
      // the page-number stop if the number is wider than the intended gap.
      const label = entry.title.split('\t');
      const children = label.flatMap((part, i) => [
        ...(i ? [new TextRun({ children: [new Tab()] })] : []),
        new TextRun({ text: part, font: 'Times New Roman', size: 24, bold: entry.level === 1, color: '000000' }),
      ]);
      return new Paragraph({ style: `TOC${entry.level}`, tabStops: tabs(entry.level), children: [
        new InternalHyperlink({ anchor: entry.anchor, children }), new TextRun({ children: [new Tab()] }),
        new SimpleField(`PAGEREF ${entry.anchor} \\h`, entry.knownPage ?? '—'),
      ] });
    });
    return [title, new Paragraph({ text: 'Halaman', alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0, line: 360 }, run: { font: 'Times New Roman', size: 24 } }),
      new TableOfContents('Daftar Isi', { headingStyleRange: '2-3', tcFieldIdentifier: 'P', tcFieldLevelRange: '1-1', hyperlink: true, preserveTabInEntries: true, beginDirty: true, contentChildren: rows })];
  }
}
