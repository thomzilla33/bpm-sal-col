/* ============================================
   SALENTINO BPM - Application
   ============================================ */

// ─── Lucide Icon Renderer ───────────────────
// Converts <i class="lucide-xxx ..."> to <i data-lucide="xxx" class="...">
// then calls lucide.createIcons() to render SVGs
function renderIcons(root) {
  const scope = root || document;
  scope.querySelectorAll('i[class*="lucide-"]').forEach(el => {
    if (el.dataset.lucide) return; // already converted
    const cls = [...el.classList].find(c => c.startsWith('lucide-'));
    if (cls) {
      el.dataset.lucide = cls.replace('lucide-', '');
      el.classList.remove(cls);
    }
  });
  if (window.lucide) {
    lucide.createIcons({ nameAttr: 'data-lucide' });
  }
}

// ─── State ───────────────────────────────────
const Store = {
  _data: JSON.parse(localStorage.getItem('salentino_bpm') || '{}'),

  get(key, fallback = null) {
    return this._data[key] ?? fallback;
  },

  set(key, value) {
    this._data[key] = value;
    localStorage.setItem('salentino_bpm', JSON.stringify(this._data));
  },

  getRecords(formId) {
    return this.get(`records_${formId}`, []);
  },

  addRecord(formId, data) {
    const records = this.getRecords(formId);
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      formId,
      createdAt: new Date().toISOString(),
      ...data
    };
    records.unshift(record);
    this.set(`records_${formId}`, records);
    return record;
  },

  getAllRecordsCount() {
    let count = 0;
    for (const key of Object.keys(this._data)) {
      if (key.startsWith('records_')) count += (this._data[key]?.length || 0);
    }
    return count;
  },

  getTodayRecordsCount() {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const key of Object.keys(this._data)) {
      if (key.startsWith('records_')) {
        count += (this._data[key] || []).filter(r => r.createdAt?.startsWith(today)).length;
      }
    }
    return count;
  }
};

// ─── Format Definitions ──────────────────────
const PROGRAMS = [
  {
    id: 'lyd',
    name: 'Limpieza y Desinfección',
    icon: 'lucide-spray-can',
    color: 'blue',
    forms: ['limpieza', 'desinfeccion', 'inventario_ld', 'ingreso_planta']
  },
  {
    id: 'produccion',
    name: 'Producción y Trazabilidad',
    icon: 'lucide-flask-conical',
    color: 'brown',
    forms: ['produccion_lote', 'control_temp', 'muestreo']
  },
  {
    id: 'calidad',
    name: 'Calidad y No Conformidades',
    icon: 'lucide-shield-check',
    color: 'red',
    forms: ['no_conformidad']
  },
  {
    id: 'soporte',
    name: 'Programas de Soporte',
    icon: 'lucide-wrench',
    color: 'amber',
    forms: ['residuos', 'plagas', 'agua_filtracion', 'mantenimiento']
  },
  {
    id: 'capacitacion',
    name: 'Capacitación',
    icon: 'lucide-graduation-cap',
    color: 'green',
    forms: ['capacitacion']
  }
];

