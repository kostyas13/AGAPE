// AGAPE Rénovation, shared behaviour

// mark JS availability early: reveal styles only apply under html.js,
// so the site stays fully visible without JavaScript
document.documentElement.classList.add('js');

// ---- loader: play once per session, animate the percent counter ----
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  if (document.documentElement.classList.contains('loader-skip')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove();
    return;
  }

  document.documentElement.classList.add('loader-active');

  const durMs = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--loader-dur')) * 1000 || 5600;
  const percentEl = loader.querySelector('.loader-percent');
  const start = performance.now();

  (function tick(now) {
    const p = Math.min((now - start) / (durMs * 0.66), 1);
    if (percentEl) percentEl.textContent = Math.round(p * 100) + '%';
    if (p < 1) requestAnimationFrame(tick);
  })(start);

  setTimeout(() => {
    loader.remove();
    document.documentElement.classList.remove('loader-active');
  }, durMs + 100);
})();

// ---- scroll reveal: services list, works grid frames, journal entries ----
(function () {
  const targets = document.querySelectorAll('.lot-card, .work, .journal-card');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });

  targets.forEach(el => io.observe(el));
})();

// ---- renovation cost estimator ----
(function () {
  const form = document.getElementById('estimateForm');
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const inputs = {
    surface: el('est-surface'),
    standing: el('est-standing'),
  };
  const out = {
    value: el('estValue'),
    rate: el('estRate'),
    labor: el('estLabor'),
    materials: el('estMaterials'),
    logistics: el('estLogistics'),
    duration: el('estDuration'),
  };

  // ponytail: fixed team/pace, hidden from UI (reference: 1 pro / 10 m², 6-day week)
  const TEAM_PER_M2 = 10;
  const DAYS_PER_WEEK = 6;

  const cfg = {
    dayRate: 200,
    manDaysPerM2: { essentiel: 3.8, standard: 4.8, premium: 6.4 },
    materialsPerM2: { essentiel: 350, standard: 620, premium: 1100 },
    logisticsPct: 0.12,
    variance: 0.15,
  };

  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'fr-FR';
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  });

  const unitLabels = {
    fr: { m2: 'm²', wk1: 'semaine', wkN: 'semaines' },
    en: { m2: 'sq m', wk1: 'week', wkN: 'weeks' },
    ru: { m2: 'м²', wk1: 'неделя', wkFew: 'недели', wkMany: 'недель' },
  };
  const L = unitLabels[lang] || unitLabels.fr;

  function pluralWeeks(n) {
    if (lang === 'ru') {
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return L.wk1;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return L.wkFew;
      return L.wkMany;
    }
    return n === 1 ? L.wk1 : L.wkN;
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function compute() {
    const surface  = clamp(parseInt(inputs.surface.value, 10)  || 0, 10, 600);
    const standing = cfg.manDaysPerM2[inputs.standing.value] ? inputs.standing.value : 'standard';
    const team     = Math.max(2, Math.round(surface / TEAM_PER_M2));

    const manDays   = surface * cfg.manDaysPerM2[standing];
    const labor     = manDays * cfg.dayRate;
    const materials = surface * cfg.materialsPerM2[standing];
    const logistics = (labor + materials) * cfg.logisticsPct;
    const total     = labor + materials + logistics;
    const low  = total * (1 - cfg.variance);
    const high = total * (1 + cfg.variance);

    const weeks = Math.max(1, Math.round(manDays / team / DAYS_PER_WEEK));

    out.value.textContent    = fmt.format(low) + ' – ' + fmt.format(high);
    out.rate.textContent     = fmt.format(total / surface) + ' / ' + L.m2;
    out.labor.textContent    = fmt.format(labor);
    out.materials.textContent = fmt.format(materials);
    out.logistics.textContent = fmt.format(logistics);
    out.duration.textContent = '≈ ' + weeks + ' ' + pluralWeeks(weeks);
  }

  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  compute();
})();

