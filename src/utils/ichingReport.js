import { fullHexagramName } from './ichingTexts.js';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const SCALE = 1.5;
const INK = '#24352e';
const MUTED = '#68736a';
const PAPER = '#fbf7ec';
const RULE = '#a46c62';

function reportEntry(kind, hexagram, position = 0, line = null, source = 'original') {
  return {
    kind, position, source,
    hexagramNumber: hexagram.number,
    hexagramName: hexagram.fullName || hexagram.name,
    label: line?.label || '',
    text: kind === 'judgement' ? hexagram.judgement : line?.text || '',
    supplemental: Boolean(line?.supplemental)
  };
}

export function buildIChingReportModel({ values, reading, t, now = new Date() }) {
  if (!Array.isArray(values) || values.length !== 6 || values.some(value => ![6, 7, 8, 9].includes(value)) || !reading) {
    throw new Error('A complete six-line cast is required for the report.');
  }

  const entries = [
    reportEntry('judgement', reading.originalHexagram),
    ...reading.selectedLines.map(selected => reportEntry(
      'line',
      selected.hexagramNumber === reading.changedHexagram.number && selected.moving
        ? reading.changedHexagram : reading.originalHexagram,
      selected.position,
      selected.line,
      selected.moving ? 'changed' : 'original'
    ))
  ];

  return {
    original: reading.originalHexagram,
    changed: reading.changedHexagram,
    originalFigure: [...reading.original],
    changedFigure: [...reading.changed],
    movingPositions: [...reading.movingPositions],
    entries,
    generatedAt: now.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    t
  };
}

function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawSheet(ctx, title, subtitle, pageIndex, pageCount) {
  ctx.fillStyle = '#17231e';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  roundedRect(ctx, 34, 34, PAGE_WIDTH - 68, PAGE_HEIGHT - 68, 28, PAPER, null);
  ctx.fillStyle = INK;
  ctx.font = '700 18px sans-serif';
  ctx.fillText('INTERPOLATE YOU · 覺知你', 84, 100);
  ctx.font = '500 48px "Noto Serif TC", "Songti TC", serif';
  ctx.fillText(title, 84, 165);
  ctx.fillStyle = MUTED;
  ctx.font = '22px "Noto Sans TC", sans-serif';
  ctx.fillText(subtitle, 86, 208);
  ctx.strokeStyle = '#d6c6b5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 231);
  ctx.lineTo(PAGE_WIDTH - 84, 231);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText('INTERPOLATE YOU · I CHING', 84, PAGE_HEIGHT - 83);
  ctx.textAlign = 'right';
  ctx.fillText(`${pageIndex + 1} / ${pageCount}`, PAGE_WIDTH - 84, PAGE_HEIGHT - 83);
  ctx.textAlign = 'left';
}

