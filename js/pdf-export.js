/* ============================================
   SALENTINO BPM - PDF Export
   Uses jsPDF + autoTable
   ============================================ */

const PDF_BRAND = {
  coffee: [107, 58, 42],
  copper: [184, 101, 42],
  beige: [240, 226, 200],
  cream: [250, 245, 237],
  black: [12, 12, 12],
  white: [255, 255, 255],
  muted: [105, 90, 77],
  successG: [45, 106, 79],
  dangerR: [193, 41, 46],
  warningY: [212, 135, 14],
};

// ─── Build a single-record PDF ──────────────
function buildRecordPDF(form, record) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header bar ──
  doc.setFillColor(...PDF_BRAND.coffee);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(...PDF_BRAND.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SALENTINO COFFEE LAB', margin, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Buenas Prácticas de Manufactura', margin, 19);

  // Form code badge (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(form.code, pageW - margin, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Versión 01 · Julio 2026', pageW - margin, 19, { align: 'right' });

  // Copper accent line
  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(0, 32, pageW, 1.5, 'F');

  y = 42;

  // ── Form title ──
  doc.setTextColor(...PDF_BRAND.black);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(form.title, margin, y);
  y += 8;

  // ── Metadata line ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_BRAND.muted);
  const dateStr = record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '—';
  doc.text(`Registrado: ${dateStr}`, margin, y);
  y += 8;

  // ── Separator ──
  doc.setDrawColor(...PDF_BRAND.beige);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ── Standard fields (2-column key-value) ──
  const data = record.data || {};
  const fieldPairs = [];

  form.fields.forEach(f => {
    const val = data[f.name];
    if (val !== undefined && val !== '') {
      fieldPairs.push([f.label, String(val)]);
    }
  });

  if (fieldPairs.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['Campo', 'Valor']],
      body: fieldPairs,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: PDF_BRAND.coffee,
        textColor: PDF_BRAND.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: PDF_BRAND.black,
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: PDF_BRAND.cream },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: PDF_BRAND.coffee },
      },
      theme: 'grid',
      styles: {
        lineColor: PDF_BRAND.beige,
        lineWidth: 0.3,
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
    if (y > 250) { doc.addPage(); y = margin; }
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_BRAND.coffee);
    doc.text('Firma del responsable:', margin, y);
    y += 4;
    doc.setDrawColor(...PDF_BRAND.muted);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 15, margin + 70, y + 15);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_BRAND.muted);
    doc.text('Nombre y firma', margin, y + 19);
    doc.text('Fecha: _______________', margin + 80, y + 19);
    y += 25;
  }

  // ── Footer on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    // Footer line
    doc.setDrawColor(...PDF_BRAND.beige);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_BRAND.muted);
    doc.text('Salentino Coffee Lab S.A.S. · Salento, Quindío, Colombia', margin, pageH - 8);
    doc.text(`${form.code} · Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  return doc;
}

// ── Render table fields ──
function renderTableFieldsPDF(doc, config, data, y, margin, contentW) {
  if (y > 240) { doc.addPage(); y = 15; }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_BRAND.coffee);
  doc.text(config.label, margin, y);
  y += 5;

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
    headStyles: {
      fillColor: PDF_BRAND.coffee,
      textColor: PDF_BRAND.white,
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { fontSize: 8, textColor: PDF_BRAND.black, cellPadding: 3 },
    alternateRowStyles: { fillColor: PDF_BRAND.cream },
    theme: 'grid',
    styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3, overflow: 'linebreak' },
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  return doc.lastAutoTable.finalY + 8;
}

// ── Render checklist (ingreso planta) ──
function renderChecklistPDF(doc, config, data, y, margin) {
  if (y > 240) { doc.addPage(); y = 15; }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_BRAND.coffee);
  doc.text(config.label, margin, y);
  y += 5;

  // Find all persons
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
      head: [['Nombre', 'Cargo/Visita', ...config.checks]],
      body: rows,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: PDF_BRAND.coffee, textColor: PDF_BRAND.white, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 8, textColor: PDF_BRAND.black, cellPadding: 3 },
      alternateRowStyles: { fillColor: PDF_BRAND.cream },
      theme: 'grid',
      styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3 },
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

  areas.forEach((area, ai) => {
    if (y > 240) { doc.addPage(); y = 15; }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_BRAND.copper);
    doc.text(area.title, margin, y);
    y += 4;

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
      headStyles: { fillColor: PDF_BRAND.coffee, textColor: PDF_BRAND.white, fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: PDF_BRAND.black, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: PDF_BRAND.cream },
      theme: 'grid',
      styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3 },
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  return y;
}

// ── Render verification checklist (agua) ──
function renderVerificationPDF(doc, config, data, y, margin) {
  config.sections.forEach((section, si) => {
    if (y > 240) { doc.addPage(); y = 15; }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_BRAND.copper);
    doc.text(section.title, margin, y);
    y += 4;

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
      headStyles: { fillColor: PDF_BRAND.coffee, textColor: PDF_BRAND.white, fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: PDF_BRAND.black, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: PDF_BRAND.cream },
      theme: 'grid',
      styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40, textColor: PDF_BRAND.muted },
        2: { cellWidth: 15, halign: 'center', textColor: PDF_BRAND.successG },
        3: { cellWidth: 15, halign: 'center', textColor: PDF_BRAND.dangerR },
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  return y;
}

// ─── Export: single record ──────────────────
window.exportRecordPDF = function(formId, recordId) {
  const form = FORMS[formId];
  if (!form) { showToast('Formato no encontrado', 'error'); return; }

  const records = Store.getRecords(formId);
  const record = records.find(r => r.id === recordId);
  if (!record) { showToast('Registro no encontrado', 'error'); return; }

  const doc = buildRecordPDF(form, record);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Salentino_${form.code}_${dateStr}.pdf`);
  showToast('PDF descargado correctamente');
};

