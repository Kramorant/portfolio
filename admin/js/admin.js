/* ============================================================
   admin.js — Panel de administración
   ============================================================ */

'use strict';

const API_URL = 'api/projects.php';

// Estado local — IDs normalizados a número
let projects        = (window.__adminProjects || []).map(p => ({ ...p, id: parseInt(p.id, 10) }));
let pendingDeleteId = null;
let currentTags     = [];

/* ----------------------------------------------------------
   TAGS — Funciones
   ---------------------------------------------------------- */
function renderTags() {
  const display     = document.getElementById('tagsDisplay');
  const hiddenInput = document.getElementById('fieldTags');
  if (!display) return;

  display.innerHTML = currentTags.map((tag, i) => `
    <span class="tag-item">
      ${tag}
      <button type="button" onclick="removeTag(${i})" aria-label="Eliminar tag ${tag}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </span>
  `).join('');

  if (hiddenInput) hiddenInput.value = JSON.stringify(currentTags);
}

function addTag(value) {
  const tag = value.trim();
  if (tag && !currentTags.includes(tag)) {
    currentTags.push(tag);
    renderTags();
  }
}

window.removeTag = function (index) {
  currentTags.splice(index, 1);
  renderTags();
};

/* ----------------------------------------------------------
   EDITOR MODAL — Abrir y cerrar
   ---------------------------------------------------------- */
function openEditor(project = null) {
  const editorModal = document.getElementById('editorModal');
  const editorTitle = document.getElementById('editorTitle');
  const projectForm = document.getElementById('projectForm');
  if (!editorModal || !projectForm) return;

  projectForm.reset();
  currentTags = [];

  if (project) {
    editorTitle.textContent = 'Editar Proyecto';
    document.getElementById('fieldId').value            = project.id;
    document.getElementById('fieldTitle').value         = project.title           || '';
    document.getElementById('fieldDesc').value          = project.description     || '';
    document.getElementById('fieldLongDesc').value      = project.longDescription || '';
    document.getElementById('fieldRepo').value          = project.repo            || '';
    document.getElementById('fieldDemo').value          = project.demo            || '';
    document.getElementById('fieldDocs').value          = project.docs            || '';
    document.getElementById('fieldStatus').value        = project.status          || '';
    document.getElementById('fieldFeatured').checked    = !!project.featured;
    document.getElementById('fieldDate').value          = project.date            || '';
    currentTags = [...(project.tags || [])];
    loadExistingImage(project.image || '');
  } else {
    editorTitle.textContent = 'Nuevo Proyecto';
    document.getElementById('fieldId').value = '';
    loadExistingImage('');
  }

  renderTags();
  document.getElementById('editorFeedback')?.classList.add('hidden');
  editorModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('fieldTitle')?.focus();
}

