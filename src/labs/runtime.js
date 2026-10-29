// Shared 3D stage for every BIH lab: renderer, camera, orbit controls,
// click/hover picking, text labels, tweening and a small UI helper.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export { THREE };

export const COLORS = {
  purple: 0x3a0ca3,
  blue: 0x4361ee,
  gold: 0xf77f00,
  green: 0x2ec4b6,
  red: 0xe63946,
  dark: 0x1e1e24,
  light: 0xf8f9fa,
  grey: 0xced4da,
  sky: 0xeef1ff,
};

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function createStage(host, opts = {}) {
  const wrap = host.querySelector('.lab-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background ?? COLORS.sky);

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 45, 1, 0.1, 500);
  camera.position.set(...(opts.camera ?? [0, 6, 12]));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...(opts.target ?? [0, 0, 0]));
  controls.enableDamping = true;
  controls.maxPolarAngle = opts.maxPolar ?? Math.PI * 0.49;
  controls.minDistance = opts.minDistance ?? 3;
  controls.maxDistance = opts.maxDistance ?? 40;
  controls.enablePan = opts.pan ?? false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c0ff, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const s = opts.shadowSize ?? 14;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 50 });
  scene.add(sun);

  if (opts.ground !== false) {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(opts.groundSize ?? 30, 64),
      new THREE.MeshStandardMaterial({ color: opts.groundColor ?? 0xdde3ff, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = opts.groundY ?? 0;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  const tickers = new Set();
  const clickables = new Map();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...clickables.keys()], true);
    for (const h of hits) {
      let o = h.object;
      while (o && !clickables.has(o)) o = o.parent;
      if (o && live(o)) {
        lastHit = h;
        return o;
      }
    }
    return null;
  }
  let lastHit = null;

  // Raycasting ignores visibility, so skip hidden or removed objects ourselves.
  function live(o) {
    for (let p = o; p; p = p.parent) {
      if (!p.visible) return false;
      if (p === scene) return true;
    }
    return false;
  }

  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    downAt = null;
    if (moved > 6) return; // that was a drag to rotate, not a click
    const o = pick(e);
    if (o) clickables.get(o)(o, e, lastHit);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    const o = pick(e);
    renderer.domElement.style.cursor = o ? 'pointer' : 'grab';
    if (o !== hovered) {
      setGlow(hovered, false);
      setGlow(o, true);
      hovered = o;
    }
  });

  function resize() {
    const w = wrap.clientWidth || 600;
    const h = wrap.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(wrap);
  resize();

  // Pause rendering when the lab is scrolled off-screen (kind to older school PCs).
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(wrap);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const t = clock.elapsedTime;
    for (const f of tickers) f(dt, t);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    THREE,
    scene,
    camera,
    controls,
    renderer,
    onTick(fn) {
      tickers.add(fn);
      return () => tickers.delete(fn);
    },
    clickable(obj, fn) {
      clickables.set(obj, fn);
    },
    unclickable(obj) {
      clickables.delete(obj);
    },
    tween(fn, duration = 0.6, ease = easeInOut) {
      return new Promise((resolve) => {
        let e = 0;
        const off = this.onTick((dt) => {
          e += dt;
          const k = Math.min(e / duration, 1);
          fn(ease(k));
          if (k >= 1) {
            off();
            resolve();
          }
        });
      });
    },
    wait(seconds) {
      return this.tween(() => {}, seconds, (k) => k);
    },
    confetti() {
      const colors = [0x3a0ca3, 0x4361ee, 0xf77f00, 0x2ec4b6, 0xe63946, 0xffd166];
      const bits = [];
      const origin = controls.target.clone().add(new THREE.Vector3(0, 3, 0));
      for (let i = 0; i < 160; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }));
        m.position.copy(origin);
        m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 7 + 3, (Math.random() - 0.5) * 9);
        m.userData.spin = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0);
        scene.add(m);
        bits.push(m);
      }
      let life = 0;
      const off = this.onTick((dt) => {
        life += dt;
        for (const m of bits) {
          m.userData.v.y -= 9 * dt;
          m.position.addScaledVector(m.userData.v, dt);
          m.rotation.x += m.userData.spin.x * dt;
          m.rotation.y += m.userData.spin.y * dt;
        }
        if (life > 3.5) {
          bits.forEach((m) => {
            scene.remove(m);
            m.geometry.dispose();
          });
          off();
        }
      });
    },
  };
}

export const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function setGlow(obj, on) {
  if (!obj) return;
  obj.traverse((m) => {
    if (!m.isMesh || !m.material || !('emissive' in m.material)) return;
    if (on) {
      m.userData._emissive ??= m.material.emissive.getHex();
      m.material.emissive.setHex(0x333355);
    } else if (m.userData._emissive !== undefined) {
      m.material.emissive.setHex(m.userData._emissive);
    }
  });
}

export function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
}

