/* ============================================================
   github.js — Toda la integración con la GitHub API (REST)
   Solo se carga en dashboard.html
   - Perfil de usuario
   - Actividad reciente (eventos)
   - Repositorios recientes
   - Gráfico de lenguajes con Chart.js
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   CONFIGURACIÓN — Cambia solo este objeto
   ---------------------------------------------------------- */
const GH_CONFIG = {
  username:   'Kramorant',
  maxRepos:   6,      // repos mostrados en el dashboard
  maxEvents:  10,     // eventos en el feed de actividad
  maxLangRepos: 30,   // repos analizados para el gráfico de lenguajes
};

// Colores neón para el gráfico de lenguajes
const LANG_COLORS = {
  JavaScript:  '#f7df1e',
  TypeScript:  '#3178c6',
  Python:      '#3572A5',
  HTML:        '#e34c26',
  CSS:         '#563d7c',
  PHP:         '#4F5D95',
  Java:        '#b07219',
  'C#':        '#178600',
  'C++':       '#f34b7d',
  C:           '#555555',
  Ruby:        '#701516',
  Go:          '#00ADD8',
  Rust:        '#dea584',
  Shell:       '#89e051',
  Vue:         '#41b883',
  Svelte:      '#ff3e00',
  Kotlin:      '#A97BFF',
  Swift:       '#ffac45',
  Dart:        '#00B4AB',
  Other:       '#00f5ff',  // neon-cyan para el resto
};

/* ----------------------------------------------------------
   HELPER — Petición a la GitHub API
   ---------------------------------------------------------- */
async function ghFetch(endpoint) {
  const url = `https://api.github.com${endpoint}`;
  const res  = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github+json' },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${endpoint}`);
  }
  return res.json();
}

/* ----------------------------------------------------------
   HELPER — Fecha relativa legible (ej: "hace 3 días")
   ---------------------------------------------------------- */
function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const s  = Math.floor(diff / 1000);
  const m  = Math.floor(s / 60);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  const mo = Math.floor(d / 30);

  if (mo > 0) return `hace ${mo} mes${mo > 1 ? 'es' : ''}`;
  if (d  > 0) return `hace ${d} día${d > 1 ? 's' : ''}`;
  if (h  > 0) return `hace ${h} hora${h > 1 ? 's' : ''}`;
  if (m  > 0) return `hace ${m} minuto${m > 1 ? 's' : ''}`;
  return 'justo ahora';
}

/* ----------------------------------------------------------
   HELPER — Color de lenguaje
   ---------------------------------------------------------- */
function getLangColor(lang) {
  return LANG_COLORS[lang] || LANG_COLORS.Other;
}

/* ----------------------------------------------------------
   1. PERFIL DE USUARIO
   ---------------------------------------------------------- */
