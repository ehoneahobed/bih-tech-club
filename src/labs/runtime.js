// Shared 3D stage for every BIH lab: renderer, camera, orbit controls,
// click/hover picking, text labels, tweening and a small UI helper.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export { THREE };

// Bozoma Innovation Hub colours (plum, red, gold), plus a few helpers.
export const COLORS = {
  purple: 0x24182e,
  blue: 0x5a4470,
  gold: 0xffbe00,
  green: 0x2ec4b6,
  red: 0xca1f3f,
  dark: 0x24182e,
  light: 0xf9f9f9,
  grey: 0xd9d3de,
  sky: 0xf4f0f6,
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
  // Transparent canvas over the CSS "paper" background, like an illustrated diagram.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opts.background !== undefined) scene.background = new THREE.Color(opts.background);

  // Most labs use a fixed-angle orthographic camera: no perspective distortion,
  // so a model reads like a clear technical drawing. The slides lab flies the
  // camera into the audience, so it keeps a perspective camera.
  const start = new THREE.Vector3(...(opts.camera ?? [0, 6, 12]));
  const target0 = new THREE.Vector3(...(opts.target ?? [0, 0, 0]));
  const dist0 = start.distanceTo(target0);
  const ortho = !opts.perspective;
  const viewH = 2 * dist0 * Math.tan(THREE.MathUtils.degToRad((opts.fov ?? 45) / 2)) * (opts.frame ?? 1);
  const camera = ortho ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500) : new THREE.PerspectiveCamera(opts.fov ?? 45, 1, 0.1, 500);
  camera.position.copy(start);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target0);
  controls.enableDamping = true;
  controls.maxPolarAngle = opts.maxPolar ?? Math.PI * 0.49;
  controls.minDistance = opts.minDistance ?? 3;
  controls.maxDistance = opts.maxDistance ?? 40;
  controls.minZoom = dist0 / (opts.maxDistance ?? 40);
  controls.maxZoom = dist0 / (opts.minDistance ?? 3);
  controls.enablePan = opts.pan ?? false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfe0, 2.1));
  const sun = new THREE.DirectionalLight(0xfff6e8, 1.5);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 4;
  const s = opts.shadowSize ?? 14;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 50 });
  scene.add(sun);

  if (opts.ground !== false) {
    // A shadow-only floor: the paper shows through, with a soft shadow under the model.
    const ground = new THREE.Mesh(new THREE.CircleGeometry(opts.groundSize ?? 30, 64), new THREE.ShadowMaterial({ color: 0x24182e, opacity: 0.14 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = opts.groundY ?? 0;
    ground.receiveShadow = true;
    ground.userData.noInk = true;
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
    if (ortho) {
      // Fit the same framing on a narrow (phone) canvas as on a wide one.
      const vh = viewH * Math.max(1, (1.35 * h) / w);
      Object.assign(camera, { left: (-vh * w) / h / 2, right: (vh * w) / h / 2, top: vh / 2, bottom: -vh / 2 });
    } else camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(wrap);
  resize();

  // Pause rendering when the lab is scrolled off-screen (kind to older school PCs).
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(wrap);

  let frame = 0;
  inkScene(scene);
  const callouts = createCallouts(wrap, camera, renderer, live, scene, () => (ortho ? (wrap.clientHeight * camera.zoom) / (camera.top - camera.bottom) : wrap.clientHeight / viewH));
  const view = createViewBar(wrap, { camera, controls, start, target0, ortho, tween: (fn, d) => api.tween(fn, d), callouts });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const t = clock.elapsedTime;
    for (const f of tickers) f(dt, t);
    controls.update();
    if (++frame % 20 === 0) inkScene(scene);
    renderer.render(scene, camera);
    callouts.update();
  });

  const api = {
    THREE,
    scene,
    camera,
    controls,
    renderer,
    // A card pinned to a part with a dashed leader line (see createCallouts).
    callout: (obj, o) => callouts.add(obj, o),
    highlight: (obj, on) => setGlow(obj, on),
    view,
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
      const colors = [0x24182e, 0xca1f3f, 0xffbe00, 0x5a4470, 0x2ec4b6, 0xffffff];
      const bits = [];
      const origin = controls.target.clone().add(new THREE.Vector3(0, 3, 0));
      for (let i = 0; i < 160; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }));
        m.userData.noInk = true;
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
  return api;
}

export const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function setGlow(obj, on) {
  if (!obj) return;
  obj.traverse((m) => {
    if (!m.isMesh || !m.material || !('emissive' in m.material)) return;
    if (on) {
      m.userData._emissive ??= m.material.emissive.getHex();
      m.material.emissive.setHex(0x3a2a08); // warm gold glow on hover
    } else if (m.userData._emissive !== undefined) {
      m.material.emissive.setHex(m.userData._emissive);
    }
  });
}

