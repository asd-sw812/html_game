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

  const BOSS_BY_INDEX = {
    '01': 'warden',
    '02': 'devourer',
    '03': 'observer'
  };

  function bossIdFromFigure(figure) {
    const index = String(figure?.dataset?.initial || '01').padStart(2, '0');
    return BOSS_BY_INDEX[index] || 'warden';
  }

  function bossSvg(id) {
    if (id === 'devourer') {
      return `
      <svg viewBox="0 0 560 520" role="img" aria-label="포식형 보스 전투 실루엣">
        <defs>
          <linearGradient id="dvBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#18080b"/><stop offset=".48" stop-color="#6d1d20"/><stop offset="1" stop-color="#14090d"/></linearGradient>
          <radialGradient id="dvCore"><stop stop-color="#ffd3a0"/><stop offset=".22" stop-color="#ff6d4a"/><stop offset=".62" stop-color="#9c1f25"/><stop offset="1" stop-color="#24080d"/></radialGradient>
          <filter id="dvGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g opacity=".35" fill="none" stroke="#ff7359"><ellipse cx="286" cy="302" rx="215" ry="130"/><ellipse cx="286" cy="302" rx="180" ry="98" stroke-dasharray="6 18"/></g>
        <g class="boss-model-float">
          <path d="M83 315 26 211l92 36 43-102 72 91-59 66Z" fill="#250b10" stroke="#7d2a30" stroke-width="4"/>
          <path d="m477 315 57-104-92 36-43-102-72 91 59 66Z" fill="#250b10" stroke="#7d2a30" stroke-width="4"/>
          <path d="M112 330c18-121 83-190 174-190 94 0 164 69 179 190l-54 111-85-45-40 70-42-70-92 45Z" fill="url(#dvBody)" stroke="#b63c39" stroke-width="5"/>
          <path d="M166 248c35-52 75-77 120-77 47 0 92 27 127 82-40-17-79-25-122-25-45 0-83 7-125 20Z" fill="#10080b"/>
          <path d="M160 305c49-56 87-73 129-73 45 0 84 18 132 76-41 54-82 79-133 79-49 0-87-23-128-82Z" fill="#080607" stroke="#cf4b42" stroke-width="5"/>
          <ellipse cx="290" cy="308" rx="72" ry="48" fill="url(#dvCore)" opacity=".92" filter="url(#dvGlow)"/>
          <path d="M184 278 220 300l-41 16M396 278 360 300l41 16M210 344l28-25 23 34M367 344l-29-25-22 34" fill="#f6d8bd" opacity=".82"/>
          <path d="M145 374 92 474h80l49-93M430 374l55 100h-81l-49-93" fill="#270b10" stroke="#7e252b" stroke-width="4"/>
          <path d="M237 430 210 502h57l18-52 20 52h57l-30-74" fill="#16090c" stroke="#722128" stroke-width="4"/>
        </g>
      </svg>`;
    }

    if (id === 'observer') {
      return `
      <svg viewBox="0 0 520 560" role="img" aria-label="관측형 보스 전투 실루엣">
        <defs>
          <radialGradient id="obCore"><stop stop-color="#fff4ce"/><stop offset=".18" stop-color="#ddbf82"/><stop offset=".5" stop-color="#7565b0"/><stop offset="1" stop-color="#171327"/></radialGradient>
          <linearGradient id="obWing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#241d46"/><stop offset=".52" stop-color="#6d5a9c"/><stop offset="1" stop-color="#171226"/></linearGradient>
          <filter id="obGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g fill="none" stroke="#d8c78f" opacity=".42" class="observer-orbit"><ellipse cx="260" cy="258" rx="205" ry="86" transform="rotate(-24 260 258)"/><ellipse cx="260" cy="258" rx="185" ry="72" transform="rotate(43 260 258)" stroke-dasharray="7 17"/><circle cx="260" cy="258" r="150" opacity=".38"/></g>
        <g class="boss-model-float">
          <path d="M260 62 286 129 356 104 330 171 403 181 346 227 408 269 334 280 355 351 289 322 260 392 231 322 165 351 186 280 112 269 174 227 117 181 190 171 164 104 234 129Z" fill="url(#obWing)" stroke="#8c79bd" stroke-width="4" opacity=".9"/>
          <circle cx="260" cy="238" r="116" fill="#171226" stroke="#b9a7d9" stroke-width="5"/>
          <ellipse cx="260" cy="238" rx="93" ry="58" fill="#0b0911" stroke="#d4c79c" stroke-width="4"/>
          <ellipse cx="260" cy="238" rx="58" ry="58" fill="url(#obCore)" filter="url(#obGlow)"/>
          <ellipse cx="260" cy="238" rx="19" ry="45" fill="#130d1e"/><circle cx="250" cy="220" r="8" fill="#fff7de" opacity=".85"/>
          <path d="M205 344 155 492l105-61 105 61-50-148-55 48Z" fill="url(#obWing)" stroke="#725f9e" stroke-width="4"/>
          <g fill="#d7c78d" opacity=".72"><circle cx="98" cy="200" r="8"/><circle cx="425" cy="315" r="7"/><circle cx="405" cy="140" r="5"/></g>
        </g>
      </svg>`;
    }

    return `
    <svg viewBox="0 0 480 580" role="img" aria-label="수호형 보스 전투 실루엣">
      <defs>
        <linearGradient id="wdArmor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b1a24"/><stop offset=".5" stop-color="#2a5667"/><stop offset="1" stop-color="#111521"/></linearGradient>
        <linearGradient id="wdGold"><stop stop-color="#f3ddb0"/><stop offset=".45" stop-color="#c8a869"/><stop offset="1" stop-color="#705734"/></linearGradient>
        <radialGradient id="wdCore"><stop stop-color="#f8f0ce"/><stop offset=".24" stop-color="#9ce6ef"/><stop offset=".7" stop-color="#2f7587"/><stop offset="1" stop-color="#102a36"/></radialGradient>
        <filter id="wdGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g fill="none" stroke="#9edce5" opacity=".34"><circle cx="248" cy="215" r="154"/><circle cx="248" cy="215" r="137" stroke-dasharray="4 15"/><path d="M248 61 381 292H115ZM120 148h256L248 369Z" opacity=".55"/></g>
      <g class="boss-model-float">
        <path d="M248 58 280 112 269 162h-42l-12-50Z" fill="url(#wdGold)" stroke="#efdba8" stroke-width="3"/>
        <path d="M205 159 248 127 292 159 311 246 284 338l-36 46-37-46-27-92Z" fill="url(#wdArmor)" stroke="#79b8c5" stroke-width="5"/>
        <path d="M182 183 102 232l19 162 77-47 24-116Z" fill="#112834" stroke="#5c93a0" stroke-width="4"/>
        <path d="M314 183 395 232l-20 162-76-47-25-116Z" fill="#112834" stroke="#5c93a0" stroke-width="4"/>
        <path d="M131 221 61 246 94 430l92-54 18-132Z" fill="#0c1b24" stroke="url(#wdGold)" stroke-width="6"/>
        <path d="M363 197 408 92l17 8-29 126 20 231-25 2-30-227Z" fill="url(#wdGold)" opacity=".9"/>
        <circle cx="248" cy="226" r="42" fill="url(#wdCore)" filter="url(#wdGlow)"/>
        <path d="M218 352 181 520h57l12-101 16 101h58l-45-168Z" fill="#0d1820" stroke="#446e78" stroke-width="4"/>
        <path d="M204 151 169 116 134 130l39 67M292 151l35-35 35 14-39 67" fill="none" stroke="url(#wdGold)" stroke-width="8"/>
      </g>
    </svg>`;
  }

  function commandSvg(kind) {
    if (kind === 'ult') return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 39 23 58 26 43 38 47 57 32 47 17 57 21 38 6 26 25 23Z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="8" fill="currentColor" opacity=".22"/><circle cx="32" cy="32" r="3" fill="currentColor"/></svg>`;
    if (kind === 'skill2') return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 18 32 8l16 10-16 10Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 31 32 19l20 12-20 12Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="3"/><path d="m18 46 14-8 14 8-14 10Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
    if (kind === 'passive') return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 17v30M22 23h15c9 0 9 13 0 13H22" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 8v14M32 42v14M8 32h14M42 32h14" stroke="currentColor" stroke-width="3"/><path d="m24 39 8-17 8 17-8-5Z" fill="currentColor" opacity=".28" stroke="currentColor" stroke-width="2"/></svg>`;
  }

  function syncBossPresentation() {
    const figure = document.querySelector('.boss-figure');
    if (!figure) return;
    const id = bossIdFromFigure(figure);
    document.body.dataset.archiveBoss = id;
    if (figure.dataset.archiveBoss === id && figure.querySelector(':scope > .archive-boss-model')) return;
    figure.dataset.archiveBoss = id;
    figure.classList.add('archive-boss-mounted');
    figure.querySelectorAll(':scope > .archive-boss-model').forEach((node) => node.remove());
    if (figure.querySelector(':scope > img')) return;
    const art = document.createElement('div');
    art.className = 'archive-boss-model';
    art.innerHTML = bossSvg(id);
    figure.prepend(art);
  }

  function decorateSkillButtons() {
    const panel = document.querySelector('#skillPanel,.skill-panel');
    if (!panel) return;
    panel.querySelectorAll('.skill').forEach((button) => {
      const kind = button.classList.contains('ult') ? 'ult' : button.dataset.skill === '1' ? 'skill2' : 'skill1';
      button.dataset.archiveCommand = kind;
      if (!button.querySelector(':scope > .archive-command-icon')) {
        const icon = document.createElement('span');
        icon.className = 'archive-command-icon';
        icon.innerHTML = commandSvg(kind);
        button.appendChild(icon);
      }
      if (!button.querySelector(':scope > .archive-keycap')) {
        const key = document.createElement('span');
        key.className = 'archive-keycap';
        key.textContent = button.dataset.key || '';
        button.appendChild(key);
      }
      if (!button.querySelector(':scope > .archive-command-name')) {
        const name = document.createElement('span');
        name.className = 'archive-command-name';
        name.textContent = kind === 'ult' ? 'ULT' : kind === 'skill2' ? 'SKILL 2' : 'SKILL 1';
        button.appendChild(name);
      }
    });
    panel.querySelectorAll('.passive-button').forEach((button) => {
      button.dataset.archiveCommand = 'passive';
      if (!button.querySelector(':scope > .archive-command-icon')) {
        const icon = document.createElement('span');
        icon.className = 'archive-command-icon';
        icon.innerHTML = commandSvg('passive');
        button.appendChild(icon);
      }
      if (!button.querySelector(':scope > .archive-command-name')) {
        const name = document.createElement('span');
        name.className = 'archive-command-name';
        name.textContent = 'PASSIVE';
        button.appendChild(name);
      }
    });
  }

  function syncBattlePresentation() {
    document.querySelectorAll('.archive-battle-environment').forEach((node) => node.remove());
    if (!document.body.classList.contains('battle-mode')) return;
    syncBossPresentation();
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
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-initial'] });

  document.addEventListener('click', (event) => {
    const control = event.target.closest('button,.btn,.deck-card,.boss-choice,.mode-option');
    if (control) playSound(cfg.audio?.uiClick, 0.32);
    const skill = event.target.closest('.skill');
    if (!skill || skill.disabled) return;
    const type = detectEffectType(skill.textContent || '');
    if (!type) return;
    const target = document.querySelector('.boss-figure') || document.querySelector('#bossCard,.boss-card,.boss-panel') || document.body;
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