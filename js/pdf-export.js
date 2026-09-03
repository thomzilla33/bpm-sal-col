/* ============================================
   SALENTINO BPM - PDF Export (Branded)
   Brand: Salentino Coffee Lab
   Fonts: Courier (≈ Space Mono) for headings,
          Helvetica (≈ Arial) for body
   Uses jsPDF + autoTable
   ============================================ */

// ─── Brand Palette (RGB for jsPDF) ──────────
const PDF_BRAND = {
  black:    [12, 12, 12],       // #0C0C0C — dark surfaces
  dark:     [26, 20, 16],       // #1A1410 — body text on light
  coffee:   [107, 58, 42],      // #6B3A2A — primary accent
  copper:   [184, 101, 42],     // #B8652A — secondary accent
  beige:    [240, 226, 200],    // #F0E2C8 — warm light accent
  cream:    [250, 245, 237],    // #FAF5ED — page background
  white:    [255, 255, 255],    // #FFFFFF — cards, cell bg
  muted:    [105, 90, 77],      // warm grey — captions
  border:   [232, 221, 208],    // #E8DDD0 — table borders (warm)
  successG: [45, 106, 79],      // #2D6A4F
  dangerR:  [193, 41, 46],      // #C1292E
  warningY: [212, 135, 14],     // #D4870E
  info:     [59, 107, 158],     // #3B6B9E
};

// ─── Logo loader (cached) ───────────────────
let _logoCache = null;
async function loadLogoPNG() {
  if (_logoCache) return _logoCache;
  try {
    const resp = await fetch('icons/simbolo-beige.png');
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { _logoCache = reader.result; resolve(_logoCache); };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Logo load failed:', e);
    return null;
  }
}

// ─── Typography helpers ─────────────────────
// Brand: Space Mono → courier (monospace built-in)
//        Arial      → helvetica (sans built-in)
function setHeadingFont(doc, size, style) {
  doc.setFont('courier', style || 'bold');
  doc.setFontSize(size);
}
function setBodyFont(doc, size, style) {
  doc.setFont('helvetica', style || 'normal');
  doc.setFontSize(size);
}

// ─── Reusable branded header bar ────────────
function drawPageHeader(doc, form, logo) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const headerH = 30;

  // Black header bar
  doc.setFillColor(...PDF_BRAND.black);
  doc.rect(0, 0, pageW, headerH, 'F');

  // Logo symbol
  let textX = margin;
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 4, 22, 22);
    textX = margin + 26;
  }

  // Brand name — courier bold (≈ Space Mono)
  setHeadingFont(doc, 13, 'bold');
  doc.setTextColor(...PDF_BRAND.beige);
  doc.text('SALENTINO', textX, 12);

  // Sub-brand
  setBodyFont(doc, 7.5);
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text('Coffee Lab · Buenas Prácticas de Manufactura', textX, 17.5);

  // Form code badge (right)
  if (form) {
    setHeadingFont(doc, 9, 'bold');
    doc.setTextColor(...PDF_BRAND.copper);
    doc.text(form.code, pageW - margin, 11, { align: 'right' });

    setBodyFont(doc, 7);
    doc.setTextColor(...PDF_BRAND.beige);
    doc.text('Versión 01 · 2026', pageW - margin, 17, { align: 'right' });
  }

  // Copper accent line
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(0, headerH, pageW, 1.2, 'F');

  // Thin beige rule below copper
  doc.setFillColor(...PDF_BRAND.beige);
  doc.rect(0, headerH + 1.2, pageW, 0.3, 'F');

  return headerH + 6; // return Y position after header
}

