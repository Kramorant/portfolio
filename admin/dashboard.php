<?php
/* ============================================================
   dashboard.php — Panel principal de gestión de proyectos
   ============================================================ */

require_once 'config.php';
requireAuth();

$projects = readProjects();
$count    = count($projects);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Panel Admin | Portfolio</title>
  <link rel="stylesheet" href="../assets/css/style.css" />
  <link rel="stylesheet" href="assets/css/admin.css" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body class="admin-body">

  <!-- ===== SIDEBAR ===== -->
  <aside class="admin-sidebar" id="adminSidebar">
    <div class="sidebar-header">
      <a href="../index.html" class="nav-logo">
        <span class="neon-text">&lt;</span>KQ<span class="neon-text">/&gt;</span>
      </a>
      <span class="sidebar-label">Admin</span>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li>
          <a href="dashboard.php" class="sidebar-link active">
            <i class="fa-solid fa-table-columns"></i> Dashboard
          </a>
        </li>
        <li>
          <a href="../index.html" class="sidebar-link" target="_blank">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Portfolio
          </a>
        </li>
        <li>
          <a href="logout.php" class="sidebar-link sidebar-logout">
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </a>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- ===== CONTENIDO PRINCIPAL ===== -->
  <main class="admin-main">

    <!-- Topbar -->
    <header class="admin-topbar">
      <button class="sidebar-toggle" id="sidebarToggle" aria-label="Abrir menú">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h2 class="admin-page-title">Gestión de Proyectos</h2>
      <div class="topbar-actions">
        <button class="btn btn-primary" id="btnNewProject">
          <i class="fa-solid fa-plus"></i> Nuevo Proyecto
        </button>
      </div>
    </header>

    <!-- Stats rápidas -->
    <section class="admin-stats">
      <div class="admin-stat-card">
        <i class="fa-solid fa-diagram-project neon-text"></i>
        <div>
          <span class="admin-stat-number"><?= $count ?></span>
          <span class="admin-stat-label">Proyectos totales</span>
        </div>
      </div>
      <div class="admin-stat-card">
        <i class="fa-solid fa-star neon-text"></i>
        <div>
          <span class="admin-stat-number">
            <?= count(array_filter($projects, fn($p) => !empty($p['featured']))) ?>
          </span>
          <span class="admin-stat-label">Destacados</span>
        </div>
      </div>
      <div class="admin-stat-card">
        <i class="fa-solid fa-circle-check neon-text"></i>
        <div>
          <span class="admin-stat-number">
            <?= count(array_filter($projects, fn($p) => ($p['status'] ?? '') === 'completado')) ?>
          </span>
          <span class="admin-stat-label">Completados</span>
        </div>
      </div>
      <div class="admin-stat-card">
        <i class="fa-solid fa-spinner neon-text"></i>
        <div>
          <span class="admin-stat-number">
            <?= count(array_filter($projects, fn($p) => ($p['status'] ?? '') === 'en-progreso')) ?>
          </span>
          <span class="admin-stat-label">En progreso</span>
        </div>
      </div>
    </section>

    <!-- Tabla de proyectos -->
    <section class="admin-table-section">
      <div class="table-toolbar">
        <div class="search-bar" style="max-width:300px">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" id="adminSearch" placeholder="Buscar proyecto..." />
        </div>
      </div>

      <div class="table-wrapper">
        <table class="admin-table" id="projectsTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Tags</th>
              <th>Estado</th>
              <th>Destacado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="projectsTableBody">
            <?php if (empty($projects)): ?>
              <tr>
                <td colspan="7" class="table-empty">
                  <i class="fa-solid fa-inbox"></i> No hay proyectos todavía.
                  <br>¡Crea el primero pulsando "Nuevo Proyecto"!
                </td>
              </tr>
            <?php else: ?>
              <?php foreach ($projects as $p): ?>
                <tr data-id="<?= (int)$p['id'] ?>">
                  <td class="td-id"><?= (int)$p['id'] ?></td>
                  <td class="td-title">
                    <?= clean($p['title'] ?? '') ?>
                  </td>
                  <td class="td-tags">
                    <?php foreach (($p['tags'] ?? []) as $tag): ?>
                      <span class="tag"><?= clean($tag) ?></span>
                    <?php endforeach; ?>
                  </td>
                  <td>
                    <?php
                      $s = $p['status'] ?? '';
                      echo $s ? "<span class='status-badge {$s}'>" . clean($s) . "</span>" : '—';
                    ?>
                  </td>
                  <td class="td-featured">
                    <?= !empty($p['featured'])
                        ? '<i class="fa-solid fa-star" style="color:var(--neon-cyan)"></i>'
                        : '<i class="fa-regular fa-star" style="color:var(--text-muted)"></i>'
                    ?>
                  </td>
                  <td><?= clean($p['date'] ?? '—') ?></td>
                  <td class="td-actions">
                    <button
                      class="action-btn btn-edit"
                      data-id="<?= (int)$p['id'] ?>"
                      aria-label="Editar proyecto"
                      title="Editar"
                    >
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      class="action-btn btn-delete"
                      data-id="<?= (int)$p['id'] ?>"
                      aria-label="Eliminar proyecto"
                      title="Eliminar"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <!-- ===== MODAL — EDITOR DE PROYECTO ===== -->
  <div class="modal-overlay hidden" id="editorModal" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
    <div class="modal-box admin-modal-box">
      <button class="modal-close" id="editorModalClose" aria-label="Cerrar editor">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="modal-content">
        <h2 class="admin-modal-title" id="editorTitle">Nuevo Proyecto</h2>

        <form id="projectForm" class="project-editor-form" novalidate>
          <input type="hidden" id="fieldId" name="id" value="" />

          <!-- Fila 1: Título + Fecha -->
          <div class="form-row">
            <div class="form-group">
              <label for="fieldTitle">Título <span class="required">*</span></label>
              <input type="text" id="fieldTitle" name="title" placeholder="Nombre del proyecto" required />
            </div>
            <div class="form-group form-group-sm">
              <label for="fieldDate">Fecha</label>
              <input type="month" id="fieldDate" name="date" />
            </div>
          </div>

          <!-- Descripción corta -->
          <div class="form-group">
            <label for="fieldDesc">Descripción corta <span class="required">*</span></label>
            <textarea id="fieldDesc" name="description" rows="2"
              placeholder="Resumen breve que aparece en la tarjeta..." required></textarea>
          </div>

          <!-- Descripción larga -->
          <div class="form-group">
            <label for="fieldLongDesc">
              Descripción completa
              <span class="form-hint">(aparece en el modal de detalle)</span>
            </label>
            <textarea id="fieldLongDesc" name="longDescription" rows="4"
              placeholder="Descripción detallada del proyecto, tecnologías usadas, decisiones de diseño..."></textarea>
          </div>

          <!-- Fila 2: Repo + Demo + Docs -->
          <div class="form-row form-row-3">
            <div class="form-group">
              <label for="fieldRepo">
                <i class="fa-brands fa-github"></i> Repositorio
              </label>
              <input type="url" id="fieldRepo" name="repo"
                placeholder="https://github.com/..." />
            </div>
            <div class="form-group">
              <label for="fieldDemo">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Demo
              </label>
              <input type="url" id="fieldDemo" name="demo"
                placeholder="https://..." />
            </div>
            <div class="form-group">
              <label for="fieldDocs">
                <i class="fa-solid fa-book"></i> Documentación
              </label>
              <input type="url" id="fieldDocs" name="docs"
                placeholder="https://..." />
            </div>
          </div>

          <!-- Imagen -->
          <div class="form-group">
            <label for="fieldImageUpload">Imagen del proyecto</label>

            <!-- Zona de drop / click -->
            <div class="image-upload-zone" id="imageUploadZone" tabindex="0" role="button" aria-label="Subir imagen">
              <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
              <p class="upload-hint">Arrastra una imagen aquí o <span class="upload-link">haz clic para seleccionar</span></p>
              <p class="upload-hint-sm">JPG, PNG, GIF, WebP — máx. 3 MB</p>
              <input type="file" id="fieldImageUpload" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" />
            </div>

            <!-- Preview de la imagen seleccionada / actual -->
            <div class="image-preview-wrapper hidden" id="imagePreviewWrapper">
              <img id="imagePreview" src="" alt="Preview" class="image-preview" />
              <button type="button" class="image-remove-btn" id="imageRemoveBtn" aria-label="Eliminar imagen">
                <i class="fa-solid fa-xmark"></i> Quitar imagen
              </button>
            </div>

            <!-- Feedback de subida -->
            <p class="upload-feedback hidden" id="uploadFeedback"></p>

            <!-- Campo oculto que guarda la ruta final -->
            <input type="hidden" id="fieldImage" name="image" value="" />
            <span class="form-hint">La imagen se subirá automáticamente al seleccionarla</span>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label for="fieldTagInput">
              Tags / Tecnologías
              <span class="form-hint">(pulsa Enter o coma para añadir)</span>
            </label>
            <div class="tags-input-wrapper" id="tagsInputWrapper">
              <div class="tags-display" id="tagsDisplay"></div>
              <input
                type="text"
                id="fieldTagInput"
                placeholder="JavaScript, PHP..."
                autocomplete="off"
              />
            </div>
            <!-- Campo oculto que guarda los tags reales -->
            <input type="hidden" id="fieldTags" name="tags" value="" />
          </div>

          <!-- Fila 3: Estado + Destacado -->
          <div class="form-row form-row-2">
            <div class="form-group">
              <label for="fieldStatus">Estado</label>
              <select id="fieldStatus" name="status">
                <option value="">— Sin especificar —</option>
                <option value="completado">Completado</option>
                <option value="en-progreso">En progreso</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <div class="form-group form-group-checkbox">
              <label class="checkbox-label" for="fieldFeatured">
                <input type="checkbox" id="fieldFeatured" name="featured" />
                <span class="checkbox-custom"></span>
                <span>Marcar como destacado</span>
                <span class="form-hint">(aparece en el inicio)</span>
              </label>
            </div>
          </div>

          <!-- Botones del formulario -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="editorCancelBtn">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" id="editorSaveBtn">
              <i class="fa-solid fa-floppy-disk"></i> Guardar proyecto
            </button>
          </div>

          <!-- Feedback del editor -->
          <p class="form-feedback hidden" id="editorFeedback"></p>
        </form>
      </div>
    </div>
  </div>

  <!-- ===== MODAL DE CONFIRMACIÓN DE BORRADO ===== -->
  <div class="modal-overlay hidden" id="deleteModal" role="dialog" aria-modal="true">
    <div class="modal-box confirm-modal-box">
      <div class="confirm-icon">
        <i class="fa-solid fa-trash-can" style="color:var(--neon-pink)"></i>
      </div>
      <h3 class="confirm-title">¿Eliminar proyecto?</h3>
      <p class="confirm-text" id="confirmText">Esta acción no se puede deshacer.</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirmCancelBtn">Cancelar</button>
        <button class="btn" style="background:var(--neon-pink);color:#fff" id="confirmDeleteBtn">
          <i class="fa-solid fa-trash-can"></i> Sí, eliminar
        </button>
      </div>
    </div>
  </div>

  <!-- Pasa los proyectos actuales a JS para no volver a pedirlos -->
  <script>
    window.__adminProjects = <?= json_encode($projects, JSON_UNESCAPED_UNICODE) ?>;
  </script>
  <script src="js/admin.js"></script>
</body>
</html>