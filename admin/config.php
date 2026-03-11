<?php
/* ============================================================
   config.php — Configuración central del panel admin
   ============================================================ */

session_start();

define('ADMIN_USER',     getenv('ADMIN_USER')     ?: 'admin');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: '');
define('PROJECTS_FILE', dirname(__DIR__) . '/projects/data/projects.json');
define('SESSION_LIFETIME', (int)(getenv('SESSION_LIFETIME') ?: 1800));

/* ----------------------------------------------------------
   Comprueba que el usuario esté autenticado y que la sesión
   no haya expirado. Si no, redirige al login.
   ---------------------------------------------------------- */
function requireAuth(): void {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header('Location: ' . (str_contains($_SERVER['PHP_SELF'], '/api/') ? '../index.php?expired=1' : 'index.php?expired=1'));
        exit;
    }

    // Control de expiración por inactividad
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > SESSION_LIFETIME) {
        session_unset();
        session_destroy();
        header('Location: ' . (str_contains($_SERVER['PHP_SELF'], '/api/') ? '../index.php?expired=1' : 'index.php?expired=1'));
        exit;
    }

    $_SESSION['last_activity'] = time();
}

/* ----------------------------------------------------------
   Lee y devuelve el array de proyectos desde el JSON.
   Devuelve [] si el archivo no existe o tiene errores.
   ---------------------------------------------------------- */
function readProjects(): array {
    if (!file_exists(PROJECTS_FILE)) {
        return [];
    }
    $json = file_get_contents(PROJECTS_FILE);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

/* ----------------------------------------------------------
   Persiste el array de proyectos en el JSON.
   Devuelve true si se guardó correctamente.
   ---------------------------------------------------------- */
function saveProjects(array $projects): bool {
    $dir = dirname(PROJECTS_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
        return false;
    }
    $json = json_encode(array_values($projects), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents(PROJECTS_FILE, $json) !== false;
}

/* ----------------------------------------------------------
   Envía una respuesta JSON y termina la ejecución.
   ---------------------------------------------------------- */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/* ----------------------------------------------------------
   Escapa una cadena para usarla de forma segura en HTML.
   ---------------------------------------------------------- */
function clean(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