// ─── Reusable branded footer ────────────────
function drawPageFooter(doc, formCode, pageNum, totalPages) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Copper thin line
  doc.setDrawColor(...PDF_BRAND.copper);
  doc.setLineWidth(0.4);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

  // Left: company
  setBodyFont(doc, 6.5);
  doc.setTextColor(...PDF_BRAND.muted);
  doc.text('Salentino Coffee Lab S.A.S.', margin, pageH - 9.5);

  // Center: origin
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text('Salento, Quindío, Colombia', pageW / 2, pageH - 9.5, { align: 'center' });

  // Right: code + page
  doc.setTextColor(...PDF_BRAND.muted);
  const pageText = formCode
    ? `${formCode} · Pág. ${pageNum}/${totalPages}`
    : `Pág. ${pageNum}/${totalPages}`;
  doc.text(pageText, pageW - margin, pageH - 9.5, { align: 'right' });
}

// ─── Branded section title ──────────────────
function drawSectionTitle(doc, text, y, margin) {
  // Copper left bar + courier heading
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(margin, y - 3.5, 1.5, 5, 'F');
  setHeadingFont(doc, 10, 'bold');
  doc.setTextColor(...PDF_BRAND.coffee);
  doc.text(text, margin + 5, y);
  return y + 6;
}

// ─── Branded sub-section title ──────────────
function drawSubSectionTitle(doc, text, y, margin) {
  setHeadingFont(doc, 8.5, 'bold');
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text(text, margin, y);
  return y + 4.5;
}

// ─── AutoTable brand defaults ───────────────
function brandTableStyles() {
  return {
    headStyles: {
      fillColor: PDF_BRAND.coffee,
      textColor: PDF_BRAND.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      font: 'helvetica',
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: PDF_BRAND.dark,
      font: 'helvetica',
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: PDF_BRAND.cream },
    theme: 'grid',
    styles: {
      lineColor: PDF_BRAND.border,
      lineWidth: 0.25,
      overflow: 'linebreak',
    },
  };
}

// ─── Cream page background ──────────────────
function drawCreamBg(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PDF_BRAND.cream);
  doc.rect(0, 0, pageW, pageH, 'F');
}

// ─── Signature area ─────────────────────────
function drawSignatureArea(doc, y, margin) {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;

  if (y > 240) { doc.addPage(); drawCreamBg(doc); y = 20; }

  y += 4;
  y = drawSectionTitle(doc, 'Firmas y Verificación', y, margin);
  y += 2;

  const colW = (contentW - 15) / 2;

  // Left signature block
  doc.setDrawColor(...PDF_BRAND.copper);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 18, margin + colW, y + 18);

  setBodyFont(doc, 7);
  doc.setTextColor(...PDF_BRAND.muted);
  doc.text('Nombre y firma del responsable', margin, y + 22);
  doc.text('Cargo: _________________________', margin, y + 27);

  // Right signature block
  doc.line(margin + colW + 15, y + 18, pageW - margin, y + 18);
  doc.text('Nombre y firma del verificador', margin + colW + 15, y + 22);
  doc.text('Fecha: _________________________', margin + colW + 15, y + 27);

  return y + 34;
}