// ---- custom finition dropdown (replaces native select) ----
(function () {
  const sel = document.getElementById('est-standing');
  if (!sel) return;

  // ponytail: accessible name reused from the visible <label>, so it follows the page language
  const selName = (document.querySelector('label[for="est-standing"]') || {}).textContent || 'Finition';

  const wrap = document.createElement('div');
  wrap.className = 'select-custom';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', selName);
  const label = document.createElement('span');
  label.className = 'select-label';
  const caret = document.createElement('span');
  caret.className = 'select-caret';
  caret.setAttribute('aria-hidden', 'true');
  trigger.append(label, caret);

  const list = document.createElement('ul');
  list.className = 'select-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', selName);

  Array.from(sel.options).forEach((opt) => {
    const li = document.createElement('li');
    li.className = 'select-option';
    li.setAttribute('role', 'option');
    li.dataset.value = opt.value;
    li.textContent = opt.textContent;
    if (opt.selected) {
      li.setAttribute('aria-selected', 'true');
      label.textContent = opt.textContent;
    }
    li.addEventListener('click', () => {
      sel.value = opt.value;
      label.textContent = opt.textContent;
      list.querySelectorAll('.select-option').forEach(o => o.removeAttribute('aria-selected'));
      li.setAttribute('aria-selected', 'true');
      close();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    list.appendChild(li);
  });

  function open() {
    wrap.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function close() {
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.contains('open') ? close() : open();
  });
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  wrap.append(trigger, list);
  sel.classList.add('select-native');
  sel.parentNode.insertBefore(wrap, sel);
})();

// ---- fullscreen menu overlay ----
(function () {
  const menuOverlay = document.getElementById('menuOverlay');
  const menuTrigger = document.getElementById('menuTrigger');
  const menuClose = document.getElementById('menuClose');
  if (!menuOverlay || !menuTrigger || !menuClose) return;

  function openMenu() {
    menuOverlay.classList.add('open');
    menuOverlay.setAttribute('aria-hidden', 'false');
  }
  function closeMenu() {
    menuOverlay.classList.remove('open');
    menuOverlay.setAttribute('aria-hidden', 'true');
  }

  menuTrigger.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();

// ---- projects page: animated year callouts aligned with image tops ----
(function () {
  const section = document.querySelector('.projects-rulers');
  if (!section) return;

  const rulerLeft = section.querySelector('.ruler-left');
  const rows = Array.from(section.querySelectorAll('.project-row'));

  if (!rulerLeft || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const markers = [];

  /*
   * Создаём по одному маркеру на каждый проект.
   * Маркер является дочерним элементом вертикальной линейки,
   * поэтому он всегда прокручивается вместе с ней.
   */
  rows.forEach((row) => {
    const yearElement = row.querySelector('.project-year');
    const image = row.querySelector('.project-image');

    if (!yearElement || !image) return;

    const marker = document.createElement('div');
    const year = document.createElement('span');

    marker.className = 'year-marker';
    year.textContent = yearElement.textContent.trim();

    marker.appendChild(year);
    rulerLeft.appendChild(marker);

    markers.push({
      row,
      image,
      marker
    });
  });

  /*
   * Линия:
   * 1. начинается точно от вертикальной линейки;
   * 2. располагается на уровне верхней границы фотографии;
   * 3. заканчивается у правого края фотографии;
   * 4. год выводится CSS-ом ещё через 35px.
   */
  function layoutYearMarkers() {
    const rulerRect = rulerLeft.getBoundingClientRect();
  
    markers.forEach(({ row, image, marker }) => {
      const imageRect = image.getBoundingClientRect();
      const year = marker.querySelector('span');
  
      /*
       * Риски линейки нарисованы CSS-градиентом с шагом 60px,
       * поэтому притягиваем линию года к ближайшей риске.
       */
      const tick = 60;
      const markerY = Math.round((imageRect.top - rulerRect.top) / tick) * tick;
      const imageLeft = imageRect.left - rulerRect.left;
      const imageRight = imageRect.right - rulerRect.left;

      const isEven = row.matches(':nth-child(even)');

      marker.style.top = `${markerY}px`;
      marker.classList.toggle('is-even', isEven);
  
      if (isEven) {
        /*
         * Чётная строка:
         *
         * линейка ───── год  35px  фотография
         *
         * Линия НЕ проходит по фотографии.
         */
        const yearWidth = year.getBoundingClientRect().width;
  
        const gapBetweenLineAndYear = 12;
        const gapBetweenYearAndImage = 35;
  
        const lineWidth =
          imageLeft
          - gapBetweenYearAndImage
          - yearWidth
          - gapBetweenLineAndYear;
  
        marker.style.width =
          `${Math.max(0, Math.round(lineWidth))}px`;
      } else {
        /*
         * Нечётная строка:
         *
         * линейка ───── верх фотографии ───── 35px  год
         */
        marker.style.width =
          `${Math.max(0, Math.round(imageRight))}px`;
      }
    });
  
  }

  let layoutFrame = 0;

  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutYearMarkers);
  }

  /*
   * Запускаем анимацию, когда соответствующий проект
   * появляется в области просмотра.
   */
  if (
    reduced ||
    !('IntersectionObserver' in window)
  ) {
    markers.forEach(({ marker }) => {
      marker.classList.add('is-visible');
    });
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const item = markers.find(({ row }) => row === entry.target);

        if (item) {
          item.marker.classList.add('is-visible');
        }

        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.15
    });

    markers.forEach(({ row }) => {
      observer.observe(row);
    });
  }

  /*
   * Пересчитываем геометрию только при изменении размеров,
   * загрузке страницы, шрифтов или изображений.
   *
   * На scroll ничего пересчитывать не нужно:
   * маркеры уже находятся внутри вертикальной линейки.
   */
  scheduleLayout();

  addEventListener('resize', scheduleLayout);
  addEventListener('load', scheduleLayout, { once: true });

  markers.forEach(({ image }) => {
    const img = image.querySelector('img');

    if (img && !img.complete) {
      img.addEventListener('load', scheduleLayout, { once: true });
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleLayout);
  }
})();

// ---- contact form: AJAX submit with inline toast ----
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    const existing = form.querySelector('.form-toast');
    if (existing) existing.remove();

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' },
    })
      .then(function (r) {
        const toast = document.createElement('div');
        toast.className = 'form-toast' + (r.ok ? '' : ' error');
        toast.textContent = r.ok
          ? 'Votre demande a bien été envoyée. Nous vous recontacterons rapidement.'
          : 'Une erreur est survenue. Veuillez réessayer ou nous appeler directement.';
        form.appendChild(toast);
        if (r.ok) form.reset();
        btn.disabled = false;
        btn.textContent = old;
      })
      .catch(function () {
        const toast = document.createElement('div');
        toast.className = 'form-toast error';
        toast.textContent = 'Erreur de connexion. Veuillez réessayer ou nous appeler directement.';
        form.appendChild(toast);
        btn.disabled = false;
        btn.textContent = old;
      });
  });
})();