// ---------- Ink outlines ----------
// Gives every solid an ink outline, like a technical illustration:
// crease lines for boxes and flat shapes, plus a thin silhouette ("inverted
// hull") for round shapes. New objects are picked up automatically.
const INK = 0x24182e;
const inkLine = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.78 });
const hullMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
hullMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.022;');
};
const ROUND = /Sphere|Cylinder|Capsule|Torus|Lathe|Cone|Tube|Icosahedron|Dodecahedron|Octahedron/;
const noPick = () => {};

export function inkScene(root) {
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.inked || m.userData.noInk || m.userData.isInk) return;
    m.userData.inked = true;
    const g = m.geometry;
    const mt = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!g || !mt || (mt.transparent && mt.opacity < 0.6) || mt.isShadowMaterial || g.attributes.position.count > 6000) return;
    const round = ROUND.test(g.type);
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(g, round ? 50 : 25), inkLine);
    lines.raycast = noPick;
    lines.userData.isInk = true;
    m.add(lines);
    if (round && g.attributes.normal) {
      const hull = new THREE.Mesh(g, hullMat);
      hull.raycast = noPick;
      hull.userData.isInk = true;
      m.add(hull);
    }
  });
}

// ---------- Callout cards ----------
// HTML cards pinned to parts of the model with a dot and a dashed leader line,
// so labels are crisp, readable, clickable and work with a keyboard.
function createCallouts(wrap, camera, renderer, live, scene, pxPerUnit) {
  const layer = document.createElement('div');
  layer.className = 'lab-callouts';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'lab-leaders');
  layer.appendChild(svg);
  wrap.appendChild(layer);
  const list = new Set();
  const v = new THREE.Vector3();
  let shown = true;
  // Plain text tags made by label(): drawn wherever their anchor is, if it is in this scene.
  const tagEls = new Map();
  const inScene = (o) => { for (let p = o; p; p = p.parent) if (p === scene) return true; return false; };
  function drawTags(W, H) {
    const unit = pxPerUnit();
    for (const a of TAGS) {
      let el = tagEls.get(a);
      if (!inScene(a)) { if (el) el.hidden = true; continue; }
      const t = a.userData.tag;
      if (!el) {
        el = document.createElement('span');
        el.className = 'tag3d';
        layer.appendChild(el);
        tagEls.set(a, el);
      }
      if (el.dataset.v !== String(t.v)) {
        el.dataset.v = t.v;
        el.innerHTML = (Array.isArray(t.text) ? t.text : [t.text]).map((x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')).join('<br>');
        el.style.color = t.color;
        el.style.background = t.bg && !/^rgba\([^)]*,\s*0\)$/.test(t.bg) ? t.bg : 'transparent';
        el.classList.toggle('bare', !t.bg);
      }
      const on = live(a);
      el.hidden = !on;
      if (!on) continue;
      a.getWorldPosition(v);
      v.project(camera);
      if (v.z > 1) { el.hidden = true; continue; }
      // Same size as the old sprite at the default zoom, but never smaller than 11px.
      el.style.fontSize = Math.max(11, Math.min(22, t.scale * unit * 0.42)).toFixed(1) + 'px';
      el.style.transform = `translate(${(((v.x + 1) / 2) * W).toFixed(1)}px, ${(((1 - v.y) / 2) * H).toFixed(1)}px) translate(-50%, -50%)`;
    }
  }
  return {
    add(obj, { title, text = '', icon = '', at = [0, 0, 0], dx = 0, dy = -70, onClick } = {}) {
      const card = document.createElement(onClick ? 'button' : 'div');
      if (onClick) card.type = 'button';
      card.className = 'callout';
      const dot = document.createElement('span');
      dot.className = 'callout-dot';
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svg.appendChild(line);
      layer.append(dot, card);
      const c = { obj, at: new THREE.Vector3(...at), dx, dy, card, dot, line };
      c.set = (t, x = '', i = icon) => {
        card.innerHTML = `${i ? `<span class="callout-icon" aria-hidden="true">${i}</span>` : ''}<span><b>${t}</b>${x ? `<small>${x}</small>` : ''}</span>`;
      };
      c.set(title, text);
      if (onClick) card.addEventListener('click', onClick);
      c.remove = () => { list.delete(c); card.remove(); dot.remove(); line.remove(); };
      list.add(c);
      return c;
    },
    clear() { [...list].forEach((c) => c.remove()); },
    show(on) { shown = on; layer.classList.toggle('off', !on); },
    get shown() { return shown; },
    update() {
      const r = renderer.domElement;
      const W = r.clientWidth;
      const H = r.clientHeight;
      drawTags(W, H);
      if (!list.size || !shown) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const placed = [];
      for (const c of list) {
        const on = c.obj ? live(c.obj) : true;
        c.card.hidden = c.dot.hidden = !on;
        c.line.style.display = on ? '' : 'none';
        if (!on) continue;
        v.copy(c.at);
        if (c.obj) c.obj.localToWorld(v);
        v.project(camera);
        const x = ((v.x + 1) / 2) * W;
        const y = ((1 - v.y) / 2) * H;
        const cw = c.card.offsetWidth;
        const ch = c.card.offsetHeight;
        // Keep the card inside the canvas.
        const left = Math.max(6, Math.min(W - cw - 6, x + c.dx - cw / 2));
        let top = Math.max(6, Math.min(H - ch - 44, y + c.dy - ch / 2));
        // Push a card up or down until it no longer covers one already placed.
        for (let tries = 0; tries < 6; tries++) {
          const hit = placed.find((p) => left < p.r && left + cw > p.l && top < p.b && top + ch > p.t);
          if (!hit) break;
          top = c.dy >= 0 ? hit.b + 6 : hit.t - ch - 6;
        }
        top = Math.max(6, Math.min(H - ch - 44, top));
        placed.push({ l: left, r: left + cw, t: top, b: top + ch });
        c.card.style.transform = `translate(${left}px, ${top}px)`;
        c.dot.style.transform = `translate(${x - 6}px, ${y - 6}px)`;
        const ex = Math.max(left, Math.min(left + cw, x));
        const ey = Math.max(top, Math.min(top + ch, y));
        Object.entries({ x1: x, y1: y, x2: ex, y2: ey }).forEach(([k, val]) => c.line.setAttribute(k, val.toFixed(1)));
      }
    },
  };
}