function drawVerticalText(ctx, text, right, top, bottom, left, options = {}) {
  const characters = Array.from(String(text || '').replace(/[ \t\r]+/g, ''));
  const fontSize = options.fontSize || 25;
  const stepY = options.stepY || fontSize + 8;
  const stepX = options.stepX || fontSize + 7;
  ctx.fillStyle = options.color || INK;
  ctx.font = `${options.bold ? '700' : '400'} ${fontSize}px "Noto Serif TC", "Songti TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let x = right;
  let y = top;
  for (const character of characters) {
    if (character === '\n') { y = top; x -= stepX; continue; }
    if (y + stepY > bottom) { y = top; x -= stepX; }
    if (x < left) throw new Error('The report column is too narrow for its text.');
    ctx.fillText(character, x, y);
    y += stepY;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawSmallHexagram(ctx, figure, centerX, startY) {
  ctx.fillStyle = INK;
  for (let index = 0; index < 6; index += 1) {
    const y = startY + index * 13;
    const isYang = figure[5 - index];
    if (isYang) ctx.fillRect(centerX - 35, y, 70, 4);
    else {
      ctx.fillRect(centerX - 35, y, 29, 4);
      ctx.fillRect(centerX + 6, y, 29, 4);
    }
  }
}

function drawSummaryColumn(ctx, summary, colLeft, colRight, top, bottom) {
  const bandTop = top + 300;
  const bandBottom = bottom - 24;
  const bandHeight = (bandBottom - bandTop) / 3;
  for (let index = 1; index < 3; index += 1) {
    const y = bandTop + index * bandHeight - 8;
    ctx.strokeStyle = '#d5bcb0';
    ctx.beginPath(); ctx.moveTo(colLeft + 12, y); ctx.lineTo(colRight - 12, y); ctx.stroke();
  }

  const drawLabelSet = (labels, lowerX, upperX, label, size) => {
    ctx.fillStyle = INK;
    ctx.font = `700 14px "Noto Serif TC", "Songti TC", serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, (lowerX + upperX) / 2, bandTop + 23);
    drawVerticalText(ctx, labels.slice(3).join('、'), upperX,
      bandTop + 44, bandTop + bandHeight - 22, upperX - 2,
      { fontSize: size, stepY: size + 7, bold: true });
    drawVerticalText(ctx, labels.slice(0, 3).join('、'), lowerX,
      bandTop + 44, bandTop + bandHeight - 22, lowerX - 2,
      { fontSize: size, stepY: size + 7, bold: true });
  };
  // Within each set, the lower trigram is the left subcolumn and the upper
  // trigram is the right subcolumn. A changed figure gets its own second set.
  if (summary.hasChange) {
    drawLabelSet(summary.originalLineLabels, colLeft + 17, colLeft + 40, summary.originalLabel, 17);
    drawLabelSet(summary.changedLineLabels, colRight - 40, colRight - 17, summary.changedLabel, 17);
  } else {
    drawLabelSet(summary.originalLineLabels, colLeft + 37, colRight - 37, summary.originalLabel, 21);
  }

  const figureBandTop = bandTop + bandHeight;
  const centerX = (colLeft + colRight) / 2;
  const figureItems = [
    { figure: summary.originalFigure, label: summary.originalLabel },
    ...(summary.hasChange ? [{ figure: summary.changedFigure, label: summary.changedLabel }] : [])
  ];
  figureItems.forEach((item, index) => {
    const sectionTop = figureBandTop + index * bandHeight / figureItems.length + (summary.hasChange ? 0 : 70);
    ctx.font = '600 18px "Noto Serif TC", "Songti TC", serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText(item.label, centerX, sectionTop + 30);
    drawSmallHexagram(ctx, item.figure, centerX, sectionTop + 45);
  });
  ctx.textAlign = 'left';

  const namesTop = bandTop + 2 * bandHeight + 32;
  const namesBottom = bandBottom - 20;
  const drawName = (label, name, x) => {
    const value = `${label}：${name}`;
    const fontSize = [22, 20, 18, 16, 14, 12].find(size =>
      Array.from(value).length * (size + 6) <= namesBottom - namesTop) || 12;
    drawVerticalText(ctx, value, x, namesTop, namesBottom, x - 2,
      { fontSize, stepY: fontSize + 6, bold: true });
  };
  if (summary.hasChange) {
    drawName(summary.changedLabel, summary.changedName, colRight - 34);
    drawName(summary.originalLabel, summary.originalName, colLeft + 35);
  } else {
    drawName(summary.originalLabel, summary.originalName, centerX);
  }
}

function drawColumns(ctx, columns) {
  const left = 82;
  const right = PAGE_WIDTH - 82;
  const top = 259;
  const bottom = PAGE_HEIGHT - 157;
  const width = (right - left) / 8;
  ctx.lineWidth = 2;
  ctx.strokeStyle = RULE;
  ctx.strokeRect(left, top, right - left, bottom - top);
  for (let index = 1; index < 8; index += 1) {
    const x = left + index * width;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
  }
  columns.forEach((column, index) => {
    if (!column) return;
    const colLeft = left + index * width + 9;
    const colRight = left + (index + 1) * width - 9;
    drawVerticalText(ctx, column.label, colRight - 23, top + 35, top + 240, colLeft + 8, {
      fontSize: 27, bold: true, color: column.accent ? '#96594b' : INK
    });
    ctx.strokeStyle = '#d5bcb0';
    ctx.beginPath(); ctx.moveTo(colLeft + 12, top + 265); ctx.lineTo(colRight - 12, top + 265); ctx.stroke();
    if (column.summary) {
      drawSummaryColumn(ctx, column.summary, colLeft, colRight, top, bottom);
      return;
    }
    const body = column.body || '';
    drawVerticalText(ctx, body, colRight - 23, top + 302, bottom - 24, colLeft + 8, {
      fontSize: body.length > 120 ? 19 : body.length > 85 ? 21 : 24,
      stepY: body.length > 120 ? 27 : body.length > 85 ? 29 : 32,
      stepX: body.length > 120 ? 23 : body.length > 85 ? 26 : 29,
      color: column.accent ? '#775046' : INK
    });
  });
}