// ═══════════════════════════════════════════════
//  BUILD SINGLE-RECORD PDF
// ═══════════════════════════════════════════════
async function buildRecordPDF(form, record) {
  const logo = await loadLogoPNG();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // Cream background
  drawCreamBg(doc);

  // Header
  let y = drawPageHeader(doc, form, logo);

  // Form title
  y += 2;
  setHeadingFont(doc, 13, 'bold');
  doc.setTextColor(...PDF_BRAND.coffee);
  doc.text(form.title, margin, y);
  y += 6;

  // Metadata line
  setBodyFont(doc, 8);
  doc.setTextColor(...PDF_BRAND.muted);
  const dateStr = record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '—';
  doc.text(`Registrado: ${dateStr}    |    ID: ${record.id || '—'}`, margin, y);
  y += 6;

  // Warm separator
  doc.setDrawColor(...PDF_BRAND.beige);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ── Standard fields ──
  const data = record.data || {};
  const fieldPairs = [];
  (form.fields || []).forEach(f => {
    const val = data[f.name];
    if (val !== undefined && val !== '') {
      fieldPairs.push([f.label, String(val)]);
    }
  });

  if (fieldPairs.length > 0) {
    y = drawSectionTitle(doc, 'Datos del Registro', y, margin);

    doc.autoTable({
      startY: y,
      head: [['Campo', 'Valor']],
      body: fieldPairs,
      margin: { left: margin, right: margin },
      ...brandTableStyles(),
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: PDF_BRAND.coffee },
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Table fields ──
  if (form.tableFields) {
    y = renderTableFieldsPDF(doc, form.tableFields, data, y, margin, contentW);
  }

  // ── Checklist fields (ingreso_planta) ──
  if (form.checklistFields) {
    y = renderChecklistPDF(doc, form.checklistFields, data, y, margin);
  }

  // ── Plagas inspection ──
  if (form.plagasInspection) {
    y = renderPlagasPDF(doc, data, y, margin);
  }

  // ── Verification checklist (agua) ──
  if (form.checklistVerification) {
    y = renderVerificationPDF(doc, form.checklistVerification, data, y, margin);
  }

  // ── Signature area ──
  if (form.hasSignature) {
    y = drawSignatureArea(doc, y, margin);
  }

  // ── Footers on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, form.code, i, totalPages);
  }

  return doc;
}

// ── Render table fields ──
function renderTableFieldsPDF(doc, config, data, y, margin, contentW) {
  if (y > 235) { doc.addPage(); drawCreamBg(doc); y = 20; }

  y = drawSectionTitle(doc, config.label, y, margin);

  const head = [config.columns];
  const body = [];
  config.rows.forEach((row, ri) => {
    const rowData = [];
    config.colKeys.forEach((key, ci) => {
      if (ci === 0 && row.area) {
        rowData.push(row.area);
      } else {
        rowData.push(data[`table_${ri}_${key}`] || '');
      }
    });
    body.push(rowData);
  });

  doc.autoTable({
    startY: y,
    head: head,
    body: body,
    margin: { left: margin, right: margin },
    ...brandTableStyles(),
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  return doc.lastAutoTable.finalY + 8;
}

// ── Render checklist (ingreso planta) ──
function renderChecklistPDF(doc, config, data, y, margin) {
  if (y > 235) { doc.addPage(); drawCreamBg(doc); y = 20; }

  y = drawSectionTitle(doc, config.label, y, margin);

  let personIdx = 0;
  const rows = [];
  while (data[`persona_nombre_${personIdx}`] !== undefined || personIdx === 0) {
    const name = data[`persona_nombre_${personIdx}`] || '';
    const cargo = data[`persona_cargo_${personIdx}`] || '';
    const checks = config.checks.map(c => {
      const key = `check_${personIdx}_${c.toLowerCase().replace(/\s/g, '_')}`;
      return data[key] === 'Sí' ? '✓' : '✗';
    });
    if (name || cargo) {
      rows.push([name, cargo, ...checks]);
    }
    personIdx++;
    if (personIdx > 20) break;
  }

  if (rows.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['Nombre', 'Cargo / Visita', ...config.checks]],
      body: rows,
      margin: { left: margin, right: margin },
      ...brandTableStyles(),
    });
    return doc.lastAutoTable.finalY + 8;
  }
  return y + 5;
}

