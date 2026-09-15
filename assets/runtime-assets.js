(() => {
  const cfg = window.GAME_ASSETS || {};
  const audioCache = new Map();

  function getAudio(path) {
    if (!path) return null;
    if (!audioCache.has(path)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache.set(path, audio);
    }
    return audioCache.get(path);
  }

  function playSound(path, volume = 0.55) {
    try {
      const base = getAudio(path);
      if (!base) return;
      const audio = base.cloneNode();
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch (_) {}
  }

  function detectEffectType(text = '') {
    const t = text.toLowerCase();
    const pairs = [
      ['출혈', 'bleed'], ['bleed', 'bleed'],
      ['맹독', 'poison'], ['중독', 'poison'], ['poison', 'poison'],
      ['빙결', 'freeze'], ['동결', 'freeze'], ['freeze', 'freeze'],
      ['탄환', 'bullet'], ['총', 'bullet'], ['bullet', 'bullet'],
      ['정신', 'mental'], ['mental', 'mental'],
      ['광휘', 'radiance'], ['광채', 'radiance'], ['radiance', 'radiance'],
      ['물결', 'wave'], ['파도', 'wave'], ['wave', 'wave'],
      ['새싹', 'tree'], ['나무', 'tree'], ['tree', 'tree']
    ];
    return pairs.find(([key]) => t.includes(key))?.[1] || null;
  }

  const TYPE_META = {
    bleed:    { particles: 9, streaks: 4, shake: 5 },
    poison:   { particles: 12, streaks: 0, shake: 2 },
    freeze:   { particles: 11, streaks: 6, shake: 4 },
    bullet:   { particles: 6, streaks: 3, shake: 6 },
    mental:   { particles: 8, streaks: 2, shake: 3 },
    radiance: { particles: 12, streaks: 8, shake: 4 },
    wave:     { particles: 8, streaks: 3, shake: 3 },
    tree:     { particles: 10, streaks: 2, shake: 3 }
  };

  function makeLayer(className, parent) {
    const el = document.createElement('span');
    el.className = className;
    parent.appendChild(el);
    return el;
  }

  function addParticles(root, amount) {
    for (let i = 0; i < amount; i++) {
      const p = makeLayer('vfx-particle', root);
      const angle = (Math.PI * 2 * i / amount) + (Math.random() - 0.5) * 0.55;
      const distance = 48 + Math.random() * 92;
      p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      p.style.setProperty('--delay', `${Math.random() * 80}ms`);
      p.style.setProperty('--scale', `${0.55 + Math.random() * 1.15}`);
      p.style.setProperty('--rot', `${Math.random() * 240 - 120}deg`);
    }
  }

  function addStreaks(root, amount) {
    for (let i = 0; i < amount; i++) {
      const s = makeLayer('vfx-streak', root);
      s.style.setProperty('--angle', `${(360 / Math.max(1, amount)) * i + (Math.random() * 34 - 17)}deg`);
      s.style.setProperty('--length', `${70 + Math.random() * 95}px`);
      s.style.setProperty('--delay', `${Math.random() * 70}ms`);
    }
  }

  function shakeTarget(target, strength = 3) {
    if (!target?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    target.animate([
      { transform: 'translate(0,0)' },
      { transform: `translate(${-strength}px,${Math.max(1, strength * .35)}px)` },
      { transform: `translate(${strength}px,${-Math.max(1, strength * .25)}px)` },
      { transform: `translate(${-strength * .45}px,0)` },
      { transform: 'translate(0,0)' }
    ], { duration: 145, easing: 'steps(4,end)' });
  }

  function showVfx(type, target) {
    if (!target || !TYPE_META[type]) return;
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width * (0.46 + Math.random() * 0.08);
    const y = rect.top + rect.height * (0.42 + Math.random() * 0.12);
    const meta = TYPE_META[type];

    const root = document.createElement('div');
    root.className = `combat-vfx combat-vfx-${type}`;
    root.setAttribute('aria-hidden', 'true');
    root.style.left = `${x}px`;
    root.style.top = `${y}px`;

    makeLayer('vfx-core', root);
    makeLayer('vfx-ring vfx-ring-a', root);
    makeLayer('vfx-ring vfx-ring-b', root);
    makeLayer('vfx-bloom', root);
    addStreaks(root, meta.streaks);
    addParticles(root, meta.particles);

    const src = cfg.vfx?.[type];
    if (src) {
      const texture = document.createElement('img');
      texture.className = 'vfx-texture';
      texture.src = src;
      texture.alt = '';
      root.appendChild(texture);
    }

    document.body.appendChild(root);
    shakeTarget(target, meta.shake);

    root.addEventListener('animationend', (event) => {
      if (event.target === root) root.remove();
    });
    setTimeout(() => root.remove(), 1200);
  }

  function applyBattleBackground() {
    const path = cfg.backgrounds?.battle;
    if (!path) return;
    const image = new Image();
    const busted = `${path}${path.includes('?') ? '&' : '?'}v=${Date.now()}`;
    image.onload = () => document.documentElement.style.setProperty('--battle-background-image', `url("${busted}")`);
    image.src = busted;
  }

  function ensureBattleEnvironment() {
    if (!document.body.classList.contains('battle-mode')) return;
    const host = document.querySelector('#battleScreen') || document.querySelector('.app');
    if (!host || host.querySelector(':scope > .archive-battle-environment')) return;

    const scene = document.createElement('div');
    scene.className = 'archive-battle-environment';
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML = `
      <div class="archive-sky-glow"></div>
      <div class="archive-back-ruins archive-back-ruins-left"></div>
      <div class="archive-back-ruins archive-back-ruins-right"></div>
      <div class="archive-mid-arch"></div>
      <div class="archive-ground-plane"></div>
      <div class="archive-ground-rim"></div>
      <div class="archive-ember-field"></div>
      <div class="archive-front-vignette"></div>`;
    host.prepend(scene);
  }

  const glyphForSkill = (button) => {
    if (button.classList.contains('ult')) return '✦';
    return button.dataset.skill === '0' ? '◇' : '◆';
  };

  function decorateSkillButtons() {
    const panel = document.querySelector('#skillPanel,.skill-panel');
    if (!panel) return;

    panel.querySelectorAll('.skill').forEach((button) => {
      if (button.querySelector(':scope > .skill-icon')) return;
      const icon = document.createElement('span');
      icon.className = 'skill-icon';
      icon.textContent = glyphForSkill(button);
      const key = document.createElement('span');
      key.className = 'skill-keycap';
      key.textContent = button.dataset.key || '';
      button.append(icon, key);
    });

    panel.querySelectorAll('.passive-button').forEach((button) => {
      if (button.querySelector(':scope > .skill-icon')) return;
      const icon = document.createElement('span');
      icon.className = 'skill-icon passive-glyph';
      icon.textContent = 'P';
      button.append(icon);
    });
  }

  function syncBattlePresentation() {
    ensureBattleEnvironment();
    decorateSkillButtons();
  }

  let syncQueued = false;
  const queueSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      syncBattlePresentation();
    });
  };

  const observer = new MutationObserver(queueSync);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  document.addEventListener('click', (event) => {
    const control = event.target.closest('button,.btn,.deck-card,.boss-choice,.mode-option');
    if (control) playSound(cfg.audio?.uiClick, 0.32);

    const skill = event.target.closest('.skill');
    if (!skill || skill.disabled) return;
    const type = detectEffectType(skill.textContent || '');
    if (!type) return;
    const target = document.querySelector('#bossCard, .boss-card, .boss-panel') || document.body;
    requestAnimationFrame(() => showVfx(type, target));
  }, true);

  window.GameAssets = {
    config: cfg,
    playSound,
    showVfx,
    detectEffectType,
    syncBattlePresentation,
    characterPath(id, ext = 'webp') { return `${cfg.characters?.base || './assets/images/characters/'}${id}.${ext}`; },
    bossPath(id, ext = 'webp') { return `${cfg.bosses?.base || './assets/images/bosses/'}${id}.${ext}`; }
  };

  applyBattleBackground();
  queueSync();
})();