const FORMS = {
  limpieza: {
    id: 'limpieza',
    code: 'FOR-LYD-001',
    title: 'Formato de Limpieza',
    icon: 'lucide-sparkles',
    color: 'blue',
    fields: [
      { name: 'fecha_produccion', label: 'Fecha de producción', type: 'date', required: true },
      { name: 'lote_produccion', label: 'Lote de producción', type: 'text', required: true, placeholder: 'Ej: SCL-2026-0901-001' },
      { name: 'hora_inicio', label: 'Hora de inicio', type: 'time', required: true, half: true },
      { name: 'hora_fin', label: 'Hora de finalización', type: 'time', required: true, half: true },
      { name: 'operario', label: 'Operario responsable', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Detalle de Limpieza',
      columns: ['Elemento / Área', 'Producto usado', 'Técnica', 'Frecuencia'],
      rows: [
        { area: 'Mesón de producción' },
        { area: 'Equipos de producción' },
        { area: 'Utensilios' },
        { area: 'Pisos área de producción' },
        { area: 'Lavaplatos' },
        { area: 'Área de almacenamiento' },
      ],
      colKeys: ['area', 'producto', 'tecnica', 'frecuencia']
    },
    hasSignature: true
  },

  desinfeccion: {
    id: 'desinfeccion',
    code: 'FOR-LYD-002',
    title: 'Formato de Desinfección',
    icon: 'lucide-shield-plus',
    color: 'blue',
    fields: [
      { name: 'fecha_produccion', label: 'Fecha de producción', type: 'date', required: true },
      { name: 'lote_produccion', label: 'Lote de producción', type: 'text', required: true },
      { name: 'hora_inicio', label: 'Hora de inicio', type: 'time', required: true, half: true },
      { name: 'hora_fin', label: 'Hora de finalización', type: 'time', required: true, half: true },
      { name: 'operario', label: 'Operario responsable', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Detalle de Desinfección',
      columns: ['Elemento / Área', 'Producto usado', 'Técnica', 'Frecuencia'],
      rows: [
        { area: 'Mesón de producción' },
        { area: 'Equipos de producción' },
        { area: 'Utensilios' },
        { area: 'Pisos área de producción' },
        { area: 'Lavaplatos' },
        { area: 'Área de almacenamiento' },
      ],
      colKeys: ['area', 'producto', 'tecnica', 'frecuencia']
    },
    hasSignature: true
  },

  inventario_ld: {
    id: 'inventario_ld',
    code: 'FOR-LYD-003',
    title: 'Inventario de Productos de Limpieza y Desinfección',
    icon: 'lucide-package',
    color: 'blue',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'verificado_por', label: 'Verificado por', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Inventario de Productos',
      columns: ['Producto', 'Código', 'Inicial', 'Compradas', 'Usadas', 'Final', 'Observaciones'],
      rows: [
        { area: '' }, { area: '' }, { area: '' }, { area: '' }, { area: '' }
      ],
      colKeys: ['producto', 'codigo', 'inicial', 'compradas', 'usadas', 'final', 'observaciones']
    },
    hasSignature: true
  },

  ingreso_planta: {
    id: 'ingreso_planta',
    code: 'FOR-LYD-004',
    title: 'Formato de Ingreso a la Planta',
    icon: 'lucide-door-open',
    color: 'blue',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    ],
    checklistFields: {
      label: 'Verificación de Ingreso',
      personFields: ['nombre', 'cargo_visita'],
      checks: ['Tapabocas', 'Delantal', 'Lavado de manos', 'Sin joyas']
    },
    hasSignature: true
  },

  no_conformidad: {
    id: 'no_conformidad',
    code: 'FOR-BPM-001',
    title: 'No Conformidades y Acciones Correctivas',
    icon: 'lucide-alert-triangle',
    color: 'red',
    fields: [
      { name: 'fecha_hora', label: 'Fecha y hora del evento', type: 'datetime-local', required: true },
      { name: 'area_equipo', label: 'Área / Equipo / Proceso afectado', type: 'text', required: true },
      { name: 'nc_detectada', label: 'No conformidad detectada', type: 'textarea', required: true },
      { name: 'causa_posible', label: 'Causa posible identificada', type: 'textarea', required: true },
      { name: 'accion_inmediata', label: 'Acción inmediata tomada', type: 'textarea', required: true },
      { name: 'accion_correctiva', label: 'Acción correctiva definida', type: 'textarea', required: true },
      { name: 'responsable', label: 'Responsable de la acción correctiva', type: 'text', required: true },
      { name: 'fecha_limite', label: 'Fecha límite de implementación', type: 'date', required: true },
      { name: 'verificacion', label: '¿Se verificó la actividad?', type: 'select', options: ['Pendiente', 'Sí', 'No'], required: true },
      { name: 'resultado_verificacion', label: 'Resultado de la verificación', type: 'textarea' },
    ],
    hasSignature: false
  },

  residuos: {
    id: 'residuos',
    code: 'FOR-RSD-001',
    title: 'Formato de Evacuación de Residuos',
    icon: 'lucide-trash-2',
    color: 'amber',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'responsable', label: 'Responsable de la evacuación', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Clasificación de Residuos y Estado de Canecas',
      columns: ['Clasificación', 'Estado caneca', 'Observación'],
      rows: [
        { area: 'Aprovechables (blanca)' },
        { area: 'No aprovechables (negra)' },
        { area: 'Orgánicos (verde)' },
        { area: 'Peligrosos (roja)' },
      ],
      colKeys: ['clasificacion', 'estado_caneca', 'observacion']
    },
    hasSignature: true
  },

  plagas: {
    id: 'plagas',
    code: 'FOR-CIP-001',
    title: 'Inspección Visual Interna (Plagas)',
    icon: 'lucide-bug',
    color: 'amber',
    fields: [
      { name: 'mes', label: 'Mes', type: 'month', required: true },
      { name: 'inspector', label: 'Inspector', type: 'text', required: true },
    ],
    plagasInspection: true,
    hasSignature: true
  },

  agua_filtracion: {
    id: 'agua_filtracion',
    code: 'FOR-ACA-001',
    title: 'Verificación de Agua y Filtración',
    icon: 'lucide-droplets',
    color: 'amber',
    fields: [
      { name: 'fecha', label: 'Fecha de verificación', type: 'date', required: true },
      { name: 'revisado_por', label: 'Revisado por', type: 'text', required: true },
    ],
    checklistVerification: {
      sections: [
        {
          title: 'Verificación del Suministro de Agua',
          items: [
            { aspect: 'El suministro viene de una fuente autorizada', criteria: 'Cuenta con concesión vigente' },
            { aspect: 'El agua es apta para el consumo', criteria: 'Cumple con los parámetros establecidos' },
            { aspect: 'La presión del agua es constante', criteria: 'Permite el desarrollo de operaciones' },
            { aspect: 'No se presentan interrupciones en el servicio', criteria: 'Suministro continuo y suficiente' },
          ]
        },
        {
          title: 'Verificación del Sistema de Filtración',
          items: [
            { aspect: 'Los filtros se encuentran en buen estado', criteria: 'No presentan daños, rupturas o fugas' },
            { aspect: 'Los filtros se encuentran limpios', criteria: 'Sin acumulación de suciedad' },
            { aspect: 'Se realiza cambio de filtros según frecuencia', criteria: 'Se cumple con el tiempo de uso' },
          ]
        },
        {
          title: 'Verificación del Sistema de Abastecimiento',
          items: [
            { aspect: 'Inspección de tuberías visibles', criteria: 'Sin daños aparentes' },
            { aspect: 'Inspección de llaves y puntos de suministro', criteria: 'Funcionamiento correcto' },
            { aspect: 'Verificación de fugas o daños visibles', criteria: 'Sin fugas detectadas' },
            { aspect: 'Inspección general del sistema de filtración', criteria: 'Estado operativo' },
          ]
        }
      ]
    },
    hasSignature: true
  },

  mantenimiento: {
    id: 'mantenimiento',
    code: 'FOR-MAN-001',
    title: 'Mantenimiento de Equipos',
    icon: 'lucide-settings',
    color: 'amber',
    fields: [
      { name: 'verificado_por', label: 'Verificado por', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Registro de Mantenimiento',
      columns: ['Fecha programada', 'Actividad', 'Equipo', 'Hallazgo', 'Acción tomada', 'Responsable'],
      rows: [
        { area: '' }, { area: '' }, { area: '' }, { area: '' }
      ],
      colKeys: ['fecha_prog', 'actividad', 'equipo', 'hallazgo', 'accion', 'responsable']
    },
    hasSignature: true
  },

  produccion_lote: {
    id: 'produccion_lote',
    code: 'FOR-TTM-001',
    title: 'Registro de Producción y Trazabilidad de Lotes',
    icon: 'lucide-flask-conical',
    color: 'brown',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'lote', label: 'Lote', type: 'text', required: true, placeholder: 'SCL-2026-0902-001' },
      { name: 'cafe_utilizado', label: 'Café utilizado', type: 'text', required: true, placeholder: 'Origen, variedad, cantidad' },
      { name: 'agua_utilizada', label: 'Agua utilizada (litros)', type: 'number', required: true },
      { name: 'tiempo', label: 'Tiempo de extracción', type: 'text', required: true, placeholder: 'Ej: 18 horas' },
      { name: 'cant_producida', label: 'Cantidad producida (litros)', type: 'number', required: true },
      { name: 'cant_botellas', label: 'Cantidad de botellas', type: 'number', required: true },
    ],
    hasSignature: true
  },

  control_temp: {
    id: 'control_temp',
    code: 'FOR-TTM-002',
    title: 'Registro de Control de Temperatura',
    icon: 'lucide-thermometer',
    color: 'brown',
    fields: [],
    tableFields: {
      label: 'Registro de Control de Temperatura',
      columns: ['#', 'Fecha', 'Hora', 'Equipo', 'Temperatura', 'Rango', 'Cumple', 'Observación'],
      rows: Array.from({ length: 8 }, (_, i) => ({ area: String(i + 1) })),
      colKeys: ['num', 'fecha', 'hora', 'equipo', 'temperatura', 'rango', 'cumple', 'observacion']
    },
    hasSignature: true
  },

  muestreo: {
    id: 'muestreo',
    code: 'FOR-TTM-003',
    title: 'Registro de Muestreo',
    icon: 'lucide-test-tubes',
    color: 'brown',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'lote', label: 'Lote', type: 'text', required: true },
      { name: 'fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { name: 'cant_producida', label: 'Cantidad producida', type: 'number', required: true },
      { name: 'cant_muestra', label: 'Cantidad de muestra', type: 'number', required: true },
      { name: 'identificacion', label: 'Identificación', type: 'text', required: true },
      { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true },
      { name: 'temperatura', label: 'Temperatura', type: 'text', required: true },
    ],
    hasSignature: true
  },

  capacitacion: {
    id: 'capacitacion',
    code: 'FOR-CAP-001',
    title: 'Registro de Asistentes a Capacitación',
    icon: 'lucide-graduation-cap',
    color: 'green',
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'hora', label: 'Hora', type: 'time', required: true, half: true },
      { name: 'duracion', label: 'Duración', type: 'text', required: true, half: true, placeholder: 'Ej: 2 horas' },
      { name: 'lugar', label: 'Lugar', type: 'text', required: true },
      { name: 'objetivo', label: 'Objetivo de la capacitación', type: 'textarea', required: true },
      { name: 'facilitador', label: 'Facilitador', type: 'text', required: true },
    ],
    tableFields: {
      label: 'Registro de Asistentes',
      columns: ['#', 'Nombre completo', 'Cargo', 'Documento'],
      rows: Array.from({ length: 8 }, (_, i) => ({ area: String(i + 1) })),
      colKeys: ['num', 'nombre', 'cargo', 'documento']
    },
    hasSignature: false
  }
};

// ─── Navigation Config ───────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: 'lucide-layout-dashboard', mobileNav: true },
  { id: 'formatos', label: 'Formatos', icon: 'lucide-clipboard-list', mobileNav: true },
  { id: 'produccion', label: 'Producción', icon: 'lucide-flask-conical', mobileNav: true },
  { id: 'registros', label: 'Registros', icon: 'lucide-history', mobileNav: true },
  { id: 'reportes', label: 'Reportes', icon: 'lucide-bar-chart-3', mobileNav: true },
];

