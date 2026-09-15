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

  function showVfx(type, target) {
    const src = cfg.vfx?.[type];
    if (!src || !target) return;
    const host = target.getBoundingClientRect ? target : document.body;
    const rect = host.getBoundingClientRect();
    const fx = document.createElement('img');
    fx.className = `external-vfx external-vfx-${type}`;
    fx.src = src;
    fx.alt = '';
    fx.setAttribute('aria-hidden', 'true');
    fx.style.left = `${rect.left + rect.width / 2}px`;
    fx.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(fx);
    fx.addEventListener('animationend', () => fx.remove(), { once: true });
    setTimeout(() => fx.remove(), 1100);
  }

  function applyBattleBackground() {
    const path = cfg.backgrounds?.battle;
    if (!path) return;
    const image = new Image();
    image.onload = () => document.documentElement.style.setProperty('--battle-background-image', `url("${path}")`);
    image.src = path;
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('button,.btn,.deck-card,.boss-choice,.mode-option');
    if (control) playSound(cfg.audio?.uiClick, 0.32);

    const skill = event.target.closest('.skill');
    if (!skill || skill.disabled) return;
    const type = detectEffectType(skill.textContent || '');
    if (!type) return; // no generic flash/slash fallback
    const target = document.querySelector('.boss-panel, #bossCard, .boss-card') || document.body;
    requestAnimationFrame(() => showVfx(type, target));
  }, true);

  window.GameAssets = {
    config: cfg,
    playSound,
    showVfx,
    detectEffectType,
    characterPath(id, ext = 'webp') { return `${cfg.characters?.base || './assets/images/characters/'}${id}.${ext}`; },
    bossPath(id, ext = 'webp') { return `${cfg.bosses?.base || './assets/images/bosses/'}${id}.${ext}`; }
  };

  applyBattleBackground();
})();