async function loadProfile() {
  const container = document.getElementById('profileCard');
  if (!container) return;

  try {
    const user = await ghFetch(`/users/${GH_CONFIG.username}`);

    container.innerHTML = `
      <img
        src="${user.avatar_url}"
        alt="Avatar de ${user.login}"
        class="profile-avatar"
        loading="lazy"
      />
      <div class="profile-info">
        <h3 class="profile-name">${user.name || user.login}</h3>
        <p class="profile-login">@${user.login}</p>
        ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
        <div class="profile-meta">
          ${user.location  ? `<span class="profile-meta-item"><i class="fa-solid fa-location-dot"></i>${user.location}</span>`  : ''}
          ${user.company   ? `<span class="profile-meta-item"><i class="fa-solid fa-building"></i>${user.company}</span>`       : ''}
          ${user.blog      ? `<span class="profile-meta-item"><i class="fa-solid fa-link"></i><a href="${user.blog}" target="_blank">${user.blog}</a></span>` : ''}
          ${user.created_at? `<span class="profile-meta-item"><i class="fa-solid fa-calendar"></i>Miembro desde ${new Date(user.created_at).getFullYear()}</span>` : ''}
        </div>
      </div>
      <div class="profile-stats">
        <div class="profile-stat-item">
          <div class="profile-stat-number">${user.public_repos}</div>
          <div class="profile-stat-label">Repos</div>
        </div>
        <div class="profile-stat-item">
          <div class="profile-stat-number">${user.followers}</div>
          <div class="profile-stat-label">Seguidores</div>
        </div>
        <div class="profile-stat-item">
          <div class="profile-stat-number">${user.following}</div>
          <div class="profile-stat-label">Siguiendo</div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = errorHTML('No se pudo cargar el perfil de GitHub.');
    console.error(err);
  }
}

/* ----------------------------------------------------------
   2. REPOSITORIOS RECIENTES
   ---------------------------------------------------------- */
async function loadRepos() {
  const container = document.getElementById('reposGrid');
  if (!container) return;

  try {
    const repos = await ghFetch(
      `/users/${GH_CONFIG.username}/repos?sort=updated&per_page=${GH_CONFIG.maxRepos}`
    );

    if (!repos.length) {
      container.innerHTML = `<p class="loading-placeholder">No hay repositorios públicos.</p>`;
      return;
    }

    container.innerHTML = repos.map(repo => `
      <a
        href="${repo.html_url}"
        target="_blank"
        rel="noopener noreferrer"
        class="repo-card"
        aria-label="Repositorio ${repo.name}"
      >
        <div class="repo-card-name">
          <i class="fa-solid fa-book-open"></i>
          ${repo.name}
        </div>
        <p class="repo-card-desc">
          ${repo.description || '<em>Sin descripción</em>'}
        </p>
        <div class="repo-card-meta">
          ${repo.language ? `
            <span class="repo-meta-item">
              <span class="lang-dot" style="background:${getLangColor(repo.language)}"></span>
              ${repo.language}
            </span>` : ''}
          <span class="repo-meta-item">
            <i class="fa-regular fa-star"></i> ${repo.stargazers_count}
          </span>
          <span class="repo-meta-item">
            <i class="fa-solid fa-code-fork"></i> ${repo.forks_count}
          </span>
          <span class="repo-meta-item">
            <i class="fa-regular fa-clock"></i> ${timeAgo(repo.updated_at)}
          </span>
        </div>
      </a>
    `).join('');

  } catch (err) {
    container.innerHTML = errorHTML('No se pudieron cargar los repositorios.');
    console.error(err);
  }
}

/* ----------------------------------------------------------
   3. FEED DE ACTIVIDAD RECIENTE (GitHub Events API)
   ---------------------------------------------------------- */

// Icono y descripción según el tipo de evento
function parseEvent(event) {
  const repo    = event.repo.name;
  const repoUrl = `https://github.com/${repo}`;
  const repoLink = `<a href="${repoUrl}" target="_blank">${repo}</a>`;

  const map = {
    PushEvent: {
      icon: 'fa-code-commit',
      text: () => {
        const count = event.payload?.commits?.length || 1;
        return `Hizo <strong>${count} commit${count > 1 ? 's' : ''}</strong> en ${repoLink}`;
      },
    },
    CreateEvent: {
      icon: 'fa-plus',
      text: () => {
        const ref  = event.payload?.ref_type || 'rama';
        const name = event.payload?.ref ? ` <strong>${event.payload.ref}</strong>` : '';
        return `Creó ${ref}${name} en ${repoLink}`;
      },
    },
    WatchEvent: {
      icon: 'fa-star',
      text: () => `Marcó con ⭐ ${repoLink}`,
    },
    ForkEvent: {
      icon: 'fa-code-fork',
      text: () => `Hizo fork de ${repoLink}`,
    },
    IssuesEvent: {
      icon: 'fa-circle-dot',
      text: () => {
        const action = event.payload?.action || 'interactuó con';
        return `${capitalize(action)} un issue en ${repoLink}`;
      },
    },
    PullRequestEvent: {
      icon: 'fa-code-pull-request',
      text: () => {
        const action = event.payload?.action || 'abrió';
        return `${capitalize(action)} un Pull Request en ${repoLink}`;
      },
    },
    IssueCommentEvent: {
      icon: 'fa-comment-code',
      text: () => `Comentó en un issue de ${repoLink}`,
    },
    DeleteEvent: {
      icon: 'fa-trash-can',
      text: () => {
        const ref = event.payload?.ref_type || 'elemento';
        return `Eliminó una ${ref} en ${repoLink}`;
      },
    },
    ReleaseEvent: {
      icon: 'fa-tag',
      text: () => {
        const name = event.payload?.release?.name || 'nueva versión';
        return `Publicó <strong>${name}</strong> en ${repoLink}`;
      },
    },
  };

  return map[event.type] || {
    icon: 'fa-bolt',
    text: () => `Actividad en ${repoLink}`,
  };
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

async function loadActivity() {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  try {
    const events = await ghFetch(
      `/users/${GH_CONFIG.username}/events/public?per_page=${GH_CONFIG.maxEvents}`
    );

    if (!events.length) {
      container.innerHTML = `<p class="loading-placeholder">No hay actividad pública reciente.</p>`;
      return;
    }

    container.innerHTML = events.map(event => {
      const parsed = parseEvent(event);
      return `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fa-solid ${parsed.icon}"></i>
          </div>
          <div class="activity-body">
            <p>${parsed.text()}</p>
            <span class="activity-time">${timeAgo(event.created_at)}</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = errorHTML('No se pudo cargar la actividad reciente.');
    console.error(err);
  }
}

/* ----------------------------------------------------------
   4. GRÁFICO DE LENGUAJES con Chart.js
   ---------------------------------------------------------- */
async function loadLanguagesChart() {
  const canvas    = document.getElementById('languagesChart');
  const legendEl  = document.getElementById('chartLegend');
  if (!canvas || !legendEl) return;

  // Muestra spinner mientras carga
  legendEl.innerHTML = `<span style="color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Calculando lenguajes...</span>`;

  try {
    // 1. Obtiene los repos del usuario
    const repos = await ghFetch(
      `/users/${GH_CONFIG.username}/repos?per_page=${GH_CONFIG.maxLangRepos}&sort=updated`
    );

    // 2. Para cada repo, obtiene el desglose de lenguajes (en bytes)
    const langMap = {};
    const langRequests = repos
      .filter(r => !r.fork)  // excluye forks para que sea solo tu código
      .map(repo =>
        ghFetch(`/repos/${GH_CONFIG.username}/${repo.name}/languages`)
          .then(langs => {
            for (const [lang, bytes] of Object.entries(langs)) {
              langMap[lang] = (langMap[lang] || 0) + bytes;
            }
          })
          .catch(() => {}) // si un repo falla, continúa
      );

    await Promise.all(langRequests);

    if (!Object.keys(langMap).length) {
      legendEl.innerHTML = `<span style="color:var(--text-muted)">Sin datos de lenguajes.</span>`;
      return;
    }

    // 3. Ordena y toma el top 8; el resto se agrupa en "Other"
    const sorted  = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
    const top8    = sorted.slice(0, 8);
    const rest    = sorted.slice(8).reduce((acc, [, v]) => acc + v, 0);
    if (rest > 0) top8.push(['Other', rest]);

    const total   = top8.reduce((acc, [, v]) => acc + v, 0);
    const labels  = top8.map(([l]) => l);
    const data    = top8.map(([, v]) => v);
    const colors  = labels.map(getLangColor);

    // 4. Renderiza el gráfico con Chart.js
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor:  colors.map(c => c + 'cc'),  // ligeramente transparente
          borderColor:      colors,
          borderWidth:      1.5,
          hoverOffset:      10,
        }],
      },
      options: {
        responsive:  true,
        cutout:      '65%',
        plugins: {
          legend: { display: false },  // usamos leyenda personalizada
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = ((ctx.raw / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${pct}%`;
              },
            },
            backgroundColor: '#0d0d1a',
            borderColor:      '#00f5ff44',
            borderWidth:      1,
            titleColor:       '#00f5ff',
            bodyColor:        '#e8e8f0',
          },
        },
      },
    });

    // 5. Leyenda personalizada
    legendEl.innerHTML = top8.map(([lang, bytes]) => {
      const pct = ((bytes / total) * 100).toFixed(1);
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${getLangColor(lang)}"></span>
          <span>${lang}</span>
          <span style="color:var(--text-muted);margin-left:0.3rem">${pct}%</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    legendEl.innerHTML = errorHTML('No se pudo cargar el gráfico de lenguajes.');
    console.error(err);
  }
}

/* ----------------------------------------------------------
   5. FORMULARIO DE CONTACTO (Formspree)
   ---------------------------------------------------------- */
function initContactForm() {
  const form     = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.contact-submit');
    submitBtn.disabled   = true;
    submitBtn.innerHTML  = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    try {
      const res = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        feedback.textContent = '✅ ¡Mensaje enviado correctamente! Te responderé pronto.';
        feedback.className   = 'form-feedback success';
        feedback.classList.remove('hidden');
        form.reset();
      } else {
        throw new Error('Error en el servidor');
      }
    } catch {
      feedback.textContent = '❌ Hubo un problema al enviar el mensaje. Inténtalo de nuevo.';
      feedback.className   = 'form-feedback error';
      feedback.classList.remove('hidden');
    } finally {
      submitBtn.disabled   = false;
      submitBtn.innerHTML  = '<i class="fa-solid fa-paper-plane"></i> Enviar mensaje';
      // Oculta el feedback tras 6 segundos
      setTimeout(() => feedback.classList.add('hidden'), 6000);
    }
  });
}

/* ----------------------------------------------------------
   HELPER — HTML de error reutilizable
   ---------------------------------------------------------- */
function errorHTML(msg) {
  return `
    <div class="loading-placeholder" style="color:var(--neon-pink)">
      <i class="fa-solid fa-triangle-exclamation"></i> ${msg}
    </div>
  `;
}

/* ----------------------------------------------------------
   INIT — Arranca todo en DOMContentLoaded
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadRepos();
  loadActivity();
  loadLanguagesChart();
  initContactForm();
});