(() => {
  'use strict';

  const header = document.getElementById('siteHeader');
  const menu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('mobileMenuClose');
  const toggle = document.getElementById('navToggle');
  const themeBtn = document.getElementById('themeToggle');

  // Theme toggle (initial value set by inline script in <head> to prevent FOUC)
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
      themeBtn.setAttribute('aria-label', next === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
    });
  }

  // Header scroll shadow
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu — body-level overlay (not inside header to avoid stacking context issues)
  if (toggle && menu) {
    const setOpen = (open) => {
      if (open) {
        menu.removeAttribute('hidden');
        // Force reflow so the transition kicks in
        void menu.offsetWidth;
      }
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      if (!open) {
        setTimeout(() => { if (!menu.classList.contains('open')) menu.setAttribute('hidden', ''); }, 260);
      }
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    if (menuClose) menuClose.addEventListener('click', () => setOpen(false));
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && menu.classList.contains('open')) setOpen(false);
    });
  }

  // Scroll reveal animations with stagger (sibling-based)
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      // Group entries by parent to compute stagger index within siblings
      const visibleByParent = new Map();
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const parent = entry.target.parentElement;
        const arr = visibleByParent.get(parent) || [];
        arr.push(entry.target);
        visibleByParent.set(parent, arr);
      });
      visibleByParent.forEach((targets, parent) => {
        const siblings = Array.from(parent.querySelectorAll(':scope > .reveal'));
        targets.forEach(el => {
          const idx = siblings.indexOf(el);
          const delay = Math.min(idx, 8) * 80; // cap at 8 to avoid huge delays
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('visible');
          io.unobserve(el);
        });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Count-up numbers — data-count="5000" data-suffix="+"
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length && 'IntersectionObserver' in window) {
    const animateCount = (el) => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
      const duration = 1400;
      const start = performance.now();
      const formatter = (v) => {
        const n = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('tr-TR');
        return prefix + n + suffix;
      };
      const tick = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = formatter(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = formatter(target);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    countEls.forEach(el => cio.observe(el));
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
