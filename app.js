(() => {
  'use strict';
  const story = window.LOVE_STORY;
  const $ = (selector) => document.querySelector(selector);
  const chapters = [
    { name: 'The strawberry picnic', short: 'Something sweet', caption: 'The sweetest things are the little things about you.', main: 'berry', extra: 'sushi', label: 'A blanket, some berries, and you.' },
    { name: 'The little bookshop', short: 'Between the pages', caption: 'I would find you in every story.', main: 'books', extra: 'openbook', label: 'Six more pages of my favorite story.' },
    { name: 'My Melody’s garden', short: 'A softer kind of magic', caption: 'A soft little corner of the world, just for us.', main: 'melody', extra: 'berry', label: 'Where being ourselves feels like home.' },
    { name: 'Our sushi date', short: 'A table for two', caption: 'Whatever we’re doing, my favorite part is you.', main: 'sushi', extra: 'berry', label: 'Good food. Better company. You.' },
    { name: 'Under the same stars', short: 'A little forever', caption: 'Every little reason leads me back to you.', main: 'moon', extra: 'openbook', label: 'The last stop. The beginning of so much more.' }
  ];
  const storageKey = 'clementine-first-chapter-v1';
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
  const valid = n => Number.isInteger(n) && n >= 0 && n < 30;
  const read = new Set(Array.isArray(stored.read) ? stored.read.filter(valid) : []);
  const hearts = new Set(Array.isArray(stored.hearts) ? stored.hearts.filter(valid) : []);
  let current = valid(stored.current) ? stored.current : 0;
  let activeView = 'landing';
  let touchStart = null;
  let lastModalTrigger = null;
  let tripArmed = false;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ current, read: [...read], hearts: [...hearts] })); } catch {}
  }
  function icon(name, css = '') {
    return `<svg class="${css}" aria-hidden="true"><use href="#${name}"/></svg>`;
  }
  function paragraphs(container, text) {
    container.replaceChildren();
    const parts = Array.isArray(text) ? text : text.split('\n\n');
    parts.forEach(t => { const p = document.createElement('p'); p.textContent = t; container.append(p); });
  }
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
  function show(view, focus = true) {
    closeDialogs();
    activeView = view;
    if (view === 'prologue' || view === 'landing') resetTripConfirmation();
    document.querySelectorAll('.view').forEach(el => { el.hidden = el.id !== view; });
    document.body.dataset.world = view === 'journey' ? Math.floor(current / 6) : '';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) requestAnimationFrame(() => {
      const heading = $(`#${view} h1`);
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    });
  }
  function renderReason(index) {
    if (!valid(index)) return;
    current = index;
    read.add(current);
    save();
    const chapterIndex = Math.floor(current / 6);
    const chapter = chapters[chapterIndex];
    const reason = story.reasons[current];
    $('#journey-chapter').textContent = `CHAPTER ${String(chapterIndex + 1).padStart(2,'0')} · ${chapter.short.toUpperCase()}`;
    $('#page-count').textContent = `${String(current + 1).padStart(2,'0')} / 30`;
    $('#destination-index').textContent = `Stop ${chapterIndex + 1} of 5`;
    $('#destination-title').textContent = chapter.name;
    $('#destination-caption').textContent = chapter.caption;
    $('#destination-scene').className = 'destination-scene' + (chapter.main === 'melody' ? ' scene-melody' : '');
    $('#destination-scene').innerHTML = icon(chapter.main, 'scene-main') + icon(chapter.extra, 'scene-secondary') + icon('heart', 'scene-heart') + icon('spark', 'scene-spark') + '<span class="scene-daisy">✿</span>';
    $('#reason-number').textContent = `REASON NO. ${String(current + 1).padStart(2,'0')}`;
    $('#reason-title').textContent = reason.title;
    paragraphs($('#reason-text'), reason.text);
    $('#next').innerHTML = (current === 29 ? 'One last thing, baby' : (current + 1) % 6 === 0 ? 'On to our next stop' : 'Next little reason') + icon('arrow');
    $('#previous').innerHTML = icon('arrow') + (current === 0 ? 'The beginning' : 'Previous');
    $('#progress-caption').textContent = `${read.size} of 30 little reasons discovered`;
    $('#progress-fill').style.width = `${read.size / 30 * 100}%`;
    $('.progress-track').setAttribute('aria-valuenow', read.size);
    updateHeart();
    show('journey');
    const paper = $('#reason-paper');
    paper.classList.remove('reason-enter');
    requestAnimationFrame(() => paper.classList.add('reason-enter'));
  }
  function updateHeart() {
    const kept = hearts.has(current);
    $('#keep-heart').setAttribute('aria-pressed', String(kept));
    $('#keep-heart span').textContent = kept ? 'Heart tucked away' : 'Keep this heart';
  }
  function burst(count = 32) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = $('#confetti');
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = i % 4 === 0 ? '✿' : i % 3 === 0 ? '✦' : '♥';
      piece.style.setProperty('--left', `${Math.random() * 100}%`);
      piece.style.setProperty('--size', `${11 + Math.random() * 20}px`);
      piece.style.setProperty('--delay', `${Math.random() * .7}s`);
      piece.style.setProperty('--duration', `${2.8 + Math.random() * 2}s`);
      piece.style.setProperty('--drift', `${Math.random() * 200 - 100}px`);
      piece.style.setProperty('--rotation', `${Math.random() * 480 - 240}deg`);
      piece.style.color = ['#b85170','#d699a5','#c5a85f','#90a68a'][i % 4];
      container.append(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }
  function finale() { show('finale'); burst(38); }
  function buildMap() {
    $('#map-chapters').replaceChildren();
    chapters.forEach((chapter, i) => {
      const row = document.createElement('section'); row.className = 'map-chapter';
      row.innerHTML = icon(chapter.main) + '<div class="map-title"><h3></h3><small></small></div><div class="map-numbers"></div>';
      row.querySelector('h3').textContent = chapter.name;
      row.querySelector('small').textContent = `CHAPTER ${String(i + 1).padStart(2, '0')} · REASONS ${i * 6 + 1}–${i * 6 + 6}`;
      for (let j = 0; j < 6; j++) {
        const n = i * 6 + j;
        const btn = document.createElement('button');
        btn.className = 'map-number' + (read.has(n) ? ' visited' : '') + (hearts.has(n) ? ' saved' : '') + (n === current && activeView === 'journey' ? ' current' : '');
        btn.textContent = String(n + 1).padStart(2, '0');
        btn.setAttribute('aria-label', `Reason ${n + 1}: ${story.reasons[n].title}${hearts.has(n) ? ', heart saved' : ''}`);
        if (n === current && activeView === 'journey') btn.setAttribute('aria-current', 'step');
        btn.addEventListener('click', () => renderReason(n));
        row.querySelector('.map-numbers').append(btn);
      }
      $('#map-chapters').append(row);
    });
    $('#hearts-count').textContent = `♡ ${hearts.size} ${hearts.size === 1 ? 'heart' : 'hearts'} tucked away · ${read.size}/30 discovered`;
  }
  function openDialog(id) {
    lastModalTrigger = document.activeElement;
    if (id === 'map-dialog') buildMap();
    const dialog = $(`#${id}`);
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  function buildLetter() {
    const container = $('#full-letter');
    paragraphs(container, story.intro);
    story.reasons.forEach((reason, i) => {
      const section = document.createElement('section'); section.className = 'full-reason';
      const heading = document.createElement('h3'); heading.className = 'full-reason-title'; heading.textContent = `${String(i + 1).padStart(2, '0')}. ${reason.title}`;
      const body = document.createElement('div'); paragraphs(body, reason.text);
      section.append(heading, body); container.append(section);
    });
    const end = document.createElement('p'); end.textContent = story.ending; end.style.marginTop = '30px'; container.append(end);
  }
  function resetTripConfirmation() {
    tripArmed = false;
    $('#trip-button-label').textContent = 'Let’s begin our little trip';
    $('#trip-confirmation').textContent = 'Thirty reasons, just for you.';
    $('#start-trip').classList.remove('trip-is-ready');
  }
  function startTrip() {
    if (!tripArmed) {
      tripArmed = true;
      $('#trip-button-label').textContent = 'Are you sure, baby? ♡';
      $('#trip-confirmation').textContent = 'One more tap, and I’ll show you how loved you are.';
      $('#start-trip').classList.add('trip-is-ready');
      $('#announcement').textContent = 'Are you sure, baby? Tap the button once more to begin our little trip.';
      return;
    }
    renderReason(0);
  }
  const actions = {
    home: () => show('landing'),
    begin: () => show('prologue'),
    start: startTrip,
    letter: () => openDialog('letter-dialog'),
    map: () => openDialog('map-dialog'),
    finale,
    celebrate: () => { burst(55); $('#hug-message').textContent = 'Consider yourself held a little closer. I love you. ♡'; }
  };
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]');
    if (action && actions[action.dataset.action]) actions[action.dataset.action]();
  });
  $('#next').addEventListener('click', () => current < 29 ? renderReason(current + 1) : finale());
  $('#previous').addEventListener('click', () => current > 0 ? renderReason(current - 1) : show('prologue'));
  $('#keep-heart').addEventListener('click', () => {
    if (hearts.has(current)) hearts.delete(current); else { hearts.add(current); burst(8); }
    save(); updateHeart();
    $('#announcement').textContent = hearts.has(current) ? 'This heart is tucked away in your map.' : 'Heart removed from your collection.';
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (lastModalTrigger && !lastModalTrigger.closest('[hidden]')) lastModalTrigger.focus({ preventScroll: true });
    });
  });
  document.addEventListener('keydown', event => {
    if (activeView !== 'journey' || $('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); $('#next').click(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); $('#previous').click(); }
  });
  $('#reason-paper').addEventListener('touchstart', event => { touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
  $('#reason-paper').addEventListener('touchend', event => {
    if (!touchStart || event.target.closest('button')) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.7) (dx < 0 ? $('#next') : $('#previous')).click();
    touchStart = null;
  }, { passive: true });
  paragraphs($('#intro-text'), story.intro);
  $('#closing-text').textContent = story.ending;
  buildLetter();
  save();
})();