// ---------- View toolbar ----------
// Rotate, zoom, show/hide labels and reset, as buttons under the model.
function createViewBar(wrap, { camera, controls, start, target0, ortho, tween, callouts }) {
  const bar = document.createElement('div');
  bar.className = 'lab-viewbar';
  const btn = (icon, label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = icon;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', fn);
    bar.appendChild(b);
    return b;
  };
  const turn = (deg) => {
    const offset = camera.position.clone().sub(controls.target);
    const from = Math.atan2(offset.x, offset.z);
    const radius = Math.hypot(offset.x, offset.z);
    const to = from + THREE.MathUtils.degToRad(deg);
    tween((k) => {
      const a = from + (to - from) * k;
      camera.position.set(controls.target.x + Math.sin(a) * radius, camera.position.y, controls.target.z + Math.cos(a) * radius);
    }, 0.5);
  };
  const zoom = (f) => {
    if (ortho) {
      const z0 = camera.zoom;
      const z1 = THREE.MathUtils.clamp(z0 * f, controls.minZoom, controls.maxZoom);
      tween((k) => { camera.zoom = z0 + (z1 - z0) * k; camera.updateProjectionMatrix(); }, 0.3);
    } else {
      const off = camera.position.clone().sub(controls.target);
      const len = THREE.MathUtils.clamp(off.length() / f, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(off.setLength(len));
    }
  };
  btn('⟲', 'Turn left', () => turn(-45));
  btn('⟳', 'Turn right', () => turn(45));
  btn('−', 'Zoom out', () => zoom(1 / 1.25));
  btn('+', 'Zoom in', () => zoom(1.25));
  const lb = btn('🏷️', 'Show or hide labels', () => { callouts.show(!callouts.shown); lb.classList.toggle('on', callouts.shown); });
  lb.classList.add('on');
  btn('⌂', 'Reset the view', () => {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const z0 = camera.zoom;
    tween((k) => {
      camera.position.lerpVectors(p0, start, k);
      controls.target.lerpVectors(t0, target0, k);
      if (ortho) { camera.zoom = z0 + (1 - z0) * k; camera.updateProjectionMatrix(); }
    }, 0.6);
  });
  wrap.appendChild(bar);
  return { turn, zoom, bar };
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
export function textCanvas(lines, { width = 512, height = 128, bg = null, color = '#24182E', font = 'bold 54px Rubik, system-ui, sans-serif', align = 'center', radius = 24 } = {}) {
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

// Floating text labels. These used to be 3D sprites, which became tiny and blurry
// when zoomed out. Now each label is an invisible point in the scene, and the
// stage draws it as crisp HTML text at that point (see createCallouts).
const TAGS = new Set();
export function label(text, { scale = 1, bg = 'rgba(255,255,255,0.92)', color = '#24182E' } = {}) {
  const anchor = new THREE.Object3D();
  anchor.userData.tag = { text, scale, bg, color, v: 1 };
  TAGS.add(anchor);
  return anchor;
}

export function setLabel(anchor, text, opts = {}) {
  const t = anchor.userData.tag;
  if (!t) return;
  Object.assign(t, { text, color: opts.color ?? '#24182E', bg: opts.bg ?? t.bg, v: t.v + 1 });
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
    // Lets the session page show "3 of 6 missions" in its step-by-step path.
    host.dispatchEvent(new CustomEvent('bih-missions', { bubbles: true, detail: { lab: host.dataset.lab, done: count, total: missions.length } }));
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
    // The title is plain text (it may hold names pupils typed); the body is HTML.
    info(title, html) {
      info.innerHTML = `<h4>${String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;')}${canSpeak ? ' <button type="button" class="speak" title="Read this to me" aria-label="Read this to me">🔊</button>' : ''}</h4>${html}`;
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