export function box(w, h, d, color, extra) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Canvas-drawn text, used both for floating labels and for flat textures.
export function textCanvas(lines, { width = 512, height = 128, bg = null, color = '#1E1E24', font = 'bold 54px system-ui, sans-serif', align = 'center', radius = 24 } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, width, height, radius);
    g.fill();
  }
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  const step = height / arr.length;
  const x = align === 'center' ? width / 2 : align === 'left' ? 24 : width - 24;
  const size = Number(font.match(/(\d+)px/)?.[1] ?? 54);
  arr.forEach((l, i) => {
    // Shrink long text so it always fits inside its label.
    let px = size;
    do g.font = font.replace(/\d+px/, `${px}px`);
    while (g.measureText(l).width > width - 40 && (px -= 2) > 12);
    g.fillText(l, x, step * i + step / 2);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function label(text, { scale = 1, bg = 'rgba(255,255,255,0.92)', color = '#3A0CA3', width = 512, height = 128, font } = {}) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: textCanvas(text, { width, height, bg, color, font }), depthTest: false, transparent: true })
  );
  sprite.scale.set((width / height) * scale, scale, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export function setLabel(sprite, text, opts = {}) {
  const old = sprite.material.map;
  sprite.material.map = textCanvas(text, { width: 512, height: 128, bg: 'rgba(255,255,255,0.92)', color: '#3A0CA3', ...opts });
  sprite.material.needsUpdate = true;
  old?.dispose();
}

// The HTML side panel next to the canvas: info text plus control buttons.
export function createUI(host) {
  const info = host.querySelector('.lab-info');
  const controls = host.querySelector('.lab-controls');
  const missionsEl = host.querySelector('.lab-missions');
  const canSpeak = 'speechSynthesis' in window;
  let missions = [];
  let done = new Set();
  let storeKey = null;
  let onFinish = () => {};

  info.addEventListener('click', (e) => {
    if (!e.target.closest('.speak')) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(info.innerText.replace('🔊', ''));
    u.lang = 'en-GB';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  });

  function renderMissions() {
    if (!missionsEl || !missions.length) return;
    const next = missions.find((m) => !done.has(m.id));
    const count = missions.filter((m) => done.has(m.id)).length;
    missionsEl.innerHTML = `
      <div class="mission-head"><b>🎯 Missions</b><span>${count} of ${missions.length}</span><button type="button" class="mission-reset" title="Start the missions again">↺</button></div>
      <div class="meter mission-meter"><span style="width:${(count / missions.length) * 100}%"></span></div>
      ${next ? `<div class="mission-next"><span class="mission-label">👉 Do this next</span><b>${next.text}</b>${next.hint ? `<small>💡 ${next.hint}</small>` : ''}</div>` : '<div class="mission-next done"><b>🏆 All missions complete! Brilliant work.</b><small>Explore freely, or press ↺ to try again.</small></div>'}
      <details><summary>See all missions</summary><ol>${missions.map((m) => `<li class="${done.has(m.id) ? 'ok' : ''}">${done.has(m.id) ? '✅' : '⬜'} ${m.text}</li>`).join('')}</ol></details>`;
  }
  missionsEl?.addEventListener('click', (e) => {
    if (!e.target.closest('.mission-reset')) return;
    done = new Set();
    save();
    renderMissions();
  });
  function save() {
    try {
      localStorage.setItem(storeKey, JSON.stringify([...done]));
    } catch {}
  }

  return {
    info(title, html) {
      info.innerHTML = `<h4>${title}${canSpeak ? ' <button type="button" class="speak" title="Read this to me" aria-label="Read this to me">🔊</button>' : ''}</h4>${html}`;
    },
    // Guided, step-by-step challenges shown above the info panel.
    missions(labId, list, finish) {
      missions = list;
      storeKey = `bih-lab-${labId}`;
      onFinish = finish ?? onFinish;
      try {
        done = new Set(JSON.parse(localStorage.getItem(storeKey) || '[]'));
      } catch {}
      renderMissions();
    },
    complete(id) {
      if (done.has(id) || !missions.some((m) => m.id === id)) return;
      done.add(id);
      save();
      renderMissions();
      missionsEl?.classList.remove('pop');
      void missionsEl?.offsetWidth;
      missionsEl?.classList.add('pop');
      if (missions.every((m) => done.has(m.id))) onFinish();
    },
    isDone: (id) => done.has(id),
    clear() {
      controls.innerHTML = '';
    },
    button(text, fn, { primary = false, group } = {}) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lab-btn' + (primary ? ' primary' : '');
      b.textContent = text;
      b.addEventListener('click', () => fn(b));
      (group ?? controls).appendChild(b);
      return b;
    },
    group(title) {
      const g = document.createElement('div');
      g.className = 'lab-group';
      if (title) g.innerHTML = `<span class="lab-group-title">${title}</span>`;
      controls.appendChild(g);
      return g;
    },
    toggle(buttons, active) {
      buttons.forEach((b) => b.classList.toggle('active', b === active));
    },
    element(html, group) {
      const d = document.createElement('div');
      d.innerHTML = html;
      (group ?? controls).appendChild(d);
      return d;
    },
  };
}
