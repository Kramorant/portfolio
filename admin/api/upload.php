<?php
/* ============================================================
   api/upload.php — Endpoint para subida de imágenes de proyectos
   POST /admin/api/upload.php  (multipart/form-data)
     Campo: image → archivo de imagen
   Responde: { "success": true, "path": "assets/img/projects/nombre.ext" }
   ============================================================ */

require_once '../config.php';
requireAuth();

// Solo acepta POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método no permitido.'], 405);
}

// Comprueba que llegó el archivo
if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $errMsg = uploadErrorMessage($_FILES['image']['error'] ?? -1);
    jsonResponse(['error' => $errMsg], 422);
}

$file     = $_FILES['image'];
$maxSize  = 3 * 1024 * 1024;  // 3 MB máximo

// Valida tamaño
if ($file['size'] > $maxSize) {
    jsonResponse(['error' => 'La imagen no puede superar los 3 MB.'], 422);
}

// Valida tipo MIME real (no confiar solo en la extensión)
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$allowed  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!in_array($mimeType, $allowed)) {
    jsonResponse(['error' => 'Formato no permitido. Usa JPG, PNG, GIF o WebP.'], 422);
}

// Extensión segura basada en el MIME real
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp',
];
$ext = $extensions[$mimeType];

// Nombre de archivo único para evitar colisiones
$filename  = uniqid('project_', true) . '.' . $ext;

// Directorio destino — relativo a la raíz del portfolio
$uploadDir = dirname(__DIR__, 2) . '/assets/img/projects/';

// Crea el directorio si no existe
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['error' => 'Error al guardar la imagen en el servidor.'], 500);
}

// Devuelve la ruta relativa lista para usar en el JSON de proyectos
jsonResponse([
    'success' => true,
    'path'    => 'assets/img/projects/' . $filename,
]);

/* ----------------------------------------------------------
   Traduce los códigos de error de $_FILES a mensajes legibles
   ---------------------------------------------------------- */
function uploadErrorMessage(int $code): string {
    return match($code) {
        UPLOAD_ERR_INI_SIZE,
        UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el tamaño máximo permitido.',
        UPLOAD_ERR_PARTIAL    => 'La subida se interrumpió. Inténtalo de nuevo.',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo.',
        UPLOAD_ERR_NO_TMP_DIR => 'Error interno del servidor (sin directorio temporal).',
        UPLOAD_ERR_CANT_WRITE => 'Error interno del servidor (sin permisos de escritura).',
        default               => 'Error desconocido al subir el archivo.',
    };
}
