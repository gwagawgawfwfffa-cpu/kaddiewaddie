(() => {
  'use strict';
  const config = window.ANNIVERSARY_MUSIC || {};
  const tracks = (Array.isArray(config.tracks) ? config.tracks : []).filter(track => {
    try { return track && typeof track.url === 'string' && ['http:', 'https:'].includes(new URL(track.url).protocol); } catch { return false; }
  });
  // Music is optional; an empty playlist never interrupts the love story.
  if (!tracks.length) return;
  const player = document.querySelector('#music-player');
  const audio = document.querySelector('#background-music');
  if (!player || !audio) return;
  const toggle = document.querySelector('#music-toggle');
  const toggleIcon = document.querySelector('#music-toggle-icon');
  const next = document.querySelector('#music-next');
  const title = document.querySelector('#music-track-title');
  const status = document.querySelector('#music-status');
  const volume = document.querySelector('#music-volume');
  let index = 0;
  let wantsMusic = true;
  let needsGesture = true;
  let requestId = 0;
  let pending = false;
  let interactionPlayPending = false;
  let available = true;

  player.hidden = false;
  document.body.classList.add('has-music-player');
  audio.volume = Number.isFinite(config.volume) ? Math.min(1, Math.max(0, config.volume)) : 0.35;
  volume.value = String(audio.volume);
  next.hidden = tracks.length < 2;

  function update(playing, message) {
    toggleIcon.textContent = playing ? 'Ⅱ' : '▶';
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    status.textContent = message;
  }
  function selectTrack(number) {
    requestId++;
    pending = false;
    interactionPlayPending = false;
    available = true;
    index = (number + tracks.length) % tracks.length;
    title.textContent = tracks[index].title || `Our song ${index + 1}`;
    title.title = title.textContent;
    audio.src = tracks[index].url;
    audio.load();
    update(false, 'Ready to play');
  }
  async function play(fromInteraction = false) {
    // A real tap can supersede an unresolved page-load autoplay attempt.
    if (!wantsMusic || (pending && (!fromInteraction || interactionPlayPending))) return;
    const request = ++requestId;
    pending = true;
    interactionPlayPending = fromInteraction;
    update(false, 'Starting music…');
    try {
      await audio.play();
      if (request !== requestId) return;
      needsGesture = false;
      available = true;
      update(true, `Playing · ${index + 1} / ${tracks.length}`);
    } catch (error) {
      if (request !== requestId) return;
      if (error.name === 'NotAllowedError') {
        needsGesture = true;
        update(false, 'Tap to play');
      } else if (error.name !== 'AbortError') {
        needsGesture = false;
        available = false;
        update(false, 'Song unavailable · tap to retry');
      }
    } finally {
      if (request === requestId) { pending = false; interactionPlayPending = false; }
    }
  }
  toggle.addEventListener('click', () => {
    if (!audio.paused || pending) {
      wantsMusic = false;
      needsGesture = false;
      requestId++;
      pending = false;
      interactionPlayPending = false;
      audio.pause();
      update(false, 'Paused');
    } else {
      wantsMusic = true;
      if (!available) selectTrack(index);
      play(true);
    }
  });
  next.addEventListener('click', () => {
    wantsMusic = true;
    selectTrack(index + 1);
    play(true);
  });
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  audio.addEventListener('ended', () => {
    if (!wantsMusic) return;
    selectTrack(index + 1);
    play();
  });
  audio.addEventListener('error', () => {
    requestId++;
    pending = false;
    interactionPlayPending = false;
    available = false;
    needsGesture = false;
    audio.pause();
    update(false, 'Song unavailable · tap to retry');
  });
  function startAfterInteraction(event) {
    if (!wantsMusic || !needsGesture || event.target.closest?.('#music-player')) return;
    if (event.type === 'keydown' && (!['Enter', ' '].includes(event.key) || event.ctrlKey || event.altKey || event.metaKey)) return;
    // Keep play() synchronous with touch/click for iPhone and Android policies.
    play(true);
  }
  document.addEventListener('pointerup', startAfterInteraction, { capture: true, passive: true });
  document.addEventListener('touchend', startAfterInteraction, { capture: true, passive: true });
  document.addEventListener('click', startAfterInteraction, { capture: true });
  document.addEventListener('keydown', startAfterInteraction, { capture: true });
  selectTrack(0);
  // Try immediately; browsers that block sound will retry on the first click.
  play();
})();