// ─── Router ──────────────────────────────────
const Router = {
  current: null,
  params: {},

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  navigate(route, params = {}) {
    this.params = params;
    window.location.hash = route;
  },

  resolve() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    this.current = parts[0];
    this.params = { sub: parts[1], extra: parts[2] };
    this.render();
  },

  render() {
    const content = document.getElementById('content');
    content.scrollTop = 0;

    const views = {
      dashboard: renderDashboard,
      formatos: renderFormatos,
      produccion: renderProduccion,
      registros: renderRegistros,
      reportes: renderReportes,
      form: renderFormPage,
    };

    const viewFn = views[this.current] || views.dashboard;
    content.innerHTML = '';
    const el = viewFn(this.params);
    if (typeof el === 'string') {
      content.innerHTML = el;
    } else if (el instanceof HTMLElement) {
      content.appendChild(el);
    }

    updateNav();
    updateTopbar();
    initCharts();
    initSignaturePads();
    closeSidebar();
    renderIcons();
  }
};

// ─── Nav Rendering ───────────────────────────
function buildNav() {
  const sidebarNav = document.getElementById('sidebar-nav');
  const bottomNav = document.getElementById('bottom-nav');

  // Sidebar
  let sidebarHTML = '<div class="nav-section-label">Principal</div>';
  NAV_ITEMS.forEach(item => {
    const badge = item.id === 'formatos' ? '<span class="badge"><i class="lucide-file-stack" style="margin-right:2px;font-size:0.65rem;"></i>13</span>' : '';
    sidebarHTML += `
      <button class="nav-item" data-route="${item.id}" onclick="Router.navigate('${item.id}')">
        <i class="${item.icon}"></i>
        ${item.label}
        ${badge}
      </button>`;
  });
  sidebarNav.innerHTML = sidebarHTML;

  // Bottom nav
  const mobileItems = NAV_ITEMS.filter(i => i.mobileNav);
  bottomNav.innerHTML = mobileItems.map(item => `
    <button class="bnav-item" data-route="${item.id}" onclick="Router.navigate('${item.id}')">
      <i class="${item.icon}"></i>
      <span>${item.label}</span>
    </button>
  `).join('');

  renderIcons();
}

function updateNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === Router.current);
  });
  document.querySelectorAll('.bnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === Router.current);
  });
}

function updateTopbar() {
  const titles = {
    dashboard: 'Dashboard',
    formatos: 'Formatos BPM',
    produccion: 'Producción',
    registros: 'Registros',
    reportes: 'Reportes',
    form: FORMS[Router.params?.sub]?.title || 'Formulario'
  };
  document.getElementById('topbar-title').textContent = titles[Router.current] || 'Salentino BPM';
}

// ─── Sidebar mobile ─────────────────────────
function initSidebar() {
  const btn = document.getElementById('menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  btn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ─── Notifications ──────────────────────────
function getNotifications() {
  const notifs = [];
  const now = new Date();

  // NC abiertas
  const ncOpen = Store.getRecords('no_conformidad').filter(r => r.data?.verificacion === 'Pendiente');
  ncOpen.forEach(r => {
    const isOverdue = r.data?.fecha_limite && new Date(r.data.fecha_limite) < now;
    notifs.push({
      icon: 'lucide-alert-triangle',
      color: isOverdue ? 'red' : 'amber',
      text: isOverdue
        ? `NC vencida: "${r.data.nc_detectada}" — fecha límite ${formatDate(r.data.fecha_limite)}`
        : `NC pendiente: "${r.data.nc_detectada}" — responsable: ${r.data.responsable || '—'}`,
      time: r.createdAt,
      action: 'form/no_conformidad',
      unread: true
    });
  });

  // Recordatorios de formatos pendientes hoy
  const todayStr = today();
  const todayRecords = {};
  for (const key of Object.keys(FORMS)) {
    todayRecords[key] = Store.getRecords(key).filter(r => r.createdAt?.startsWith(todayStr)).length;
  }

  if (!todayRecords.limpieza) {
    notifs.push({
      icon: 'lucide-sparkles', color: 'blue',
      text: 'Limpieza pre-producción no registrada hoy',
      time: new Date(todayStr + 'T06:00:00').toISOString(),
      action: 'form/limpieza', unread: true
    });
  }

  if (!todayRecords.ingreso_planta) {
    notifs.push({
      icon: 'lucide-door-open', color: 'blue',
      text: 'Ingreso a planta no registrado hoy',
      time: new Date(todayStr + 'T06:00:00').toISOString(),
      action: 'form/ingreso_planta', unread: true
    });
  }

  // Próximas actividades programadas
  notifs.push({
    icon: 'lucide-bug', color: 'amber',
    text: 'Inspección de plagas programada para el 05 Sep',
    time: '2026-09-01T08:00:00.000Z',
    action: 'form/plagas', unread: false
  });

  notifs.push({
    icon: 'lucide-droplets', color: 'blue',
    text: 'Verificación de agua y filtración el 08 Sep',
    time: '2026-09-01T08:00:00.000Z',
    action: 'form/agua_filtracion', unread: false
  });

  notifs.push({
    icon: 'lucide-graduation-cap', color: 'green',
    text: 'Capacitación BPM programada para el 10 Sep — todo el personal',
    time: '2026-09-01T08:00:00.000Z',
    action: 'form/capacitacion', unread: false
  });

  // Sort: unread first, then by time
  notifs.sort((a, b) => (b.unread - a.unread) || (new Date(b.time) - new Date(a.time)));
  return notifs;
}

function initNotifications() {
  const btn = document.getElementById('notif-btn');
  const badge = document.getElementById('notif-badge');

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'notif-dropdown';
  dropdown.id = 'notif-dropdown';
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(dropdown);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    if (isOpen) renderNotifDropdown();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.remove('open');
    }
  });

  updateNotifBadge();
}

