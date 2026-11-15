/* Neural Hours — landing interactions */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── откуда качать exe ──────────────────────────────────────────────
     Пусто → кнопки ведут на локальный файл `download/Neural-Hours.exe`
     (так работает локальный просмотр и хостинг «всё в одной папке»).

     Если бинарник лежит отдельно — например, в GitHub Releases — впиши
     сюда прямой адрес, и все кнопки переключатся на него:

       const DOWNLOAD_URL = 'https://github.com/USER/REPO/releases/latest/download/Neural-Hours.exe';

     Ссылка `releases/latest/download/...` всегда ведёт на ассет из
     последнего релиза, так что при обновлении версии её менять не нужно. */

  const DOWNLOAD_URL = '';

  if (DOWNLOAD_URL) {
    $$('a[href^="download/"]').forEach(a => {
      a.href = DOWNLOAD_URL;
      a.removeAttribute('download'); // чужой домен: имя файла задаёт сам хостинг
    });
  }

  /* ── появление при скролле ──────────────────────────────────────── */

  const revealEls = $$('.reveal');
  const heroReveals = revealEls.filter(el => el.closest('.hero'));

  if (reduce) {
    revealEls.forEach(el => el.classList.add('is-in'));
    $$('.steps').forEach(el => el.classList.add('is-in'));
  } else {
    // Hero показываем сразу: он всегда в первом экране и не должен ждать обсервера.
    heroReveals.forEach(el => {
      el.style.transitionDelay = Number(el.dataset.delay || 0) + 'ms';
      requestAnimationFrame(() => el.classList.add('is-in'));
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    revealEls
      .filter(el => !el.closest('.hero'))
      .forEach(el => io.observe(el));
  }

  // линия шагов
  const steps = $('.steps');
  if (steps) {
    const so = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { steps.classList.add('is-in'); so.disconnect(); }
    }, { threshold: 0.25 });
    so.observe(steps);
  }

  /* ── навигация: фон, прогресс, активный пункт ───────────────────── */

  const nav = $('#nav');
  const progress = $('#navProgress');
  const links = $$('.nav-links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      if (nav) nav.classList.toggle('is-scrolled', y > 12);
      if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      // активный раздел
      let current = null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= 140) current = s.id;
      }
      links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + current));

      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── мобильное меню ─────────────────────────────────────────────── */

  const burger = $('#burger');
  const mobile = $('#navMobile');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', mobile).forEach(a => a.addEventListener('click', () => {
      mobile.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ── счётчики в макете ──────────────────────────────────────────── */

  const counters = $$('#heroMock [data-count]');
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    if (reduce || target === 0) { el.textContent = String(target); return; }
    const dur = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  setTimeout(() => counters.forEach(animateCount), 520);

  /* ── таймер сессии в макете ─────────────────────────────────────── */

  const timer = $('#mockTimer');
  const pill = $('#mockPill');
  const pillText = $('#mockPillText');
  if (timer) {
    let secs = 12 * 60 + 47;
    const render = () => {
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      timer.textContent = `${h}:${m}:${s}`;
    };
    render();
    if (!reduce) {
      setInterval(() => { secs++; render(); }, 1000);

      // через 3.5 с «подключаемся»
      setTimeout(() => {
        if (!pill || !pillText) return;
        pill.classList.add('is-online');
        pillText.textContent = 'В СЕТИ';
      }, 3500);
    }
  }

  /* ── параллакс макета ───────────────────────────────────────────── */

  const visual = $('.hero-visual');
  const mock = $('#heroMock');
  if (visual && mock && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    visual.addEventListener('mousemove', (e) => {
      const r = visual.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });

    visual.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      mock.style.transform =
        `perspective(1200px) rotateY(${cx * 4.2}deg) rotateX(${-cy * 3.2}deg) translateZ(0)`;
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
  }

  /* ── подсветка карточек под курсором ───────────────────────────── */

  $$('[data-spotlight]').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ── QR-заглушка в карточке ────────────────────────────────────── */

  const qr = $('.qr-code');
  if (qr) {
    const N = 21;
    const inFinder = (x, y) => {
      const corners = [[0, 0], [N - 7, 0], [0, N - 7]];
      return corners.some(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
    };
    const finderOn = (x, y) => {
      const corners = [[0, 0], [N - 7, 0], [0, N - 7]];
      for (const [ox, oy] of corners) {
        if (x < ox || x >= ox + 7 || y < oy || y >= oy + 7) continue;
        const dx = x - ox, dy = y - oy;
        const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return ring || core;
      }
      return false;
    };

    let seed = 730;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

    const frag = document.createDocumentFragment();
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const s = document.createElement('span');
        const on = inFinder(x, y) ? finderOn(x, y) : rnd() > 0.52;
        if (on) s.className = 'on';
        frag.appendChild(s);
      }
    }
    qr.appendChild(frag);
  }

  /* ── переключатель тем ─────────────────────────────────────────── */

  const NOTES = {
    dark: '<b>Dark</b> — спокойный графит с синим акцентом. Режим по умолчанию: не бьёт по глазам ни днём, ни ночью.',
    light: '<b>Light</b> — светлая бумага с глубоким синим. Для тех, кто работает днём при ярком свете.',
    aurora: '<b>Aurora</b> — бирюза и фиолет на почти чёрном. Самый «дорогой» вариант, если хочется вау.'
  };

  const preview = $('#themePreview');
  const note = $('#themeNote');
  const themeBtns = $$('[data-theme-btn]');

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      themeBtns.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });

      if (preview) preview.dataset.mockTheme = theme;

      if (note) {
        note.classList.add('is-swapping');
        setTimeout(() => {
          note.innerHTML = NOTES[theme] || '';
          note.classList.remove('is-swapping');
        }, 180);
      }

      // заодно перекрашиваем большой макет в hero — приятный бонус
      const heroMock = $('#heroMock');
      if (heroMock) heroMock.dataset.mockTheme = theme;
    });
  });

  /* ── вкладки скриншотов ────────────────────────────────────────── */

  const LABELS = {
    dark: 'библиотека',
    aurora: 'настройки',
    light: 'светлая тема',
    qr: 'вход по QR'
  };

  const shots = $$('[data-shot-img]');
  const shotTabs = $$('[data-shot]');
  const shotLabel = $('#shotLabel');

  shotTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.shot;
      shotTabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      shots.forEach(img => img.classList.toggle('is-active', img.dataset.shotImg === key));
      if (shotLabel) shotLabel.textContent = LABELS[key] || '';
    });
  });

  /* ── FAQ: открыт только один ───────────────────────────────────── */

  const faqs = $$('.faq-item');
  faqs.forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqs.forEach(other => { if (other !== item) other.open = false; });
    });
  });

  /* ── копирование хеша ──────────────────────────────────────────── */

  const copyBtn = $('#hashCopy');
  const copyText = $('#hashCopyText');
  const hashValue = $('#hashValue');

  if (copyBtn && hashValue) {
    copyBtn.addEventListener('click', async () => {
      const text = hashValue.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      copyBtn.classList.add('is-done');
      if (copyText) copyText.textContent = 'Скопировано';
      setTimeout(() => {
        copyBtn.classList.remove('is-done');
        if (copyText) copyText.textContent = 'Скопировать';
      }, 2200);
    });
  }

  /* ── магнитные кнопки ──────────────────────────────────────────── */

  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${x * 5}px, ${y * 4 - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── лёгкий параллакс фона при скролле ─────────────────────────── */

  if (!reduce) {
    const aurora = $('.bg-aurora');
    if (aurora) {
      let p = false;
      window.addEventListener('scroll', () => {
        if (p) return;
        p = true;
        requestAnimationFrame(() => {
          aurora.style.transform = `translateY(${window.scrollY * 0.06}px)`;
          p = false;
        });
      }, { passive: true });
    }
  }

})();
