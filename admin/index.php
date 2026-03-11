<?php
/* ============================================================
   index.php — Pantalla de login del panel admin
   ============================================================ */

require_once 'config.php';

// Si ya está logueado, redirige al dashboard
if (!empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: dashboard.php');
    exit;
}

$error   = '';
$expired = isset($_GET['expired']);

// Procesa el formulario de login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';

    if ($user === ADMIN_USER && password_verify($pass, ADMIN_PASSWORD)) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['last_activity']   = time();
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Usuario o contraseña incorrectos.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Login | Portfolio</title>
  <link rel="stylesheet" href="../assets/css/style.css" />
  <link rel="stylesheet" href="assets/css/admin.css" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body class="admin-body">

  <div class="login-wrapper">
    <div class="login-card">

      <div class="login-header">
        <a href="../index.html" class="nav-logo login-logo">
          <span class="neon-text">&lt;</span>KQ<span class="neon-text">/&gt;</span>
        </a>
        <h1 class="login-title">Panel Admin</h1>
        <p class="login-subtitle">Acceso restringido</p>
      </div>

      <?php if ($expired): ?>
        <div class="alert alert-warning">
          <i class="fa-solid fa-clock"></i> Sesión expirada. Por favor, inicia sesión de nuevo.
        </div>
      <?php endif; ?>

      <?php if ($error): ?>
        <div class="alert alert-error">
          <i class="fa-solid fa-triangle-exclamation"></i> <?= $error ?>
        </div>
      <?php endif; ?>

      <form method="POST" action="index.php" class="login-form" autocomplete="off">
        <!-- Token CSRF básico -->
        <input type="hidden" name="csrf" value="<?= session_id() ?>">

        <div class="form-group">
          <label for="username">Usuario</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="admin"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-wrapper">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" aria-label="Mostrar contraseña">
              <i class="fa-regular fa-eye" id="eyeIcon"></i>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary login-submit">
          <i class="fa-solid fa-right-to-bracket"></i> Entrar
        </button>
      </form>

      <a href="../index.html" class="login-back">
        <i class="fa-solid fa-arrow-left"></i> Volver al portfolio
      </a>
    </div>
  </div>

  <script>
    // Mostrar/ocultar contraseña
    const toggleBtn = document.querySelector('.toggle-password');
    const passInput = document.getElementById('password');
    const eyeIcon   = document.getElementById('eyeIcon');

    toggleBtn?.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type   = isPassword ? 'text' : 'password';
      eyeIcon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  </script>
</body>
</html>