export function reportColumns(model) {
  const { t, entries } = model;
  const lines = entries.filter(entry => entry.kind === 'line');
  const hasChange = model.movingPositions.length > 0;
  const changedJudgement = hasChange ? reportEntry('judgement', model.changed, 0, null, 'changed') : null;
  return [
    { label: t('iching.judgement'), body: `${t('iching.original')}・${entries[0].hexagramName}：${entries[0].text}${hasChange
      ? `\n${t('iching.changed')}・${changedJudgement.hexagramName}：${changedJudgement.text}` : ''}` },
    ...lines.slice().reverse().map(entry => ({
      label: entry.label,
      body: `${entry.source === 'changed' ? t('iching.changed') : t('iching.original')}・${entry.hexagramName}。${entry.text || t('iching.sourceMissing')}`,
      accent: entry.source === 'changed'
    })),
    {
      label: t('iching.reportSummary'),
      summary: {
        originalLineLabels: model.original.lines.map(entry => entry.label),
        ...(hasChange ? { changedLineLabels: model.changed.lines.map(entry => entry.label) } : {}),
        hasChange,
        originalLabel: t('iching.original'),
        ...(hasChange ? { changedLabel: t('iching.changed') } : {}),
        originalName: fullHexagramName(model.originalFigure, model.original.name),
        ...(hasChange ? { changedName: fullHexagramName(model.changedFigure, model.changed.name) } : {}),
        originalFigure: model.originalFigure,
        ...(hasChange ? { changedFigure: model.changedFigure } : {})
      }
    }
  ];
}

async function renderReportPages(model) {
  if (document.fonts?.ready) await document.fonts.ready;
  const pageDefinitions = [
    { title: model.t('iching.reportTextTitle'), subtitle: model.generatedAt, columns: reportColumns(model) }
  ];
  return pageDefinitions.map((definition, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(PAGE_WIDTH * SCALE);
    canvas.height = Math.round(PAGE_HEIGHT * SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    ctx.scale(SCALE, SCALE);
    drawSheet(ctx, definition.title, definition.subtitle, index, pageDefinitions.length);
    drawColumns(ctx, definition.columns);
    return canvas;
  });
}

function ascii(value) { return new TextEncoder().encode(value); }

// A small image-only PDF writer keeps Chinese glyphs identical to the PNG
// without asking users to install fonts or a PDF library. Each canvas is A4.
export function pdfFromJpegPages(jpegPages, width, height) {
  if (!jpegPages.length) throw new Error('A PDF needs at least one page.');
  const chunks = [];
  const offsets = [];
  let byteCount = 0;
  const append = value => {
    const bytes = typeof value === 'string' ? ascii(value) : value;
    chunks.push(bytes);
    byteCount += bytes.length;
  };
  const begin = id => { offsets[id] = byteCount; append(`${id} 0 obj\n`); };
  const end = () => append('endobj\n');
  const maxId = 2 + jpegPages.length * 3;
  const pageIds = jpegPages.map((_, index) => 3 + index * 3);
  append('%PDF-1.4\n');
  begin(1); append('<< /Type /Catalog /Pages 2 0 R >>\n'); end();
  begin(2); append(`<< /Type /Pages /Count ${jpegPages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>\n`); end();
  jpegPages.forEach((jpeg, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    begin(pageId);
    append(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\n`);
    end();
    const commands = `q\n595.28 0 0 841.89 0 0 cm\n/Im${index} Do\nQ\n`;
    begin(contentId); append(`<< /Length ${ascii(commands).length} >>\nstream\n`); append(commands); append('endstream\n'); end();
    begin(imageId);
    append(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    append(jpeg); append('\nendstream\n'); end();
  });
  const xrefStart = byteCount;
  append(`xref\n0 ${maxId + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= maxId; id += 1) append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}

function jpegBytes(canvas) {
  const data = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  return Uint8Array.from(atob(data), character => character.charCodeAt(0));
}

function canvasPngBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadIChingReport(format, options) {
  if (format !== 'pdf' && format !== 'png') throw new Error('Unsupported report format.');
  const model = buildIChingReportModel(options);
  const pages = await renderReportPages(model);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `interpolate-you-iching-${stamp}.${format}`;
  if (format === 'pdf') {
    const jpegPages = pages.map(jpegBytes);
    saveBlob(pdfFromJpegPages(jpegPages, pages[0].width, pages[0].height), filename);
  } else {
    saveBlob(await canvasPngBlob(pages[0]), filename);
  }
  return { pages: pages.length, filename };
}