function closeEditor() {
  document.getElementById('editorModal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ----------------------------------------------------------
   MODAL DE BORRADO — Abrir y cerrar
   ---------------------------------------------------------- */
function openDeleteModal(id, title) {
  pendingDeleteId = id;
  const confirmText = document.getElementById('confirmText');
  if (confirmText) {
    confirmText.textContent = `Vas a eliminar "${title}". Esta acción no se puede deshacer.`;
  }
  document.getElementById('deleteModal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('deleteModal')?.classList.add('hidden');
  document.body.style.overflow = '';
  pendingDeleteId = null;
}

/* ----------------------------------------------------------
   FORMULARIO — Submit (crear / editar)
   ---------------------------------------------------------- */
async function handleFormSubmit(e) {
  e.preventDefault();

  const saveBtn        = document.getElementById('editorSaveBtn');
  const editorFeedback = document.getElementById('editorFeedback');
  saveBtn.disabled     = true;
  saveBtn.innerHTML    = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const id = document.getElementById('fieldId').value;

  let tags = [];
  try { tags = JSON.parse(document.getElementById('fieldTags').value || '[]'); }
  catch { tags = []; }

  const payload = {
    title:           document.getElementById('fieldTitle').value.trim(),
    description:     document.getElementById('fieldDesc').value.trim(),
    longDescription: document.getElementById('fieldLongDesc').value.trim(),
    repo:            document.getElementById('fieldRepo').value.trim(),
    demo:            document.getElementById('fieldDemo').value.trim(),
    docs:            document.getElementById('fieldDocs').value.trim(),
    image:           document.getElementById('fieldImage').value.trim(),
    status:          document.getElementById('fieldStatus').value,
    featured:        document.getElementById('fieldFeatured').checked,
    date:            document.getElementById('fieldDate').value,
    tags,
  };

  const isEdit = !!id;
  const method = isEdit ? 'PUT' : 'POST';
  const url    = isEdit ? `${API_URL}?id=${id}` : API_URL;

  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error desconocido');

    if (isEdit) {
      const idx = projects.findIndex(p => p.id === parseInt(id, 10));
      if (idx !== -1) projects[idx] = data.project;
    } else {
      projects.push(data.project);
    }

    updateTableRow(data.project, isEdit);
    updateStats();
    closeEditor();
    showToast(isEdit ? '✅ Proyecto actualizado.' : '✅ Proyecto creado.');

  } catch (err) {
    if (editorFeedback) {
      editorFeedback.textContent = `❌ ${err.message}`;
      editorFeedback.className   = 'form-feedback error';
      editorFeedback.classList.remove('hidden');
    }
    console.error(err);
  } finally {
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar proyecto';
  }
}

/* ----------------------------------------------------------
   ELIMINAR — Confirmar
   ---------------------------------------------------------- */
async function handleDelete() {
  if (!pendingDeleteId) return;

  const btn     = document.getElementById('confirmDeleteBtn');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando...';

  try {
    const res  = await fetch(`${API_URL}?id=${pendingDeleteId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    projects = projects.filter(p => p.id !== pendingDeleteId);
    document.querySelector(`#projectsTableBody tr[data-id="${pendingDeleteId}"]`)?.remove();

    const tbody = document.getElementById('projectsTableBody');
    if (tbody && !tbody.querySelector('tr[data-id]')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            <i class="fa-solid fa-inbox"></i> No hay proyectos todavía.<br>
            ¡Crea el primero pulsando "Nuevo Proyecto"!
          </td>
        </tr>`;
    }

    updateStats();
    closeDeleteModal();
    showToast('✅ Proyecto eliminado.');

  } catch (err) {
    showToast(`❌ ${err.message}`, true);
    console.error(err);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Sí, eliminar';
  }
}

/* ----------------------------------------------------------
   TABLA — Actualizar fila sin recargar
   ---------------------------------------------------------- */
function buildTableRow(p) {
  const tags       = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const statusHTML = p.status
    ? `<span class="status-badge ${p.status}">${p.status}</span>` : '—';
  const starHTML   = p.featured
    ? `<i class="fa-solid fa-star" style="color:var(--neon-cyan)"></i>`
    : `<i class="fa-regular fa-star" style="color:var(--text-muted)"></i>`;

  return `
    <td class="td-id">${p.id}</td>
    <td class="td-title">${p.title}</td>
    <td class="td-tags">${tags}</td>
    <td>${statusHTML}</td>
    <td class="td-featured">${starHTML}</td>
    <td>${p.date || '—'}</td>
    <td class="td-actions">
      <button class="action-btn btn-edit"   data-id="${p.id}" title="Editar">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
      <button class="action-btn btn-delete" data-id="${p.id}" title="Eliminar">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </td>
  `;
}

function updateTableRow(project, isEdit) {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;

  tbody.querySelector('tr:not([data-id])')?.remove();

  if (isEdit) {
    const row = tbody.querySelector(`tr[data-id="${project.id}"]`);
    if (row) row.innerHTML = buildTableRow(project);
  } else {
    const tr      = document.createElement('tr');
    tr.dataset.id = project.id;
    tr.innerHTML  = buildTableRow(project);
    tbody.appendChild(tr);
  }
}

/* ----------------------------------------------------------
   STATS — Actualizar contadores
   ---------------------------------------------------------- */
function updateStats() {
  const nums = document.querySelectorAll('.admin-stat-number');
  if (nums.length < 4) return;
  nums[0].textContent = projects.length;
  nums[1].textContent = projects.filter(p => p.featured).length;
  nums[2].textContent = projects.filter(p => p.status === 'completado').length;
  nums[3].textContent = projects.filter(p => p.status === 'en-progreso').length;
}

/* ----------------------------------------------------------
   TOAST — Notificación
   ---------------------------------------------------------- */
function showToast(message, isError = false) {
  document.getElementById('adminToast')?.remove();
  const toast = document.createElement('div');
  toast.id    = 'adminToast';
  toast.style.cssText = `
    position:fixed; bottom:2rem; right:2rem; z-index:9999;
    background:${isError ? 'rgba(255,0,170,0.15)' : 'rgba(57,255,20,0.12)'};
    border:1px solid ${isError ? 'var(--neon-pink)' : 'var(--neon-green)'};
    color:${isError ? 'var(--neon-pink)' : 'var(--neon-green)'};
    padding:0.9rem 1.5rem; border-radius:10px;
    font-family:var(--font-display); font-size:0.85rem;
    letter-spacing:0.04em; max-width:340px;
    backdrop-filter:blur(10px);
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
    animation:slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ----------------------------------------------------------
   SUBIDA DE IMAGEN — Funciones
   ---------------------------------------------------------- */
function initImageUpload() {
  const zone        = document.getElementById('imageUploadZone');
  const fileInput   = document.getElementById('fieldImageUpload');
  const preview     = document.getElementById('imagePreview');
  const previewWrap = document.getElementById('imagePreviewWrapper');
  const removeBtn   = document.getElementById('imageRemoveBtn');
  const feedback    = document.getElementById('uploadFeedback');
  const hiddenField = document.getElementById('fieldImage');

  if (!zone || !fileInput) return;

  /* ---- Bloquea el drag & drop del navegador en toda la página ---- */
  document.addEventListener('dragover',  (e) => e.preventDefault());
  document.addEventListener('drop',      (e) => {
    // Solo procesa si el drop es sobre la zona; el resto lo bloquea
    if (!zone.contains(e.target)) e.preventDefault();
  });

  /* ---- Click en la zona → abre el selector de archivo ---- */
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  /* ---- Drag & Drop ---- */
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  /* ---- Selección de archivo con el input ---- */
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleImageFile(fileInput.files[0]);
  });

  /* ---- Botón "Quitar imagen" ---- */
  removeBtn?.addEventListener('click', () => {
    hiddenField.value = '';
    preview.src       = '';
    previewWrap.classList.add('hidden');
    zone.classList.remove('hidden');
    fileInput.value   = '';
    setUploadFeedback('', '');
  });

  /* ---- Procesa y sube el archivo seleccionado ---- */
  async function handleImageFile(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadFeedback('error', '❌ Formato no permitido. Usa JPG, PNG, GIF o WebP.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadFeedback('error', '❌ La imagen no puede superar los 3 MB.');
      return;
    }

    // Muestra preview local inmediato
    const localURL = URL.createObjectURL(file);
    preview.src    = localURL;
    previewWrap.classList.remove('hidden');
    zone.classList.add('hidden');
    setUploadFeedback('uploading', '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo imagen...');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res  = await fetch('api/upload.php', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al subir la imagen.');
      }

      hiddenField.value = data.path;
      preview.src       = '../' + data.path.replace(/^\/+/, '');
      URL.revokeObjectURL(localURL);
      setUploadFeedback('success', '✅ Imagen subida correctamente.');

    } catch (err) {
      setUploadFeedback('error', `❌ ${err.message}`);
      previewWrap.classList.add('hidden');
      zone.classList.remove('hidden');
      hiddenField.value = '';
      console.error(err);
    }
  }

  function setUploadFeedback(type, html) {
    if (!feedback) return;
    feedback.innerHTML = html;
    feedback.className = `upload-feedback${type ? ' ' + type : ''}`;
    feedback.classList.toggle('hidden', !html);
  }
}

/* ----------------------------------------------------------
   IMAGEN AL ABRIR EL EDITOR — muestra preview si ya existe
   ---------------------------------------------------------- */
function loadExistingImage(imagePath) {
  const previewWrap = document.getElementById('imagePreviewWrapper');
  const preview     = document.getElementById('imagePreview');
  const zone        = document.getElementById('imageUploadZone');
  const hiddenField = document.getElementById('fieldImage');
  const feedback    = document.getElementById('uploadFeedback');

  if (imagePath) {
    hiddenField.value = imagePath;
    preview.src       = '../' + imagePath.replace(/^\/+/, '');
    previewWrap.classList.remove('hidden');
    zone.classList.add('hidden');
    if (feedback) { feedback.innerHTML = ''; feedback.classList.add('hidden'); }
  } else {
    previewWrap.classList.add('hidden');
    zone.classList.remove('hidden');
    if (feedback) { feedback.innerHTML = ''; feedback.classList.add('hidden'); }
  }
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  // Sidebar
  const sidebar       = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  sidebarToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) && e.target !== sidebarToggle) {
      sidebar.classList.remove('open');
    }
  });

  // Búsqueda
  document.getElementById('adminSearch')?.addEventListener('input', function () {
    const term = this.value.trim().toLowerCase();
    document.querySelectorAll('#projectsTableBody tr[data-id]').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  // Tags
  document.getElementById('fieldTagInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(e.target.value);
      e.target.value = '';
    }
  });
  document.getElementById('fieldTagInput')?.addEventListener('blur', (e) => {
    if (e.target.value.trim()) { addTag(e.target.value); e.target.value = ''; }
  });
  document.getElementById('tagsInputWrapper')?.addEventListener('click', () => {
    document.getElementById('fieldTagInput')?.focus();
  });

  // Botón nuevo proyecto
  document.getElementById('btnNewProject')?.addEventListener('click', () => openEditor());

  // Cierre del editor
  document.getElementById('editorModalClose')?.addEventListener('click', closeEditor);
  document.getElementById('editorCancelBtn')?.addEventListener('click', closeEditor);
  document.getElementById('editorModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('editorModal')) closeEditor();
  });

  // Tabla — delegación de eventos
  document.getElementById('projectsTableBody')?.addEventListener('click', (e) => {
    const editBtn   = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');
    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      openEditor(projects.find(p => p.id === id) || null);
    }
    if (deleteBtn) {
      const id      = parseInt(deleteBtn.dataset.id, 10);
      const project = projects.find(p => p.id === id);
      openDeleteModal(id, project?.title || `#${id}`);
    }
  });

  // Submit del formulario
  document.getElementById('projectForm')?.addEventListener('submit', handleFormSubmit);

  // Modal de borrado
  document.getElementById('confirmCancelBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('deleteModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
  });
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleDelete);

  // Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeEditor(); closeDeleteModal(); }
  });

  // Subida de imagen
  initImageUpload();

});
