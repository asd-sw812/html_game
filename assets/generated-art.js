(() => {
  const cfg = window.GAME_ASSETS || {};
  const chars = cfg.characters || {};
  const bosses = cfg.bosses || {};
  const bg = cfg.backgrounds || {};
  const cols = Number(chars.atlasColumns || 4);
  const rows = Number(chars.atlasRows || 4);
  const imageState = new Map();

  const loadable = (src) => {
    if (!src) return Promise.resolve(false);
    if (imageState.has(src)) return imageState.get(src);
    const p = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
    imageState.set(src, p);
    return p;
  };

  function atlasVars(index) {
    const n = Math.abs(Number(index) || 0) % (cols * rows);
    const x = n % cols;
    const y = Math.floor(n / cols);
    return {
      x: cols <= 1 ? 0 : (x / (cols - 1)) * 100,
      y: rows <= 1 ? 0 : (y / (rows - 1)) * 100
    };
  }

  function visualIndexFor(id) {
    try {
      const roster = window.ArchiveGame?.roster?.() || [];
      const hit = roster.find(x => x.id === id);
      return hit?.visualIndex ?? 0;
    } catch {
      return 0;
    }
  }

  function mountAtlasLayer(host, src, index, mode) {
    if (!host || !src) return;
    let layer = host.querySelector(':scope > .generated-atlas-layer');
    if (!layer) {
      layer = document.createElement('span');
      layer.className = 'generated-atlas-layer';
      host.prepend(layer);
    }
    const {x,y} = atlasVars(index);
    layer.classList.toggle('generated-battle-atlas', mode === 'battle');
    layer.classList.toggle('generated-formation-atlas', mode !== 'battle');
    layer.style.backgroundImage = `url("${src}")`;
    layer.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
    layer.style.backgroundPosition = `${x}% ${y}%`;
  }

  async function mountSelectionArt() {
    if (!document.body.classList.contains('selection-mode')) return;
    if (!await loadable(chars.formationAtlas)) return;
    document.querySelectorAll('[data-portrait-id]').forEach(host => {
      mountAtlasLayer(host, chars.formationAtlas, visualIndexFor(host.dataset.portraitId), 'formation');
    });
  }

  async function mountBattleArt() {
    if (!document.body.classList.contains('battle-mode')) return;

    if (await loadable(chars.battleAtlas)) {
      document.querySelectorAll('.party-grid .unit-portrait[data-portrait-id]').forEach(host => {
        mountAtlasLayer(host, chars.battleAtlas, visualIndexFor(host.dataset.portraitId), 'battle');
      });

      const placeholder = document.querySelector('#activeFighter .fighter-placeholder');
      let active = null;
      try {
        const snap = window.ArchiveGame?.snapshot?.();
        active = snap?.players?.find(p => p.id === snap.activeId) || snap?.players?.find(p => !p.dead);
      } catch {}
      if (placeholder && active) {
        mountAtlasLayer(placeholder, chars.battleAtlas, visualIndexFor(active.id), 'battle');
        placeholder.classList.add('generated-fighter-host');
      }
    }

    const bossFigure = document.querySelector('.boss-figure');
    if (bossFigure && await loadable(bosses.judge)) {
      const id = document.body.dataset.archiveBoss || '';
      if (id === 'warden' || id === '') {
        let img = bossFigure.querySelector(':scope > .generated-boss-image');
        if (!img) {
          img = document.createElement('img');
          img.className = 'generated-boss-image';
          img.alt = '';
          bossFigure.prepend(img);
        }
        img.src = bosses.judge;
      }
    }
  }

  async function mountBackground() {
    const chosen = await loadable(bg.battle) ? bg.battle : bg.fallbackBattle;
    if (chosen) {
      document.documentElement.style.setProperty('--battle-background-image', `url("${chosen}")`);
    }
  }

  let queued = false;
  const sync = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(async () => {
      queued = false;
      await Promise.all([mountSelectionArt(), mountBattleArt()]);
    });
  };

  new MutationObserver(sync).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class','data-portrait-id','data-initial']
  });

  mountBackground();
  sync();
})();
