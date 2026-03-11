/* ============================================================
   projects.js — Lógica completa de la sección de proyectos
   - Carga projects.json
   - Renderiza tarjetas con filtrado por tag y búsqueda
   - Modal de detalle al pulsar una tarjeta
   - También carga los 3 proyectos destacados en index.html
   ============================================================ */

'use strict';

const PROJECTS_JSON = 'projects/data/projects.json';

/* ----------------------------------------------------------
   HELPER — Genera el HTML de una tarjeta de proyecto
   ---------------------------------------------------------- */
function buildProjectCard(project) {
  const tags = (project.tags || []).map(t =>
    `<span class="tag">${t}</span>`
  ).join('');

  const statusLabel = {
    'completado':  'Completado',
    'en-progreso': 'En progreso',
    'pausado':     'Pausado',
  };

  const statusBadge = project.status
    ? `<span class="status-badge ${project.status}">${statusLabel[project.status] || project.status}</span>`
    : '';

  const imageHTML = project.image
    ? `<img src="${project.image}" alt="${project.title}" class="project-card-img" loading="lazy" />`
    : `<div class="project-card-img-placeholder">
         <i class="fa-solid fa-diagram-project"></i>
       </div>`;

  const repoLink = project.repo
    ? `<a href="${project.repo}" target="_blank" rel="noopener noreferrer"
          class="project-card-link" onclick="event.stopPropagation()"
          aria-label="Ver repositorio de ${project.title}">
         <i class="fa-brands fa-github"></i> Repo
       </a>`
    : '';

  const demoLink = project.demo
    ? `<a href="${project.demo}" target="_blank" rel="noopener noreferrer"
          class="project-card-link" onclick="event.stopPropagation()"
          aria-label="Ver demo de ${project.title}">
         <i class="fa-solid fa-arrow-up-right-from-square"></i> Demo
       </a>`
    : '';

  const docsLink = project.docs
    ? `<a href="${project.docs}" target="_blank" rel="noopener noreferrer"
          class="project-card-link" onclick="event.stopPropagation()"
          aria-label="Ver documentación de ${project.title}">
         <i class="fa-solid fa-book"></i> Docs
       </a>`
    : '';

  return `
    <article
      class="project-card"
      data-id="${project.id}"
      role="button"
      tabindex="0"
      aria-label="Ver detalles de ${project.title}"
    >
      ${imageHTML}
      <div class="project-card-body">
        <h3 class="project-card-title">${project.title}</h3>
        <p class="project-card-desc">${project.description}</p>
        <div class="project-card-tags">${tags}</div>
      </div>
      <div class="project-card-footer">
        <div class="project-card-links">
          ${repoLink}${demoLink}${docsLink}
        </div>
        ${statusBadge}
      </div>
    </article>
  `;
}

/* ----------------------------------------------------------
   HELPER — Genera el HTML del contenido del modal
   ---------------------------------------------------------- */
