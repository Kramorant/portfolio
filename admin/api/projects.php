<?php
/* ============================================================
   api/projects.php — API REST interna para CRUD de proyectos
   Endpoints:
     GET    /admin/api/projects.php          → lista todos
     POST   /admin/api/projects.php          → crea nuevo
     PUT    /admin/api/projects.php?id=X     → actualiza
     DELETE /admin/api/projects.php?id=X     → elimina
   ============================================================ */

require_once '../config.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    /* ---- LISTAR todos los proyectos ---- */
    case 'GET':
        jsonResponse(['projects' => readProjects()]);
        break;

    /* ---- CREAR nuevo proyecto ---- */
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body || empty($body['title'])) {
            jsonResponse(['error' => 'El campo título es obligatorio.'], 422);
        }

        $projects = readProjects();

        // Genera ID incremental
        $maxId = !empty($projects)
            ? max(array_column($projects, 'id'))
            : 0;

        $new = sanitizeProject($body, $maxId + 1);
        $projects[] = $new;

        if (!saveProjects($projects)) {
            jsonResponse(['error' => 'No se pudo guardar el proyecto.'], 500);
        }

        jsonResponse(['success' => true, 'project' => $new], 201);
        break;

    /* ---- ACTUALIZAR proyecto existente ---- */
    case 'PUT':
        if (!$id) {
            jsonResponse(['error' => 'ID requerido.'], 400);
        }

        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body || empty($body['title'])) {
            jsonResponse(['error' => 'El campo título es obligatorio.'], 422);
        }

        $projects = readProjects();
        $index    = array_search($id, array_column($projects, 'id'));

        if ($index === false) {
            jsonResponse(['error' => 'Proyecto no encontrado.'], 404);
        }

        $updated         = sanitizeProject($body, $id);
        $projects[$index] = $updated;

        if (!saveProjects($projects)) {
            jsonResponse(['error' => 'No se pudo guardar el proyecto.'], 500);
        }

        jsonResponse(['success' => true, 'project' => $updated]);
        break;

    /* ---- ELIMINAR proyecto ---- */
    case 'DELETE':
        if (!$id) {
            jsonResponse(['error' => 'ID requerido.'], 400);
        }

        $projects = readProjects();
        $filtered = array_filter($projects, fn($p) => (int)$p['id'] !== $id);

        if (count($filtered) === count($projects)) {
            jsonResponse(['error' => 'Proyecto no encontrado.'], 404);
        }

        if (!saveProjects($filtered)) {
            jsonResponse(['error' => 'No se pudo eliminar el proyecto.'], 500);
        }

        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Método no permitido.'], 405);
}

/* ----------------------------------------------------------
   Sanitiza y normaliza los campos de un proyecto
   ---------------------------------------------------------- */
function sanitizeProject(array $data, int $id): array {
    return [
        'id'              => $id,
        'featured'        => !empty($data['featured']),
        'title'           => clean($data['title']          ?? ''),
        'description'     => clean($data['description']    ?? ''),
        'longDescription' => clean($data['longDescription']?? ''),
        'repo'            => filter_var($data['repo']  ?? '', FILTER_SANITIZE_URL),
        'demo'            => filter_var($data['demo']  ?? '', FILTER_SANITIZE_URL),
        'docs'            => filter_var($data['docs']  ?? '', FILTER_SANITIZE_URL),
        'image'           => clean($data['image']          ?? ''),
        'tags'            => array_values(array_filter(
                                array_map('trim', (array)($data['tags'] ?? []))
                             )),
        'status'          => in_array($data['status'] ?? '', ['completado','en-progreso','pausado',''])
                                ? ($data['status'] ?? '')
                                : '',
        'date'            => clean($data['date'] ?? ''),
    ];
}