// ---- header on scroll: only the MENU trigger stays; over a light hero the
// ---- colors flip once past it, and the vertical mark turns graphite ----
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const hero = document.querySelector('.hero, .splash');
  const isLight = document.body.classList.contains('light-header');

  function updateHeader() {
    const threshold = hero ? hero.offsetHeight - 80 : 60;
    const past = window.scrollY > threshold;
    if (isLight) header.classList.toggle('scrolled', past);
    document.body.classList.toggle('scrolled', past);
  }
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
})();

// ---- cookie consent banner ----
(function () {
  if (localStorage.getItem('agape_cookie')) return;

  var lang = (document.documentElement.lang || 'fr').slice(0, 2);
  var t = {
    fr: {
      text: 'Ce site utilise uniquement des cookies essentiels au fonctionnement. ',
      link: 'En savoir plus',
      accept: 'Accepter',
      reject: 'Refuser',
      href: '/politique-de-confidentialite.html',
    },
    en: {
      text: 'This site uses only essential cookies. ',
      link: 'Learn more',
      accept: 'Accept',
      reject: 'Decline',
      href: '/politique-de-confidentialite.html',
    },
    ru: {
      text: 'Этот сайт использует только необходимые cookie. ',
      link: 'Подробнее',
      accept: 'Принять',
      reject: 'Отклонить',
      href: '/politique-de-confidentialite.html',
    },
  };
  var s = t[lang] || t.fr;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML =
    '<span>' + s.text + '<a href="' + s.href + '">' + s.link + '</a></span>' +
    '<div class="cookie-banner-btns">' +
    '<button class="cookie-accept">' + s.accept + '</button>' +
    '<button class="cookie-reject">' + s.reject + '</button>' +
    '</div>';

  document.body.appendChild(banner);

  banner.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    localStorage.setItem('agape_cookie', btn.classList.contains('cookie-accept') ? 'ok' : 'no');
    banner.remove();
  });
})();