function updateNotifBadge() {
  const notifs = getNotifications();
  const unreadCount = notifs.filter(n => n.unread).length;
  const badge = document.getElementById('notif-badge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  const notifs = getNotifications();

  dropdown.innerHTML = `
    <div class="notif-header">
      <h4><i class="lucide-bell" style="margin-right:6px;font-size:0.9rem;color:var(--brand-copper);"></i>Notificaciones</h4>
      <button class="notif-mark-read" onclick="markAllRead()"><i class="lucide-check-check" style="margin-right:3px;font-size:0.75rem;"></i>Marcar leídas</button>
    </div>
    <div class="notif-list">
      ${notifs.length === 0 ? `
        <div class="notif-empty">
          <i class="lucide-bell-off" style="font-size:24px;display:block;margin-bottom:8px;"></i>
          Sin notificaciones
        </div>
      ` : notifs.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="handleNotifClick('${n.action}')">
          <div class="notif-icon ${n.color}"><i class="${n.icon}"></i></div>
          <div class="notif-body">
            <div class="notif-text">${n.text}</div>
            <div class="notif-time"><i class="lucide-clock" style="margin-right:3px;font-size:0.65rem;"></i>${formatDateTime(n.time)}</div>
          </div>
          ${n.unread ? '<div class="notif-dot"></div>' : ''}
        </div>
      `).join('')}
    </div>
  `;
  renderIcons(dropdown);
}

window.handleNotifClick = function(action) {
  document.getElementById('notif-dropdown').classList.remove('open');
  Router.navigate(action);
};

window.markAllRead = function() {
  // In production this would update Firestore; for prototype just close
  document.getElementById('notif-badge').style.display = 'none';
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.querySelectorAll('.notif-dot').forEach(el => el.remove());
  showToast('Notificaciones marcadas como leídas');
};

// ─── Toast ───────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'lucide-check-circle', error: 'lucide-x-circle', warning: 'lucide-alert-triangle' };
  toast.innerHTML = `<i class="${icons[type] || 'lucide-info'}"></i> ${message}`;
  container.appendChild(toast);
  renderIcons(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Helpers ─────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }
function nowTime() { return new Date().toTimeString().slice(0, 5); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function colorClass(color) {
  const map = { blue: 'blue', brown: 'brown', red: 'red', amber: 'amber', green: 'green' };
  return map[color] || 'blue';
}

// ─── Dashboard View ──────────────────────────
function renderDashboard() {
  const todayCount = Store.getTodayRecordsCount();
  const totalCount = Store.getAllRecordsCount();
  const ncCount = Store.getRecords('no_conformidad').filter(r => r.data?.verificacion === 'Pendiente').length;

  return `
    <div class="fade-in">
      <!-- Welcome -->
      <div style="margin-bottom:24px;">
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:4px;"><i class="lucide-sun" style="margin-right:6px;color:var(--brand-copper);"></i>Buenos días</h2>
        <p style="color:var(--text-secondary);font-size:0.9rem;"><i class="lucide-coffee" style="margin-right:4px;font-size:0.85rem;"></i>Salentino Coffee Lab — ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <!-- Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon green"><i class="lucide-check-circle"></i></div>
          <div class="stat-value">${todayCount}</div>
          <div class="stat-label">Formatos hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="lucide-database"></i></div>
          <div class="stat-value">${totalCount}</div>
          <div class="stat-label">Total registros</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="lucide-alert-triangle"></i></div>
          <div class="stat-value">${ncCount}</div>
          <div class="stat-label">NC abiertas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber"><i class="lucide-calendar-clock"></i></div>
          <div class="stat-value">2</div>
          <div class="stat-label">Pendientes hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon brown"><i class="lucide-flask-conical"></i></div>
          <div class="stat-value">${Store.getRecords('produccion_lote').length}</div>
          <div class="stat-label">Lotes producidos</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-header">
        <h3 class="section-title"><i class="lucide-zap" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Acciones rápidas</h3>
      </div>
      <div class="quick-actions-grid">
        ${quickAction('lucide-door-open', 'Ingreso planta', 'ingreso_planta', 'var(--info)', 'Registra el ingreso del personal con verificación de EPP')}
        ${quickAction('lucide-sparkles', 'Limpieza', 'limpieza', 'var(--brand-copper)', 'Registra limpieza pre/post producción')}
        ${quickAction('lucide-flask-conical', 'Nuevo lote', 'produccion_lote', 'var(--brand-coffee)', 'Inicia un nuevo lote de producción')}
        ${quickAction('lucide-alert-triangle', 'No conformidad', 'no_conformidad', 'var(--danger)', 'Reporta una desviación o problema detectado')}
      </div>

      <!-- Charts -->
      <div class="grid-2" style="margin-bottom:24px;">
        <div class="chart-container">
          <h3>Formatos por programa</h3>
          <div class="chart-wrapper"><canvas id="chart-programs"></canvas></div>
        </div>
        <div class="chart-container">
          <h3>Registros últimos 7 días</h3>
          <div class="chart-wrapper"><canvas id="chart-weekly"></canvas></div>
        </div>
      </div>

      <!-- Upcoming -->
      <div class="section-header">
        <h3 class="section-title"><i class="lucide-calendar-clock" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Próximas actividades</h3>
      </div>
      <div style="margin-bottom:24px;">
        <div class="upcoming-item">
          <div class="upcoming-date"><div class="day">05</div><div class="month">Sep</div></div>
          <div class="upcoming-info">
            <div class="up-title"><i class="lucide-bug" style="margin-right:5px;font-size:0.85rem;color:var(--warning);"></i>Inspección de plagas - mensual</div>
            <div class="up-desc">FOR-CIP-001 · Todas las áreas</div>
          </div>
        </div>
        <div class="upcoming-item">
          <div class="upcoming-date"><div class="day">08</div><div class="month">Sep</div></div>
          <div class="upcoming-info">
            <div class="up-title"><i class="lucide-droplets" style="margin-right:5px;font-size:0.85rem;color:var(--info);"></i>Verificación de agua y filtración</div>
            <div class="up-desc">FOR-ACA-001 · Sistema de filtración</div>
          </div>
        </div>
        <div class="upcoming-item">
          <div class="upcoming-date"><div class="day">10</div><div class="month">Sep</div></div>
          <div class="upcoming-info">
            <div class="up-title"><i class="lucide-graduation-cap" style="margin-right:5px;font-size:0.85rem;color:var(--success);"></i>Capacitación: BPM y manejo de alimentos</div>
            <div class="up-desc">FOR-CAP-001 · Todo el personal</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card" style="margin-bottom:24px;">
        <div class="section-header" style="margin-bottom:12px;">
          <h3 class="section-title"><i class="lucide-activity" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Actividad reciente</h3>
          <button class="section-action" onclick="Router.navigate('registros')"><i class="lucide-arrow-right" style="margin-right:4px;font-size:0.8rem;"></i>Ver todo</button>
        </div>
        <div class="activity-list" id="recent-activity">
          ${renderRecentActivity()}
        </div>
      </div>
    </div>
  `;
}

function quickAction(icon, label, formId, color, tooltip) {
  return `
    <button class="card card-clickable" style="padding:16px;text-align:center;border:1.5px solid var(--border);cursor:pointer;"
      onclick="Router.navigate('form/${formId}')"
      ${tooltip ? `data-tooltip="${tooltip}"` : ''}>
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:color-mix(in srgb, ${color} 12%, transparent);color:${color};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
        <i class="${icon}" style="font-size:24px;"></i>
      </div>
      <div style="font-size:0.82rem;font-weight:600;color:var(--text);">${label}</div>
    </button>
  `;
}

function renderRecentActivity() {
  const allRecords = [];
  for (const key of Object.keys(FORMS)) {
    Store.getRecords(key).forEach(r => {
      allRecords.push({ ...r, formTitle: FORMS[key].title, formCode: FORMS[key].code });
    });
  }
  allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (allRecords.length === 0) {
    return `<div class="empty-state" style="padding:24px;">
      <i class="lucide-inbox" style="font-size:32px;color:var(--text-muted);"></i>
      <p style="margin-top:8px;">No hay registros aún.</p>
      <p style="font-size:0.82rem;color:var(--text-muted);"><i class="lucide-clipboard-pen" style="margin-right:4px;"></i>Comienza llenando un formato.</p>
    </div>`;
  }

  return allRecords.slice(0, 5).map(r => {
    const colors = ['green', 'blue', 'amber', 'green', 'blue'];
    const c = colors[Math.floor(Math.random() * colors.length)];
    return `
      <div class="activity-item">
        <div class="activity-dot ${c}"></div>
        <div style="flex:1;">
          <div class="activity-text">${r.formTitle}</div>
          <div class="activity-time">${r.formCode} · ${formatDateTime(r.createdAt)}</div>
        </div>
        <span class="status-badge complete"><i class="lucide-check-circle" style="margin-right:3px;font-size:0.7rem;"></i>Completado</span>
      </div>`;
  }).join('');
}

// ─── Formatos View ───────────────────────────
function renderFormatos() {
  return `
    <div class="fade-in">
      <div style="margin-bottom:20px;">
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;"><i class="lucide-clipboard-list" style="margin-right:6px;color:var(--brand-copper);"></i>Formatos BPM</h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;"><i class="lucide-layers" style="margin-right:4px;font-size:0.8rem;"></i>13 formatos organizados por programa</p>
      </div>

      <div class="category-grid">
        ${PROGRAMS.map(prog => `
          <div class="category-card">
            <div class="category-header">
              <i class="${prog.icon}"></i>
              <h3>${prog.name}</h3>
              <span class="cat-count">${prog.forms.length} formatos</span>
            </div>
            <div class="category-items">
              ${prog.forms.map(fId => {
                const f = FORMS[fId];
                const recCount = Store.getRecords(fId).length;
                return `
                  <button class="cat-item" onclick="Router.navigate('form/${fId}')"
                    data-tooltip="${f.title} — ${f.code}">
                    <div class="ci-icon"><i class="${f.icon}"></i></div>
                    <div class="ci-info">
                      <span class="ci-name">${f.title}</span>
                      <span class="ci-code">${f.code}${recCount ? ` · ${recCount} registros` : ''}</span>
                    </div>
                    <i class="lucide-chevron-right ci-arrow"></i>
                  </button>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── Produccion View ─────────────────────────
function renderProduccion() {
  const lotes = Store.getRecords('produccion_lote');

  return `
    <div class="fade-in">
      <div class="page-header-row">
        <div style="min-width:0;">
          <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;"><i class="lucide-flask-conical" style="margin-right:6px;color:var(--brand-copper);"></i>Producción</h2>
          <p style="color:var(--text-secondary);font-size:0.85rem;"><i class="lucide-git-branch" style="margin-right:4px;font-size:0.8rem;"></i>Control de lotes, temperatura y muestreo</p>
        </div>
        <button class="btn btn-primary" onclick="Router.navigate('form/produccion_lote')">
          <i class="lucide-plus-circle"></i> Nuevo lote
        </button>
      </div>

      <!-- Quick stats -->
      <div class="stat-grid stat-grid-3">
        <div class="stat-card">
          <div class="stat-icon brown"><i class="lucide-flask-conical"></i></div>
          <div class="stat-value">${lotes.length}</div>
          <div class="stat-label">Lotes totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="lucide-thermometer"></i></div>
          <div class="stat-value">${Store.getRecords('control_temp').length}</div>
          <div class="stat-label">Controles temp.</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="lucide-test-tubes"></i></div>
          <div class="stat-value">${Store.getRecords('muestreo').length}</div>
          <div class="stat-label">Muestras</div>
        </div>
      </div>

      <!-- Production forms -->
      <div class="section-header">
        <h3 class="section-title"><i class="lucide-file-input" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Formularios de producción</h3>
      </div>
      <div class="format-list" style="margin-bottom:24px;">
        ${['produccion_lote', 'control_temp', 'muestreo'].map(fId => {
          const f = FORMS[fId];
          return `
            <button class="format-card" onclick="Router.navigate('form/${fId}')">
              <div class="fc-icon" style="background:var(--primary-100);color:var(--primary);">
                <i class="${f.icon}"></i>
              </div>
              <div class="fc-info">
                <div class="fc-title">${f.title}</div>
                <div class="fc-code">${f.code} · ${Store.getRecords(fId).length} registros</div>
              </div>
              <i class="lucide-chevron-right fc-arrow"></i>
            </button>`;
        }).join('')}
      </div>

      <!-- Recent lots -->
      <div class="section-header">
        <h3 class="section-title"><i class="lucide-history" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Últimos lotes</h3>
      </div>
      ${lotes.length === 0 ? `
        <div class="empty-state">
          <i class="lucide-flask-conical" style="color:var(--text-muted);"></i>
          <h3>Sin lotes registrados</h3>
          <p><i class="lucide-plus-circle" style="margin-right:4px;font-size:0.85rem;"></i>Crea tu primer lote de producción</p>
        </div>
      ` : lotes.slice(0, 5).map(r => `
        <div class="registro-item">
          <div class="stat-icon brown" style="width:42px;height:42px;border-radius:var(--radius-sm);">
            <i class="lucide-flask-conical"></i>
          </div>
          <div class="ri-info">
            <div class="ri-title">Lote: ${r.data?.lote || '—'}</div>
            <div class="ri-meta">${r.data?.cafe_utilizado || ''} · ${r.data?.cant_botellas || 0} botellas · ${formatDate(r.createdAt)}</div>
          </div>
          <span class="status-badge complete"><i class="lucide-check-circle" style="margin-right:3px;font-size:0.7rem;"></i>Completado</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Registros View ──────────────────────────
function renderRegistros() {
  const allRecords = [];
  for (const key of Object.keys(FORMS)) {
    Store.getRecords(key).forEach(r => {
      allRecords.push({ ...r, formTitle: FORMS[key].title, formCode: FORMS[key].code, formIcon: FORMS[key].icon, formColor: FORMS[key].color });
    });
  }
  allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return `
    <div class="fade-in">
      <div style="margin-bottom:20px;">
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;"><i class="lucide-database" style="margin-right:6px;color:var(--brand-copper);"></i>Registros</h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;"><i class="lucide-archive" style="margin-right:4px;font-size:0.8rem;"></i>${allRecords.length} registros guardados</p>
      </div>

      <!-- Filter tabs -->
      <div class="tabs">
        <button class="tab-btn active" onclick="filterRegistros(this,'all')"><i class="lucide-list" style="margin-right:4px;font-size:0.8rem;"></i>Todos</button>
        <button class="tab-btn" onclick="filterRegistros(this,'today')"><i class="lucide-calendar-check" style="margin-right:4px;font-size:0.8rem;"></i>Hoy</button>
        ${PROGRAMS.map(p => `<button class="tab-btn" onclick="filterRegistros(this,'${p.id}')"><i class="${p.icon}" style="margin-right:4px;font-size:0.8rem;"></i>${p.name.split(' ')[0]}</button>`).join('')}
      </div>

      <div id="registros-list">
        ${allRecords.length === 0 ? `
          <div class="empty-state">
            <i class="lucide-archive" style="color:var(--text-muted);"></i>
            <h3>Sin registros</h3>
            <p><i class="lucide-clipboard-pen" style="margin-right:4px;font-size:0.85rem;"></i>Los registros aparecerán aquí cuando completes formularios</p>
          </div>
        ` : allRecords.map(r => `
          <div class="registro-item" data-form="${r.formId}" data-date="${r.createdAt?.slice(0,10)}">
            <div class="stat-icon ${colorClass(r.formColor)}" style="width:42px;height:42px;border-radius:var(--radius-sm);">
              <i class="${r.formIcon}"></i>
            </div>
            <div class="ri-info">
              <div class="ri-title">${r.formTitle}</div>
              <div class="ri-meta">${r.formCode} · ${formatDateTime(r.createdAt)}</div>
            </div>
            <span class="status-badge complete"><i class="lucide-check" style="margin-right:2px;font-size:0.7rem;"></i>OK</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.filterRegistros = function(btn, filter) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const items = document.querySelectorAll('#registros-list .registro-item');
  const todayStr = today();

  items.forEach(item => {
    let show = true;
    if (filter === 'today') {
      show = item.dataset.date === todayStr;
    } else if (filter !== 'all') {
      const prog = PROGRAMS.find(p => p.id === filter);
      if (prog) show = prog.forms.includes(item.dataset.form);
    }
    item.style.display = show ? '' : 'none';
  });
};

// ─── Reportes View ───────────────────────────
function renderReportes() {
  return `
    <div class="fade-in">
      <div style="margin-bottom:20px;">
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;"><i class="lucide-bar-chart-3" style="margin-right:6px;color:var(--brand-copper);"></i>Reportes</h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;"><i class="lucide-trending-up" style="margin-right:4px;font-size:0.8rem;"></i>Cumplimiento, estadísticas y exportación</p>
      </div>

      <div class="alert alert-info">
        <i class="lucide-info"></i>
        <div>Los reportes se generan a partir de los registros almacenados. En producción, los PDFs replicarán exactamente los formatos oficiales BPM.</div>
      </div>

      <!-- Cumplimiento -->
      <div class="grid-2" style="margin-bottom:24px;">
        <div class="chart-container">
          <h3>Cumplimiento por programa</h3>
          <div class="chart-wrapper"><canvas id="chart-compliance"></canvas></div>
        </div>
        <div class="chart-container">
          <h3>Distribución de registros</h3>
          <div class="chart-wrapper"><canvas id="chart-distribution"></canvas></div>
        </div>
      </div>

      <!-- Export options -->
      <div class="section-header">
        <h3 class="section-title"><i class="lucide-download" style="margin-right:6px;color:var(--brand-copper);font-size:1rem;"></i>Exportar</h3>
      </div>
      <div class="format-list">
        <button class="format-card" onclick="showToast('Exportación PDF iniciada...','success')">
          <div class="fc-icon" style="background:var(--danger-light);color:var(--danger);">
            <i class="lucide-file-text"></i>
          </div>
          <div class="fc-info">
            <div class="fc-title">Exportar a PDF</div>
            <div class="fc-code">Todos los formatos del período seleccionado</div>
          </div>
          <i class="lucide-download fc-arrow"></i>
        </button>
        <button class="format-card" onclick="showToast('Exportación Excel iniciada...','success')">
          <div class="fc-icon" style="background:var(--success-light);color:var(--success);">
            <i class="lucide-table"></i>
          </div>
          <div class="fc-info">
            <div class="fc-title">Exportar a Excel</div>
            <div class="fc-code">Datos consolidados para análisis</div>
          </div>
          <i class="lucide-download fc-arrow"></i>
        </button>
        <button class="format-card" onclick="showToast('Paquete de auditoría generado','success')">
          <div class="fc-icon" style="background:var(--info-light);color:var(--info);">
            <i class="lucide-shield-check"></i>
          </div>
          <div class="fc-info">
            <div class="fc-title">Paquete de Auditoría</div>
            <div class="fc-code">Documentación completa para INVIMA</div>
          </div>
          <i class="lucide-download fc-arrow"></i>
        </button>
      </div>
    </div>
  `;
}

// ─── Form Page View ──────────────────────────
function renderFormPage(params) {
  const formId = params.sub;
  const form = FORMS[formId];
  if (!form) return '<div class="empty-state"><h3>Formato no encontrado</h3></div>';

  const container = document.createElement('div');
  container.className = 'fade-in form-page';

  // Back button + header
  container.innerHTML = `
    <div class="back-row">
      <button class="back-btn" onclick="history.back()">
        <i class="lucide-arrow-left"></i> Volver
      </button>
    </div>
    <div class="form-page-header">
      <h2><i class="${form.icon}" style="margin-right:8px;color:var(--brand-copper);"></i>${form.title}</h2>
      <div class="form-code"><i class="lucide-file-badge" style="margin-right:4px;font-size:0.8rem;"></i>${form.code} · Versión 01 · Julio 2026</div>
    </div>
  `;

  // Build form element
  const formEl = document.createElement('form');
  formEl.id = `form-${formId}`;
  formEl.className = 'card';
  formEl.style.padding = '';
  formEl.style.marginBottom = '24px';

  let html = '';

  // Standard fields
  let inRow = false;
  form.fields.forEach((field, i) => {
    const nextField = form.fields[i + 1];
    const isHalf = field.half;
    const nextIsHalf = nextField?.half;

    if (isHalf && !inRow) {
      html += '<div class="form-row">';
      inRow = true;
    }

    html += buildField(field);

    if (inRow && (!nextIsHalf || !nextField)) {
      html += '</div>';
      inRow = false;
    }
  });

  // Table fields
  if (form.tableFields) {
    html += buildTableFields(form.tableFields);
  }

  // Checklist (ingreso planta)
  if (form.checklistFields) {
    html += buildChecklistFields(form.checklistFields);
  }

  // Plagas inspection
  if (form.plagasInspection) {
    html += buildPlagasInspection();
  }

  // Checklist verification (agua)
  if (form.checklistVerification) {
    html += buildVerificationChecklist(form.checklistVerification);
  }

  // Signature
  if (form.hasSignature) {
    html += `
      <div class="form-group" style="margin-top:24px;">
        <label class="form-label"><i class="lucide-pen-tool" style="margin-right:5px;font-size:0.85rem;color:var(--brand-copper);"></i>Firma del responsable</label>
        <div class="signature-pad" id="sig-pad">
          <canvas id="sig-canvas"></canvas>
          <span class="sig-placeholder"><i class="lucide-pen-tool" style="margin-right:6px;"></i> Toque aquí para firmar</span>
        </div>
        <div class="signature-actions">
          <button type="button" class="btn btn-sm btn-ghost" onclick="clearSignature()">Limpiar firma</button>
        </div>
      </div>
    `;
  }

  // Submit buttons
  html += `
    <div class="btn-group" style="justify-content:flex-end;">
      <button type="button" class="btn btn-outline" onclick="history.back()"><i class="lucide-x" style="margin-right:4px;"></i>Cancelar</button>
      <button type="submit" class="btn btn-success btn-lg">
        <i class="lucide-save"></i> Guardar registro
      </button>
    </div>
  `;

  formEl.innerHTML = html;

  // Handle submit
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(formEl);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Collect checklist states
    formEl.querySelectorAll('.form-check').forEach(check => {
      data[check.dataset.name] = check.classList.contains('checked') ? 'Sí' : 'No';
    });

    HybridStore.addRecord(formId, { data });
    showToast(`${form.title} guardado correctamente`);
    setTimeout(() => Router.navigate('registros'), 500);
  });

  container.appendChild(formEl);
  return container;
}

const FIELD_ICONS = {
  fecha: 'lucide-calendar', fecha_produccion: 'lucide-calendar', fecha_hora: 'lucide-calendar-clock',
  fecha_limite: 'lucide-calendar-x', fecha_vencimiento: 'lucide-calendar-x',
  hora: 'lucide-clock', hora_inicio: 'lucide-clock', hora_fin: 'lucide-clock-4',
  lote: 'lucide-hash', lote_produccion: 'lucide-hash',
  operario: 'lucide-hard-hat', responsable: 'lucide-user-check', revisado_por: 'lucide-user-check',
  verificado_por: 'lucide-user-check', inspector: 'lucide-scan-eye', facilitador: 'lucide-presentation',
  cafe_utilizado: 'lucide-coffee', agua_utilizada: 'lucide-droplets',
  tiempo: 'lucide-timer', duracion: 'lucide-timer',
  cant_producida: 'lucide-beaker', cant_botellas: 'lucide-wine',
  cant_muestra: 'lucide-test-tube', identificacion: 'lucide-tag',
  ubicacion: 'lucide-map-pin', temperatura: 'lucide-thermometer',
  lugar: 'lucide-map-pin',
  area_equipo: 'lucide-factory', nc_detectada: 'lucide-alert-octagon',
  causa_posible: 'lucide-search', accion_inmediata: 'lucide-zap',
  accion_correctiva: 'lucide-wrench', resultado_verificacion: 'lucide-clipboard-check',
  objetivo: 'lucide-target', mes: 'lucide-calendar-range',
  verificacion: 'lucide-shield-check',
};

function fieldIcon(name) {
  const ico = FIELD_ICONS[name];
  return ico ? `<i class="${ico}" style="margin-right:5px;font-size:0.85rem;color:var(--brand-copper);"></i>` : '';
}

function buildField(field) {
  const req = field.required ? '<span class="required">*</span>' : '';
  const reqAttr = field.required ? 'required' : '';
  const ico = fieldIcon(field.name);

  if (field.type === 'textarea') {
    return `
      <div class="form-group">
        <label class="form-label">${ico}${field.label}${req}</label>
        <textarea name="${field.name}" class="form-textarea" placeholder="${field.placeholder || ''}" ${reqAttr}></textarea>
      </div>`;
  }

  if (field.type === 'select') {
    return `
      <div class="form-group">
        <label class="form-label">${ico}${field.label}${req}</label>
        <select name="${field.name}" class="form-select" ${reqAttr}>
          ${(field.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>`;
  }

  const defaultVal = field.type === 'date' ? `value="${today()}"` :
                     field.type === 'time' ? `value="${nowTime()}"` : '';

  return `
    <div class="form-group">
      <label class="form-label">${ico}${field.label}${req}</label>
      <input type="${field.type}" name="${field.name}" class="form-input"
        placeholder="${field.placeholder || ''}" ${reqAttr} ${defaultVal}>
    </div>`;
}

function buildTableFields(config) {
  let html = `
    <div class="form-group" style="margin-top:20px;">
      <label class="form-label"><i class="lucide-table" style="margin-right:5px;font-size:0.85rem;color:var(--brand-copper);"></i>${config.label}</label>
      <div class="table-scroll-wrapper">
        <table class="form-table">
          <thead><tr>
            ${config.columns.map(c => `<th>${c}</th>`).join('')}
          </tr></thead>
          <tbody>`;

  config.rows.forEach((row, ri) => {
    html += '<tr>';
    config.colKeys.forEach((key, ci) => {
      if (ci === 0 && row.area) {
        html += `<td style="font-weight:500;white-space:nowrap;">${row.area}</td>`;
      } else {
        const name = `table_${ri}_${key}`;
        if (key === 'cumple') {
          html += `<td><select name="${name}" class="table-select">
            <option value="">—</option><option value="si">Sí</option><option value="no">No</option>
          </select></td>`;
        } else if (key === 'estado_caneca') {
          html += `<td><select name="${name}" class="table-select">
            <option value="bueno">Bueno</option><option value="regular">Regular</option><option value="malo">Malo</option>
          </select></td>`;
        } else {
          html += `<td><input type="text" name="${name}" class="table-input"></td>`;
        }
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  return html;
}

function buildChecklistFields(config) {
  let html = `
    <div class="form-group" style="margin-top:20px;">
      <label class="form-label"><i class="lucide-list-checks" style="margin-right:5px;font-size:0.85rem;color:var(--brand-copper);"></i>${config.label}</label>
      <div id="checklist-persons">
        <div class="checklist-person" style="background:var(--bg);border-radius:var(--radius);padding:16px;margin-bottom:12px;">
          <div class="form-row" style="margin-bottom:12px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Nombre</label>
              <input type="text" name="persona_nombre_0" class="form-input" placeholder="Nombre completo">
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Cargo / Visita</label>
              <input type="text" name="persona_cargo_0" class="form-input" placeholder="Cargo o motivo">
            </div>
          </div>
          <div class="checklist-checks">`;

  config.checks.forEach(check => {
    html += `
      <div class="form-check" data-name="check_0_${check.toLowerCase().replace(/\s/g, '_')}" onclick="toggleCheck(this)">
        <div class="check-box"><i class="lucide-check"></i></div>
        <span class="check-label">${check}</span>
      </div>`;
  });

  html += `
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addPerson()">
        <i class="lucide-user-plus"></i> Agregar persona
      </button>
    </div>`;

  return html;
}

function buildPlagasInspection() {
  const areas = [
    { title: 'Área de Producción', items: [
      'Uniones entre piso, paredes y techos',
      'Debajo y alrededor de mesas y utensilios',
      'Debajo y alrededor de maquinaria',
      'Dentro y alrededor de la caneca',
      'Debajo del lavaplatos'
    ]},
    { title: 'Área de Almacenamiento', items: [
      'Uniones entre piso, paredes y techos',
      'Alrededor de los almacenamientos'
    ]},
    { title: 'Área Administrativa', items: [
      'Uniones entre piso, paredes y techos',
      'Alrededor de mesas, escritorios y sillas'
    ]},
    { title: 'Área de Transición Sanitaria', items: [
      'Uniones entre piso, paredes y techos',
      'Alrededor de los almacenamientos'
    ]},
    { title: 'Baño, Químicos y Basuras', items: [
      'Uniones entre piso, paredes y techos',
      'Alrededor de los almacenamientos',
      'Dentro y alrededor de la caneca'
    ]}
  ];

  let html = '<div style="margin-top:20px;">';
  html += '<label class="form-label"><i class="lucide-scan-search" style="margin-right:5px;font-size:0.85rem;color:var(--brand-copper);"></i>Inspección por área (C = Cumple, NC = No Cumple, NA = No Aplica)</label>';

  areas.forEach((area, ai) => {
    html += `
      <div style="margin-bottom:16px;">
        <h4 style="font-size:0.85rem;font-weight:700;color:var(--primary);margin-bottom:8px;padding:8px 0;border-bottom:1px solid var(--border);">${area.title}</h4>
        <div class="table-scroll-wrapper"><table class="form-table">
          <thead><tr>
            <th style="width:40%;">Aspecto</th>
            <th>Sem 1</th><th>Sem 2</th><th>Sem 3</th><th>Sem 4</th>
            <th>¿Plaga?</th><th>Acción correctiva</th>
          </tr></thead>
          <tbody>`;

    area.items.forEach((item, ii) => {
      html += `<tr>
        <td style="font-size:0.8rem;">${item}</td>
        ${[1,2,3,4].map(s => `<td><select name="plagas_${ai}_${ii}_s${s}" class="table-select" style="width:60px;">
          <option value="">—</option><option value="C">C</option><option value="NC">NC</option><option value="NA">NA</option>
        </select></td>`).join('')}
        <td><select name="plagas_${ai}_${ii}_found" class="table-select"><option value="No">No</option><option value="Si">Sí</option></select></td>
        <td><input type="text" name="plagas_${ai}_${ii}_action" class="table-input"></td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
  });

  html += '</div>';
  return html;
}

function buildVerificationChecklist(config) {
  let html = '<div style="margin-top:20px;">';

  config.sections.forEach((section, si) => {
    html += `
      <div style="margin-bottom:20px;">
        <h4 style="font-size:0.88rem;font-weight:700;color:var(--primary);margin-bottom:10px;">${section.title}</h4>
        <div class="table-scroll-wrapper"><table class="form-table">
          <thead><tr>
            <th style="width:35%;">Aspecto a verificar</th>
            <th style="width:25%;">Criterio</th>
            <th>Cumple</th>
            <th>No cumple</th>
            <th>Observaciones</th>
          </tr></thead>
          <tbody>`;

    section.items.forEach((item, ii) => {
      const name = `agua_${si}_${ii}`;
      html += `<tr>
        <td style="font-size:0.8rem;">${item.aspect}</td>
        <td style="font-size:0.78rem;color:var(--text-secondary);">${item.criteria}</td>
        <td style="text-align:center;">
          <input type="radio" name="${name}" value="cumple" style="width:18px;height:18px;accent-color:var(--success);">
        </td>
        <td style="text-align:center;">
          <input type="radio" name="${name}" value="no_cumple" style="width:18px;height:18px;accent-color:var(--danger);">
        </td>
        <td><input type="text" name="${name}_obs" class="table-input"></td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
  });

  html += '</div>';
  return html;
}

// ─── Checklist interactions ──────────────────
window.toggleCheck = function(el) {
  el.classList.toggle('checked');
};

let personCount = 1;
window.addPerson = function() {
  const container = document.getElementById('checklist-persons');
  const checks = FORMS.ingreso_planta.checklistFields.checks;

  const div = document.createElement('div');
  div.className = 'checklist-person';
  div.style.cssText = 'background:var(--bg);border-radius:var(--radius);padding:16px;margin-bottom:12px;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:0.82rem;color:var(--text-secondary);">Persona ${personCount + 1}</strong>
      <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="this.closest('.checklist-person').remove()">
        <i class="lucide-x"></i>
      </button>
    </div>
    <div class="form-row" style="margin-bottom:12px;">
      <div class="form-group" style="margin:0;">
        <input type="text" name="persona_nombre_${personCount}" class="form-input" placeholder="Nombre completo">
      </div>
      <div class="form-group" style="margin:0;">
        <input type="text" name="persona_cargo_${personCount}" class="form-input" placeholder="Cargo o motivo">
      </div>
    </div>
    <div class="checklist-checks">
      ${checks.map(c => `
        <div class="form-check" data-name="check_${personCount}_${c.toLowerCase().replace(/\s/g, '_')}" onclick="toggleCheck(this)">
          <div class="check-box"><i class="lucide-check"></i></div>
          <span class="check-label">${c}</span>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(div);
  personCount++;
  renderIcons(div);
};

// ─── Signature Pad ───────────────────────────
let sigCanvas, sigCtx, sigDrawing = false;

function initSignaturePads() {
  sigCanvas = document.getElementById('sig-canvas');
  if (!sigCanvas) return;

  const pad = document.getElementById('sig-pad');
  sigCtx = sigCanvas.getContext('2d');

  function resize() {
    const rect = pad.getBoundingClientRect();
    sigCanvas.width = rect.width;
    sigCanvas.height = rect.height;
    sigCtx.strokeStyle = '#1C1410';
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
  }
  resize();
  window.addEventListener('resize', resize);

  function getPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    sigDrawing = true;
    pad.classList.add('has-sig');
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!sigDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  }

  function end() { sigDrawing = false; }

  sigCanvas.addEventListener('mousedown', start);
  sigCanvas.addEventListener('mousemove', draw);
  sigCanvas.addEventListener('mouseup', end);
  sigCanvas.addEventListener('mouseleave', end);
  sigCanvas.addEventListener('touchstart', start, { passive: false });
  sigCanvas.addEventListener('touchmove', draw, { passive: false });
  sigCanvas.addEventListener('touchend', end);
}

window.clearSignature = function() {
  if (!sigCanvas) return;
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  document.getElementById('sig-pad')?.classList.remove('has-sig');
};

// ─── Charts ──────────────────────────────────
let chartInstances = {};

function initCharts() {
  // Destroy existing charts
  Object.values(chartInstances).forEach(c => c?.destroy?.());
  chartInstances = {};

  const defaults = Chart.defaults;
  defaults.font.family = 'Arial';
  defaults.font.size = 12;
  defaults.color = '#6B5B4F';

  // Programs chart
  const progEl = document.getElementById('chart-programs');
  if (progEl) {
    chartInstances.programs = new Chart(progEl, {
      type: 'doughnut',
      data: {
        labels: PROGRAMS.map(p => p.name.split(' ')[0]),
        datasets: [{
          data: PROGRAMS.map(p => p.forms.reduce((sum, f) => sum + Store.getRecords(f).length, 0) || 1),
          backgroundColor: ['#3B6B9E', '#6B3A2A', '#C1292E', '#D4870E', '#2D6A4F'],
          borderWidth: 0,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
        cutout: '65%'
      }
    });
  }

  // Weekly chart
  const weekEl = document.getElementById('chart-weekly');
  if (weekEl) {
    const days = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      days.push(d.toLocaleDateString('es-CO', { weekday: 'short' }));

      let count = 0;
      for (const key of Object.keys(FORMS)) {
        count += Store.getRecords(key).filter(r => r.createdAt?.startsWith(ds)).length;
      }
      counts.push(count || Math.floor(Math.random() * 4));
    }

    chartInstances.weekly = new Chart(weekEl, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Registros',
          data: counts,
          backgroundColor: '#B8652A',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F0EBE5' }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Compliance chart (reportes)
  const compEl = document.getElementById('chart-compliance');
  if (compEl) {
    chartInstances.compliance = new Chart(compEl, {
      type: 'bar',
      data: {
        labels: ['L&D', 'Producción', 'Calidad', 'Soporte', 'Capacitación'],
        datasets: [
          { label: 'Completado', data: [85, 92, 70, 65, 80], backgroundColor: '#2D6A4F', borderRadius: 4 },
          { label: 'Pendiente', data: [15, 8, 30, 35, 20], backgroundColor: '#D4870E', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: '#F0EBE5' }, max: 100, ticks: { callback: v => v + '%' } }
        }
      }
    });
  }

  // Distribution chart (reportes)
  const distEl = document.getElementById('chart-distribution');
  if (distEl) {
    chartInstances.distribution = new Chart(distEl, {
      type: 'polarArea',
      data: {
        labels: Object.values(FORMS).slice(0, 7).map(f => f.code),
        datasets: [{
          data: Object.keys(FORMS).slice(0, 7).map(k => Store.getRecords(k).length || Math.floor(Math.random() * 10 + 1)),
          backgroundColor: [
            'rgba(59,130,246,0.6)', 'rgba(99,102,241,0.6)', 'rgba(139,69,19,0.6)',
            'rgba(239,68,68,0.6)', 'rgba(245,158,11,0.6)', 'rgba(22,163,74,0.6)',
            'rgba(212,165,116,0.6)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 8, usePointStyle: true, font: { size: 10 } } } },
        scales: { r: { display: false } }
      }
    });
  }
}

// ─── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  initSidebar();
  initNotifications();
  Router.init();

  // Seed demo data if empty
  if (Store.getAllRecordsCount() === 0) {
    seedDemoData();
    Router.resolve();
  }

  // Render all static icons (sidebar header, topbar)
  renderIcons();
});

function seedDemoData() {
  const lotes = ['SCL-2026-0828-001', 'SCL-2026-0830-001', 'SCL-2026-0901-001'];

  lotes.forEach((lote, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (3 - i));
    const iso = date.toISOString();

    Store.addRecord('ingreso_planta', { data: { fecha: date.toISOString().slice(0, 10), persona_nombre_0: 'Juan Operario' }, createdAt: iso });
    Store.addRecord('limpieza', { data: { fecha_produccion: date.toISOString().slice(0, 10), lote_produccion: lote, operario: 'Juan' }, createdAt: iso });
    Store.addRecord('desinfeccion', { data: { fecha_produccion: date.toISOString().slice(0, 10), lote_produccion: lote, operario: 'Juan' }, createdAt: new Date(date.getTime() + 3600000).toISOString() });
    Store.addRecord('produccion_lote', {
      data: { fecha: date.toISOString().slice(0, 10), lote, cafe_utilizado: 'Colombia Huila - Castillo', agua_utilizada: '20', tiempo: '18 horas', cant_producida: '15', cant_botellas: '50' },
      createdAt: new Date(date.getTime() + 7200000).toISOString()
    });
    Store.addRecord('control_temp', { data: {}, createdAt: new Date(date.getTime() + 10800000).toISOString() });
  });

  Store.addRecord('no_conformidad', {
    data: { fecha_hora: '2026-08-29T10:30', area_equipo: 'Área de producción', nc_detectada: 'Filtro de agua con acumulación de sedimentos', causa_posible: 'No se realizó cambio en la fecha programada', accion_inmediata: 'Cambio inmediato del filtro', accion_correctiva: 'Implementar alerta automática de cambio de filtros', responsable: 'Carlos Supervisor', fecha_limite: '2026-09-05', verificacion: 'Pendiente' },
    createdAt: '2026-08-29T10:30:00.000Z'
  });

  Store.addRecord('residuos', { data: { fecha: '2026-08-30', responsable: 'María' }, createdAt: '2026-08-30T16:00:00.000Z' });
  Store.addRecord('capacitacion', { data: { fecha: '2026-08-28', lugar: 'Planta', objetivo: 'Refuerzo BPM', facilitador: 'Ana' }, createdAt: '2026-08-28T09:00:00.000Z' });
}