// ─── Export: all records for a period ───────
window.exportAllPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let isFirstPage = true;

  // Collect all records
  const allRecords = [];
  for (const key of Object.keys(FORMS)) {
    Store.getRecords(key).forEach(r => {
      allRecords.push({ ...r, formId: key });
    });
  }
  allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (allRecords.length === 0) {
    showToast('No hay registros para exportar', 'warning');
    return;
  }

  // Cover page
  doc.setFillColor(...PDF_BRAND.coffee);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');

  doc.setTextColor(...PDF_BRAND.beige);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SALENTINO', pageW / 2, 80, { align: 'center' });
  doc.setFontSize(14);
  doc.text('COFFEE LAB', pageW / 2, 90, { align: 'center' });

  doc.setFillColor(...PDF_BRAND.copper);
  doc.rect(pageW / 2 - 30, 96, 60, 1, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...PDF_BRAND.white);
  doc.text('Registros BPM', pageW / 2, 115, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...PDF_BRAND.beige);
  const dateRange = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Generado: ${dateRange}`, pageW / 2, 128, { align: 'center' });
  doc.text(`Total registros: ${allRecords.length}`, pageW / 2, 136, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(...PDF_BRAND.copper);
  doc.text('Salento, Quindío, Colombia', pageW / 2, 260, { align: 'center' });

  // Summary table page
  doc.addPage();
  let y = margin;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_BRAND.coffee);
  doc.text('Resumen de Registros', margin, y);
  y += 8;

  // Summary by program
  const summaryBody = [];
  for (const key of Object.keys(FORMS)) {
    const count = Store.getRecords(key).length;
    if (count > 0) {
      summaryBody.push([FORMS[key].code, FORMS[key].title, String(count)]);
    }
  }

  doc.autoTable({
    startY: y,
    head: [['Código', 'Formato', 'Registros']],
    body: summaryBody,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: PDF_BRAND.coffee, textColor: PDF_BRAND.white, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: PDF_BRAND.black, cellPadding: 4 },
    alternateRowStyles: { fillColor: PDF_BRAND.cream },
    theme: 'grid',
    styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 25 },
    },
  });

  // Individual records
  allRecords.forEach(record => {
    doc.addPage();
    const form = FORMS[record.formId];
    // Reuse buildRecordPDF logic but append to existing doc
    const tempDoc = buildRecordPDF(form, record);
    // Can't easily merge jsPDF docs, so we rebuild inline

    const pw = doc.internal.pageSize.getWidth();
    let ry = margin;

    // Mini header
    doc.setFillColor(...PDF_BRAND.coffee);
    doc.rect(0, 0, pw, 22, 'F');
    doc.setTextColor(...PDF_BRAND.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${form.code} — ${form.title}`, margin, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const recDate = record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '—';
    doc.text(`Registrado: ${recDate}`, margin, 16);

    doc.setFillColor(...PDF_BRAND.copper);
    doc.rect(0, 22, pw, 1, 'F');
    ry = 30;

    // Fields
    const data = record.data || {};
    const pairs = [];
    form.fields.forEach(f => {
      const val = data[f.name];
      if (val !== undefined && val !== '') pairs.push([f.label, String(val)]);
    });

    if (pairs.length > 0) {
      doc.autoTable({
        startY: ry,
        head: [['Campo', 'Valor']],
        body: pairs,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: PDF_BRAND.coffee, textColor: PDF_BRAND.white, fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: PDF_BRAND.black, cellPadding: 3 },
        alternateRowStyles: { fillColor: PDF_BRAND.cream },
        theme: 'grid',
        styles: { lineColor: PDF_BRAND.beige, lineWidth: 0.3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: PDF_BRAND.coffee } },
      });
      ry = doc.lastAutoTable.finalY + 6;
    }

    // Table data
    if (form.tableFields) {
      ry = renderTableFieldsPDF(doc, form.tableFields, data, ry, margin, pw - margin * 2);
    }
  });

  // Footers on all pages
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    if (i > 1) { // skip cover page footer
      doc.setDrawColor(...PDF_BRAND.beige);
      doc.setLineWidth(0.5);
      doc.line(margin, ph - 12, pageW - margin, ph - 12);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_BRAND.muted);
      doc.text('Salentino Coffee Lab S.A.S. · Salento, Quindío, Colombia', margin, ph - 8);
      doc.text(`Página ${i} de ${total}`, pageW - margin, ph - 8, { align: 'right' });
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Salentino_BPM_Registros_${dateStr}.pdf`);
  showToast('PDF completo descargado');
};

// ─── Export: audit package ──────────────────
window.exportAuditPackage = function() {
  // Same as exportAllPDF but with a different title
  window.exportAllPDF();
};