// ── Render plagas inspection ──
function renderPlagasPDF(doc, data, y, margin) {
  const areas = [
    { title: 'Área de Producción', count: 5 },
    { title: 'Área de Almacenamiento', count: 2 },
    { title: 'Área Administrativa', count: 2 },
    { title: 'Área de Transición Sanitaria', count: 2 },
    { title: 'Baño, Químicos y Basuras', count: 3 },
  ];

  y = drawSectionTitle(doc, 'Inspección de Plagas', y, margin);

  areas.forEach((area, ai) => {
    if (y > 235) { doc.addPage(); drawCreamBg(doc); y = 20; }

    y = drawSubSectionTitle(doc, area.title, y, margin);

    const body = [];
    for (let ii = 0; ii < area.count; ii++) {
      body.push([
        data[`plagas_${ai}_${ii}_s1`] || '',
        data[`plagas_${ai}_${ii}_s2`] || '',
        data[`plagas_${ai}_${ii}_s3`] || '',
        data[`plagas_${ai}_${ii}_s4`] || '',
        data[`plagas_${ai}_${ii}_found`] || '',
        data[`plagas_${ai}_${ii}_action`] || '',
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', '¿Plaga?', 'Acción']],
      body: body,
      margin: { left: margin, right: margin },
      ...brandTableStyles(),
      headStyles: { ...brandTableStyles().headStyles, fontSize: 7 },
      bodyStyles: { ...brandTableStyles().bodyStyles, fontSize: 7, cellPadding: 2.5 },
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  return y;
}

// ── Render verification checklist (agua) ──
function renderVerificationPDF(doc, config, data, y, margin) {
  y = drawSectionTitle(doc, 'Verificación de Calidad', y, margin);

  config.sections.forEach((section, si) => {
    if (y > 235) { doc.addPage(); drawCreamBg(doc); y = 20; }

    y = drawSubSectionTitle(doc, section.title, y, margin);

    const body = section.items.map((item, ii) => {
      const val = data[`agua_${si}_${ii}`] || '';
      const obs = data[`agua_${si}_${ii}_obs`] || '';
      return [
        item.aspect,
        item.criteria,
        val === 'cumple' ? '✓' : '',
        val === 'no_cumple' ? '✗' : '',
        obs,
      ];
    });

    doc.autoTable({
      startY: y,
      head: [['Aspecto', 'Criterio', 'Cumple', 'No cumple', 'Obs.']],
      body: body,
      margin: { left: margin, right: margin },
      ...brandTableStyles(),
      headStyles: { ...brandTableStyles().headStyles, fontSize: 7 },
      bodyStyles: { ...brandTableStyles().bodyStyles, fontSize: 7, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 38, textColor: PDF_BRAND.muted },
        2: { cellWidth: 14, halign: 'center', textColor: PDF_BRAND.successG },
        3: { cellWidth: 14, halign: 'center', textColor: PDF_BRAND.dangerR },
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  return y;
}


// ═══════════════════════════════════════════════
//  COVER PAGE (for exportAllPDF / audit package)
// ═══════════════════════════════════════════════
async function drawCoverPage(doc, title, subtitle, recordCount) {
  const logo = await loadLogoPNG();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  // Full black background
  doc.setFillColor(...PDF_BRAND.black);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Top decorative copper rules
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(0, 0, pageW, 2, 'F');
  doc.setFillColor(...PDF_BRAND.beige);
  doc.rect(0, 2, pageW, 0.5, 'F');

  // Logo symbol (centered, large)
  if (logo) {
    doc.addImage(logo, 'PNG', cx - 22, 50, 44, 44);
  }

  // Brand name — courier bold (≈ Space Mono), letter-spaced
  const nameY = logo ? 108 : 80;
  setHeadingFont(doc, 30, 'bold');
  doc.setTextColor(...PDF_BRAND.beige);
  doc.text('S A L E N T I N O', cx, nameY, { align: 'center' });

  // Sub-brand
  setHeadingFont(doc, 11, 'normal');
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text('C O F F E E   L A B', cx, nameY + 10, { align: 'center' });

  // Copper divider
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(cx - 35, nameY + 18, 70, 0.8, 'F');

  // Title (e.g. "Registros BPM")
  setHeadingFont(doc, 20, 'bold');
  doc.setTextColor(...PDF_BRAND.white);
  doc.text(title, cx, nameY + 35, { align: 'center' });

  // Subtitle (e.g. "Buenas Prácticas de Manufactura")
  setBodyFont(doc, 11);
  doc.setTextColor(...PDF_BRAND.beige);
  doc.text(subtitle, cx, nameY + 44, { align: 'center' });

  // Date + count
  const dateRange = new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  setBodyFont(doc, 10);
  doc.setTextColor(...PDF_BRAND.muted);
  doc.text(`Generado: ${dateRange}`, cx, nameY + 60, { align: 'center' });
  if (recordCount !== undefined) {
    doc.text(`Total de registros: ${recordCount}`, cx, nameY + 68, { align: 'center' });
  }

  // Bottom decorative section
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(0, pageH - 28, pageW, 0.5, 'F');

  setHeadingFont(doc, 8, 'normal');
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text('Salento, Quindío, Colombia', cx, pageH - 18, { align: 'center' });

  setBodyFont(doc, 7);
  doc.setTextColor(...PDF_BRAND.muted);
  doc.text('Salentino Coffee Lab S.A.S.  ·  NIT: ___________  ·  Registro INVIMA', cx, pageH - 12, { align: 'center' });

  // Bottom copper bar
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(0, pageH - 2.5, pageW, 2, 'F');
  doc.setFillColor(...PDF_BRAND.beige);
  doc.rect(0, pageH - 2.5, pageW, 0.5, 'F');
}


// ═══════════════════════════════════════════════
//  EXPORT: SINGLE RECORD
// ═══════════════════════════════════════════════
window.exportRecordPDF = async function(formId, recordId) {
  try {
    if (!window.jspdf) { showToast('Error: jsPDF no cargó. Verifica tu conexión a internet.', 'error'); return; }
    const form = FORMS[formId];
    if (!form) { showToast('Formato no encontrado', 'error'); return; }

    const records = Store.getRecords(formId);
    const record = records.find(r => r.id === recordId);
    if (!record) { showToast('Registro no encontrado', 'error'); return; }

    showToast('Generando PDF...', 'info');
    const doc = await buildRecordPDF(form, record);
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Salentino_${form.code}_${dateStr}.pdf`);
    showToast('PDF descargado correctamente');
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('Error al generar PDF: ' + err.message, 'error');
  }
};


// ═══════════════════════════════════════════════
//  EXPORT: ALL RECORDS
// ═══════════════════════════════════════════════
window.exportAllPDF = async function() {
  try {
    if (!window.jspdf) { showToast('Error: jsPDF no cargó. Verifica tu conexión a internet.', 'error'); return; }
    const logo = await loadLogoPNG();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Collect all records
    const allRecords = [];
    for (const key of Object.keys(FORMS)) {
      Store.getRecords(key).forEach(r => {
        allRecords.push({ ...r, formId: key });
      });
    }
    allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allRecords.length === 0) {
      showToast('No hay registros para exportar. Llena un formulario primero.', 'warning');
      return;
    }

    showToast('Generando PDF...', 'info');

    // ── Cover page ──
    await drawCoverPage(doc, 'Registros BPM', 'Buenas Prácticas de Manufactura', allRecords.length);

    // ── Summary table page ──
    doc.addPage();
    drawCreamBg(doc);
    let y = drawPageHeader(doc, null, logo);

    y += 2;
    y = drawSectionTitle(doc, 'Resumen de Registros', y, margin);

    const summaryBody = [];
    for (const key of Object.keys(FORMS)) {
      const count = Store.getRecords(key).length;
      if (count > 0) {
        summaryBody.push([FORMS[key].code, FORMS[key].title, String(count)]);
      }
    }

    if (summaryBody.length > 0) {
      doc.autoTable({
        startY: y,
        head: [['Código', 'Formato', 'Registros']],
        body: summaryBody,
        margin: { left: margin, right: margin },
        ...brandTableStyles(),
        bodyStyles: { ...brandTableStyles().bodyStyles, fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 30, textColor: PDF_BRAND.coffee, font: 'courier' },
          2: { halign: 'center', cellWidth: 25 },
        },
      });
    }

    // ── Individual record pages ──
    allRecords.forEach(record => {
      doc.addPage();
      drawCreamBg(doc);
      const form = FORMS[record.formId];
      if (!form) return;

      const pw = doc.internal.pageSize.getWidth();
      let ry = drawPageHeader(doc, form, logo);

      // Form title
      ry += 2;
      setHeadingFont(doc, 11, 'bold');
      doc.setTextColor(...PDF_BRAND.coffee);
      doc.text(form.title, margin, ry);
      ry += 5;

      // Date
      setBodyFont(doc, 7.5);
      doc.setTextColor(...PDF_BRAND.muted);
      const recDate = record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '—';
      doc.text(`Registrado: ${recDate}`, margin, ry);
      ry += 6;

      // Fields
      const data = record.data || {};
      const pairs = [];
      (form.fields || []).forEach(f => {
        const val = data[f.name];
        if (val !== undefined && val !== '') pairs.push([f.label, String(val)]);
      });

      if (pairs.length > 0) {
        doc.autoTable({
          startY: ry,
          head: [['Campo', 'Valor']],
          body: pairs,
          margin: { left: margin, right: margin },
          ...brandTableStyles(),
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, textColor: PDF_BRAND.coffee },
          },
        });
        ry = doc.lastAutoTable.finalY + 6;
      }

      // Table data
      if (form.tableFields) {
        ry = renderTableFieldsPDF(doc, form.tableFields, data, ry, margin, pw - margin * 2);
      }

      // Checklist
      if (form.checklistFields) {
        ry = renderChecklistPDF(doc, form.checklistFields, data, ry, margin);
      }

      // Plagas
      if (form.plagasInspection) {
        ry = renderPlagasPDF(doc, data, ry, margin);
      }

      // Agua verification
      if (form.checklistVerification) {
        ry = renderVerificationPDF(doc, form.checklistVerification, data, ry, margin);
      }
    });

    // ── Footers on all pages (skip cover) ──
    const total = doc.internal.getNumberOfPages();
    for (let i = 2; i <= total; i++) {
      doc.setPage(i);
      drawPageFooter(doc, null, i - 1, total - 1);
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Salentino_BPM_Registros_${dateStr}.pdf`);
    showToast('PDF completo descargado');
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('Error al generar PDF: ' + err.message, 'error');
  }
};


// ═══════════════════════════════════════════════
//  EXPORT: AUDIT PACKAGE
// ═══════════════════════════════════════════════
window.exportAuditPackage = async function() {
  try {
    if (!window.jspdf) { showToast('Error: jsPDF no cargó. Verifica tu conexión a internet.', 'error'); return; }
    const logo = await loadLogoPNG();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Collect all records grouped by form
    const formGroups = {};
    for (const key of Object.keys(FORMS)) {
      const recs = Store.getRecords(key);
      if (recs.length > 0) formGroups[key] = recs;
    }

    const totalRecords = Object.values(formGroups).reduce((sum, arr) => sum + arr.length, 0);
    if (totalRecords === 0) {
      showToast('No hay registros para el paquete de auditoría.', 'warning');
      return;
    }

    showToast('Generando paquete de auditoría...', 'info');

    // ── Cover page ──
    await drawCoverPage(doc, 'Paquete de Auditoría', 'Documentación INVIMA · Buenas Prácticas de Manufactura', totalRecords);

    // ── Table of contents ──
    doc.addPage();
    drawCreamBg(doc);
    let y = drawPageHeader(doc, null, logo);
    y += 2;
    y = drawSectionTitle(doc, 'Tabla de Contenido', y, margin);

    const tocBody = [];
    let pageCounter = 3; // cover=1, TOC=2, first section starts at 3
    for (const key of Object.keys(FORMS)) {
      if (!formGroups[key]) continue;
      tocBody.push([
        FORMS[key].code,
        FORMS[key].title,
        String(formGroups[key].length),
        String(pageCounter),
      ]);
      pageCounter += formGroups[key].length + 1; // +1 for section divider
    }

    doc.autoTable({
      startY: y,
      head: [['Código', 'Programa / Formato', 'Registros', 'Pág.']],
      body: tocBody,
      margin: { left: margin, right: margin },
      ...brandTableStyles(),
      bodyStyles: { ...brandTableStyles().bodyStyles, fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 28, textColor: PDF_BRAND.coffee, font: 'courier' },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 18, textColor: PDF_BRAND.copper },
      },
    });

    // ── Records grouped by form type ──
    for (const key of Object.keys(FORMS)) {
      if (!formGroups[key]) continue;
      const form = FORMS[key];
      const records = formGroups[key];

      // Section divider page
      doc.addPage();
      const ph = doc.internal.pageSize.getHeight();

      doc.setFillColor(...PDF_BRAND.coffee);
      doc.rect(0, 0, pageW, ph, 'F');

      // Copper accent bars
      doc.setFillColor(...PDF_BRAND.copper);
      doc.rect(0, 0, pageW, 2, 'F');
      doc.rect(0, ph - 2, pageW, 2, 'F');

      // Form code large
      setHeadingFont(doc, 24, 'bold');
      doc.setTextColor(...PDF_BRAND.copper);
      doc.text(form.code, pageW / 2, ph / 2 - 12, { align: 'center' });

      // Form title
      setHeadingFont(doc, 16, 'bold');
      doc.setTextColor(...PDF_BRAND.white);
      doc.text(form.title, pageW / 2, ph / 2 + 2, { align: 'center' });

      // Record count
      setBodyFont(doc, 10);
      doc.setTextColor(...PDF_BRAND.beige);
      doc.text(`${records.length} registro${records.length !== 1 ? 's' : ''}`, pageW / 2, ph / 2 + 14, { align: 'center' });

      // Individual records
      records.forEach(record => {
        doc.addPage();
        drawCreamBg(doc);
        let ry = drawPageHeader(doc, form, logo);

        ry += 2;
        setHeadingFont(doc, 11, 'bold');
        doc.setTextColor(...PDF_BRAND.coffee);
        doc.text(form.title, margin, ry);
        ry += 5;

        setBodyFont(doc, 7.5);
        doc.setTextColor(...PDF_BRAND.muted);
        const recDate = record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '—';
        doc.text(`Registrado: ${recDate}`, margin, ry);
        ry += 6;

        const data = record.data || {};
        const pairs = [];
        (form.fields || []).forEach(f => {
          const val = data[f.name];
          if (val !== undefined && val !== '') pairs.push([f.label, String(val)]);
        });

        if (pairs.length > 0) {
          doc.autoTable({
            startY: ry,
            head: [['Campo', 'Valor']],
            body: pairs,
            margin: { left: margin, right: margin },
            ...brandTableStyles(),
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 55, textColor: PDF_BRAND.coffee },
            },
          });
          ry = doc.lastAutoTable.finalY + 6;
        }

        if (form.tableFields) {
          ry = renderTableFieldsPDF(doc, form.tableFields, data, ry, margin, pageW - margin * 2);
        }
        if (form.checklistFields) {
          ry = renderChecklistPDF(doc, form.checklistFields, data, ry, margin);
        }
        if (form.plagasInspection) {
          ry = renderPlagasPDF(doc, data, ry, margin);
        }
        if (form.checklistVerification) {
          ry = renderVerificationPDF(doc, form.checklistVerification, data, ry, margin);
        }
        if (form.hasSignature) {
          ry = drawSignatureArea(doc, ry, margin);
        }
      });
    }

    // ── Footers on all pages (skip cover) ──
    const total = doc.internal.getNumberOfPages();
    for (let i = 2; i <= total; i++) {
      doc.setPage(i);
      drawPageFooter(doc, 'PAQUETE AUDITORÍA', i - 1, total - 1);
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Salentino_Paquete_Auditoria_${dateStr}.pdf`);
    showToast('Paquete de auditoría descargado');
  } catch (err) {
    console.error('Audit package error:', err);
    showToast('Error al generar paquete: ' + err.message, 'error');
  }
};
