/* ============================================================
   main.js — Lógica general compartida en todas las páginas
   - Navbar: scroll + hamburguesa
   - Efecto typewriter (solo index)
   - Año actual en el footer
   - Scroll reveal de secciones
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   1. NAVBAR — Clase "scrolled" al bajar la página
   ---------------------------------------------------------- */
const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');

// Añade/quita clase según el scroll
window.addEventListener('scroll', () => {
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
});

/* ----------------------------------------------------------
   2. NAVBAR — Menú hamburguesa (móvil)
   ---------------------------------------------------------- */
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Cierra el menú al pulsar un link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });

  // Cierra el menú al pulsar fuera
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    }
  });
}

/* ----------------------------------------------------------
   3. AÑO ACTUAL en el footer
   ---------------------------------------------------------- */
const yearEls = document.querySelectorAll('#currentYear, .currentYear');
yearEls.forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ----------------------------------------------------------
   4. EFECTO TYPEWRITER (solo index.html)
   ---------------------------------------------------------- */
const typewriterEl = document.getElementById('typewriter');

if (typewriterEl) {
  const phrases = [
    'Desarrollador Web Novato',
    'Interesado en Sistemas y Redes',
    'Entusiasta del Open Source',
    'Siempre Aprendiendo...',
  ];

  let phraseIndex  = 0;
  let charIndex    = 0;
  let isDeleting   = false;
  let typingSpeed  = 100;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      // Borrando
      typewriterEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 55;
    } else {
      // Escribiendo
      typewriterEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    }

    // Fin de escritura → pausa antes de borrar
    if (!isDeleting && charIndex === currentPhrase.length) {
      typingSpeed  = 1800;
      isDeleting   = true;
    }

    // Fin de borrado → siguiente frase
    if (isDeleting && charIndex === 0) {
      isDeleting  = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingSpeed = 350;
    }

    setTimeout(type, typingSpeed);
  }

  // Pequeño delay inicial antes de arrancar
  setTimeout(type, 600);
}

/* ----------------------------------------------------------
   5. SCROLL REVEAL — Animación de entrada al hacer scroll
      Añade clase "visible" cuando el elemento entra en viewport
   ---------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.project-card, .repo-card, .activity-item, ' +
    '.profile-card, .chart-wrapper, .stat-card-wrapper, ' +
    '.about-grid, .section-title'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // solo una vez
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// Añade los estilos de reveal dinámicamente para no depender de más archivos CSS
(function injectRevealStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(22px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', initScrollReveal);