function buildModalContent(project) {
  const tags = (project.tags || []).map(t =>
    `<span class="tag">${t}</span>`
  ).join('');

  const imageHTML = project.image
    ? `<img src="${project.image}" alt="${project.title}" loading="lazy" />`
    : '';

  const links = [];
  if (project.repo)  links.push(`<a href="${project.repo}"  target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-brands fa-github"></i> Repositorio</a>`);
  if (project.demo)  links.push(`<a href="${project.demo}"  target="_blank" rel="noopener noreferrer" class="btn btn-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Demo</a>`);
  if (project.docs)  links.push(`<a href="${project.docs}"  target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fa-solid fa-book"></i> Documentación</a>`);

  const dateStr = project.date
    ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:1rem">
         <i class="fa-regular fa-calendar"></i> ${project.date}
       </p>`
    : '';

  return `
    ${imageHTML}
    <h2 id="modalTitle">${project.title}</h2>
    <div class="modal-tags">${tags}</div>
    <p>${project.longDescription || project.description}</p>
    ${dateStr}
    <div class="modal-links">${links.join('')}</div>
  `;
}

/* ----------------------------------------------------------
   MODAL — Abrir, cerrar, teclado y click fuera
   ---------------------------------------------------------- */
const modal       = document.getElementById('projectModal');
const modalClose  = document.getElementById('modalClose');
const modalContent= document.getElementById('modalContent');

function openModal(project) {
  if (!modal || !modalContent) return;
  modalContent.innerHTML = buildModalContent(project);
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';  // evita scroll del fondo
  modalClose?.focus();
}

function closeModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Botón ✕
modalClose?.addEventListener('click', closeModal);

// Click fuera del modal-box
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

/* ----------------------------------------------------------
   FILTROS — Construye los botones de filtro desde los tags
   ---------------------------------------------------------- */
function buildFilterButtons(projects) {
  const filterBar = document.getElementById('filterBar');
  if (!filterBar) return;

  // Recopila todos los tags únicos
  const allTags = [...new Set(projects.flatMap(p => p.tags || []))].sort();

  const buttons = allTags.map(tag => `
    <button class="filter-btn" data-filter="${tag}">${tag}</button>
  `).join('');

  // Inserta después del botón "Todos" (que ya está en el HTML)
  filterBar.insertAdjacentHTML('beforeend', buttons);

  // Evento de click en los filtros
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    applyFilters(projects);
  });
}

/* ----------------------------------------------------------
   BÚSQUEDA en tiempo real
   ---------------------------------------------------------- */
function initSearch(projects) {
  const searchInput = document.getElementById('projectSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => applyFilters(projects));
}

/* ----------------------------------------------------------
   APLICAR FILTROS + BÚSQUEDA — función central
   ---------------------------------------------------------- */
function applyFilters(projects) {
  const filterBar   = document.getElementById('filterBar');
  const searchInput = document.getElementById('projectSearch');
  const grid        = document.getElementById('projectsGrid');
  const noResults   = document.getElementById('noResults');
  if (!grid) return;

  const activeFilter = filterBar?.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const searchTerm   = searchInput?.value.trim().toLowerCase() || '';

  const filtered = projects.filter(p => {
    const matchesFilter = activeFilter === 'all' || (p.tags || []).includes(activeFilter);
    const matchesSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm) ||
      (p.description || '').toLowerCase().includes(searchTerm) ||
      (p.tags || []).some(t => t.toLowerCase().includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  renderProjectCards(filtered, grid);

  if (noResults) {
    noResults.classList.toggle('hidden', filtered.length > 0);
  }
}

/* ----------------------------------------------------------
   RENDERIZAR tarjetas en un contenedor dado
   ---------------------------------------------------------- */
function renderProjectCards(projects, container) {
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = projects.map(buildProjectCard).join('');

  // Añade eventos de apertura de modal a cada tarjeta
  container.querySelectorAll('.project-card').forEach(card => {
    const id      = parseInt(card.dataset.id, 10);
    const project = projects.find(p => p.id === id) ||
                    window.__allProjects?.find(p => p.id === id);
    if (!project) return;

    card.addEventListener('click', () => openModal(project));

    // Accesibilidad — Enter/Space también abre el modal
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(project);
      }
    });
  });
}

/* ----------------------------------------------------------
   PROYECTOS DESTACADOS en index.html (featured)
   Muestra los primeros 3 con featured:true
   ---------------------------------------------------------- */
async function loadFeaturedProjects() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const res      = await fetch(PROJECTS_JSON);
    const projects = await res.json();

    const featured = projects.filter(p => p.featured).slice(0, 3);
    window.__allProjects = projects;  // guarda referencia para el modal

    if (!featured.length) {
      grid.innerHTML = `<p class="loading-placeholder">No hay proyectos destacados aún.</p>`;
      return;
    }

    renderProjectCards(featured, grid);
  } catch (err) {
    grid.innerHTML = `
      <div class="loading-placeholder" style="color:var(--neon-pink)">
        <i class="fa-solid fa-triangle-exclamation"></i> No se pudieron cargar los proyectos.
      </div>`;
    console.error(err);
  }
}

/* ----------------------------------------------------------
   PÁGINA DE PROYECTOS — Carga completa
   ---------------------------------------------------------- */
async function loadAllProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  try {
    const res      = await fetch(PROJECTS_JSON);
    const projects = await res.json();

    window.__allProjects = projects;  // referencia global para el modal

    buildFilterButtons(projects);
    initSearch(projects);
    renderProjectCards(projects, grid);

  } catch (err) {
    grid.innerHTML = `
      <div class="loading-placeholder" style="color:var(--neon-pink)">
        <i class="fa-solid fa-triangle-exclamation"></i> No se pudieron cargar los proyectos.
      </div>`;
    console.error(err);
  }
}

/* ----------------------------------------------------------
   INIT — Detecta en qué página estamos y arranca lo necesario
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('featuredGrid')) loadFeaturedProjects();
  if (document.getElementById('projectsGrid')) loadAllProjects();
});