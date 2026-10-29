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
      if (o && live(o)) return o;
    }
    return null;
  }

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
    if (o) clickables.get(o)(o, e);
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
  return {
    info(title, html) {
      info.innerHTML = `<h4>${title}</h4>${html}`;
    },
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
