// Sessions 12–13 — Presentations: fix a badly designed 3-slide deck (contrast,
// the 6-by-6 rule, a squished picture, carnival animations), then present it
// in a 3D classroom using real slide-show keys (→, ←, B, Esc).
import { THREE, COLORS, box, mat, rbox, cable, decal } from './runtime.js';

const SW = 1280;
const SH = 720;
const THEMES = [
  { name: 'Sunshine', bg: '#FFF3A0', fg: '#FFD166' },
  { name: 'Clean white', bg: '#FFFFFF', fg: '#1E1E24' },
  { name: 'Night', bg: '#1E1E24', fg: '#FFFFFF' },
  { name: 'BIH plum', bg: '#24182E', fg: '#FFFFFF' },
  { name: 'Red on green', bg: '#2A9D8F', fg: '#E63946' },
];
const deck = () => [
  { layout: 'title', title: 'Safe Water for Our School', sub: 'EcoTech Innovators · JHS 1', theme: 0 },
  {
    layout: 'bullets', title: 'The Problem', theme: 1, bullets: [
      'Many of the water drums in our school compound do not have any covers on them at all',
      'Mosquitoes breed in open water',
      'Pupils fall sick with malaria every term and miss many important lessons and exams',
      'Some cups are shared by everybody',
      'The tap near JHS 2 leaks all day long and wastes water',
      'Nobody cleans the drums often',
      'Rain water collects in old tyres',
      'Parents are worried',
    ],
  },
  { layout: 'picture', title: 'Our Solution: Cover Every Drum', theme: 1, stretch: 1.9, locked: false },
];

// WCAG contrast ratio between two hex colours.
function contrast(a, b) {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export default function slidesLab(stage, ui, host) {
  const { scene, camera, controls } = stage;
  let slides = deck();
  let current = 0;
  let anim = 'carnival'; // part of the badly designed starting deck
  let showing = false;
  let blacked = false;

  // ---------- Classroom ----------
  buildRoom(scene);
  const wall = box(16, 8, 0.3, 0xf3efe8);
  wall.position.set(0, 4, -4);
  scene.add(wall);
  const canvas = document.createElement('canvas');
  canvas.width = SW;
  canvas.height = SH;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 5.4), screenMat);
  screen.position.set(0, 4.4, -3.8);
  scene.add(screen);
  const frame = rbox(9.9, 5.7, 0.1, 0x2b2730, 0.04);
  frame.position.set(0, 4.4, -3.86);
  scene.add(frame);
  scene.add(buildRoller());

  // The projector on its trolley table, with a soft beam of light to the screen.
  const projector = buildProjector();
  scene.add(projector);
  const lens = new THREE.Vector3(0, 1.18, 0.24);
  const beam = buildBeam(lens, screen);
  scene.add(beam);

  const podium = buildLectern(tex);
  podium.position.set(5.9, 0, -2.0);
  scene.add(podium);
  scene.add(cable([[0.2, 1.15, 1.05], [0.45, 0.7, 1.15], [0.7, 0.03, 1.1], [3.4, 0.03, 0.2], [5.5, 0.03, -1.55], [5.75, 0.5, -1.62], [5.8, 1.3, -1.75]], 0x2b2730, 0.03));

  const { speaker, forearm, clicker } = buildSpeaker();
  speaker.position.set(4.5, 0, -2.4);
  speaker.rotation.y = -0.25;
  scene.add(speaker);
  // A press of the clicker: the forearm lifts a little and its LED blinks.
  const click = () => stage.tween((k) => {
    forearm.rotation.x = -Math.PI / 2 - Math.sin(k * Math.PI) * 0.35;
    clicker.material.emissive.setHex(k < 0.9 ? COLORS.red : 0x000000);
  }, 0.3);

  const audience = buildAudience(scene);
  let clap = 0;
  stage.onTick((dt, t) => {
    if (clap > 0) {
      clap -= dt;
      audience.forEach((a, i) => (a.position.y = Math.abs(Math.sin(t * 12 + i)) * 0.25));
    } else audience.forEach((a) => (a.position.y = 0));
  });

  // ---------- Callouts ----------
  // Only in the editor view: during the show the camera sits among the audience.
  let cards = [];
  function drawCallouts() {
    cards.forEach((c) => c.remove());
    cards = [
      stage.callout(screen, { icon: '🖼️', title: `Slide ${current + 1}`, text: 'Signboard: keywords, pictures', at: [-4.8, 2.2, 0], dx: -115, dy: -40 }),
      stage.callout(speaker, { icon: '🎤', title: 'Speaker', text: 'The star: face the audience', at: [0, 1.9, 0.3], dx: 50, dy: 85 }),
      stage.callout(audience[15], { icon: '👥', title: 'Audience', text: 'The back row must read it', at: [0, 1.5, 0], dx: -60, dy: 65 }),
    ];
  }

  // ---------- Drawing a slide ----------
  const picture = drawPicture();
  function draw(alpha = 1) {
    const g = canvas.getContext('2d');
    const s = slides[current];
    const th = THEMES[s.theme];
    g.clearRect(0, 0, SW, SH);
    beam.visible = !blacked && !showing; // B blanks the projector, too
    if (blacked) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, SW, SH);
      tex.needsUpdate = true;
      return;
    }
    g.fillStyle = th.bg;
    g.fillRect(0, 0, SW, SH);
    g.globalAlpha = alpha;
    g.fillStyle = th.fg;
    g.textAlign = s.layout === 'title' ? 'center' : 'left';
    g.textBaseline = 'middle';
    if (s.layout === 'title') {
      g.font = 'bold 84px "Segoe UI", Arial, sans-serif';
      g.fillText(s.title, SW / 2, SH * 0.44);
      g.font = '40px "Segoe UI", Arial, sans-serif';
      g.fillText(s.sub, SW / 2, SH * 0.6);
    } else {
      g.font = 'bold 64px "Segoe UI", Arial, sans-serif';
      g.fillText(s.title, 70, 90);
      g.fillRect(70, 135, 160, 6);
    }
    if (s.layout === 'bullets') {
      const n = s.bullets.length;
      const size = n > 6 ? 30 : 42;
      g.font = `${size}px "Segoe UI", Arial, sans-serif`;
      s.bullets.forEach((b, i) => {
        const y = 200 + i * (size * 1.55);
        g.fillText('•', 80, y);
        g.fillText(b, 120, y, SW - 170);
      });
    }
    if (s.layout === 'picture') {
      const h = 430;
      const w = h * s.stretch;
      g.drawImage(picture, (SW - w) / 2, 190, w, h);
    }
    g.globalAlpha = 1;
    tex.needsUpdate = true;
  }

  // ---------- Editor ----------
  const nav = ui.group('Slides');
  const navBtns = [0, 1, 2].map((i) => ui.button(`Slide ${i + 1}`, () => go(i), { group: nav }));
  const editor = ui.element('<div class="slide-editor"></div>', ui.group('Edit this slide'));
  const pane = editor.querySelector('.slide-editor');

  function renderEditor() {
    const s = slides[current];
    const ratio = contrast(THEMES[s.theme].bg, THEMES[s.theme].fg);
    let html = `<label class="lab-field">Design theme <select data-ed="theme">${THEMES.map((t, i) => `<option value="${i}"${i === s.theme ? ' selected' : ''}>${t.name}</option>`).join('')}</select></label>
      <p class="check ${ratio >= 4.5 ? 'good' : 'bad'}">${ratio >= 4.5 ? '✅' : '⚠️'} Contrast ${ratio.toFixed(1)} : 1 ${ratio >= 4.5 ? '(easy to read)' : '(too low: the back row cannot read this! Aim for 4.5 or more)'}</p>`;
    if (s.layout === 'bullets') {
      const long = s.bullets.filter((b) => words(b) > 6).length;
      const ok = s.bullets.length <= 6 && long === 0;
      html += `<p class="check ${ok ? 'good' : 'bad'}">${ok ? '✅ Follows the 6-by-6 rule' : `⚠️ 6-by-6 rule: ${s.bullets.length} bullets (max 6)${long ? `, ${long} with more than 6 words` : ''}`}</p>
        <ol class="bullet-edit">${s.bullets.map((b, i) => `<li><input data-b="${i}" value="${b.replace(/"/g, '&quot;')}"><span class="wc ${words(b) > 6 ? 'bad' : ''}">${words(b)}w</span><button type="button" data-del="${i}" aria-label="Delete bullet">✕</button></li>`).join('')}</ol>`;
    }
    if (s.layout === 'picture') {
      const ok = Math.abs(s.stretch - 1) < 0.04;
      html += `<p class="check ${ok ? 'good' : 'bad'}">${ok ? '✅ The picture keeps its true shape' : '⚠️ The picture is squished! Drag a corner handle, never a side handle.'}</p>
        <label class="lab-field">Picture width <input type="range" data-ed="stretch" min="0.5" max="2.2" step="0.01" value="${s.stretch}"></label>
        <label class="inline"><input type="checkbox" data-ed="locked"${s.locked ? ' checked' : ''}> 🔒 Lock aspect ratio (resize from a corner)</label>`;
    }
    html += `<label class="lab-field">Slide animation <select data-ed="anim">${['none', 'fade', 'fly', 'carnival'].map((a) => `<option${a === anim ? ' selected' : ''} value="${a}">${{ none: 'None', fade: 'Fade (calm)', fly: 'Fly in', carnival: '🎪 Spin + bounce + sparkle' }[a]}</option>`).join('')}</select></label>`;
    pane.innerHTML = html;
    navBtns.forEach((b, i) => b.classList.toggle('active', i === current));
    cards[0]?.set(`Slide ${current + 1}`, 'Signboard: keywords, pictures');
    check();
  }

  pane.addEventListener('input', (e) => {
    const s = slides[current];
    const t = e.target;
    if (t.dataset.b !== undefined) {
      s.bullets[t.dataset.b] = t.value;
      draw();
      const wc = t.nextElementSibling;
      wc.textContent = `${words(t.value)}w`;
      wc.classList.toggle('bad', words(t.value) > 6);
      check();
      return;
    }
    if (t.dataset.ed === 'stretch') {
      s.stretch = s.locked ? 1 : Number(t.value);
      if (s.locked) t.value = 1;
      draw();
      return;
    }
  });
  pane.addEventListener('change', (e) => {
    const s = slides[current];
    const t = e.target;
    if (t.dataset.ed === 'theme') s.theme = Number(t.value);
    if (t.dataset.ed === 'locked') {
      s.locked = t.checked;
      if (s.locked) s.stretch = 1;
    }
    if (t.dataset.ed === 'anim') {
      anim = t.value;
      if (anim === 'carnival') ui.info('🎪 The No-Carnival rule', '<p>Spinning, bouncing, sparkling text distracts your audience from your message. Choose <b>None</b> or a calm <b>Fade</b>.</p>');
    }
    if (t.dataset.ed === 'stretch' || t.dataset.b !== undefined) return renderEditor();
    draw();
    renderEditor();
  });
  pane.addEventListener('click', (e) => {
    const d = e.target.dataset.del;
    if (d === undefined) return;
    slides[current].bullets.splice(Number(d), 1);
    draw();
    renderEditor();
  });

  function check() {
    if (contrast(THEMES[slides[0].theme].bg, THEMES[slides[0].theme].fg) >= 4.5) ui.complete('contrast');
    const b = slides[1].bullets;
    if (b.length <= 6 && b.every((x) => words(x) <= 6 && words(x) > 0)) ui.complete('sixsix');
    if (Math.abs(slides[2].stretch - 1) < 0.04) ui.complete('aspect');
    if (anim !== 'carnival') ui.complete('calm');
  }

  async function go(i, transition = false) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    blacked = false;
    if (!transition || anim === 'none') {
      screen.rotation.set(0, 0, 0);
      screen.position.x = 0;
      draw();
    } else if (anim === 'fade') await stage.tween((k) => draw(k), 0.5);
    else if (anim === 'fly') {
      draw();
      await stage.tween((k) => (screen.position.x = (1 - k) * 12), 0.6);
    } else {
      draw();
      await stage.tween((k) => {
        screen.rotation.z = (1 - k) * Math.PI * 4;
        screen.scale.setScalar(0.3 + k * 0.7 + Math.sin(k * Math.PI * 6) * 0.08);
      }, 1.2);
      screen.rotation.z = 0;
      screen.scale.setScalar(1);
    }
    if (!showing) renderEditor();
  }

  // ---------- Slide show ----------
  const EDIT_CAM = { pos: new THREE.Vector3(11.5, 7.4, 15.5), target: new THREE.Vector3(0, 3.2, -1) };
  const SHOW_CAM = { pos: new THREE.Vector3(0, 3.3, 8.4), target: new THREE.Vector3(0, 3.9, -3.8) };
  async function fly(to) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    await stage.tween((k) => {
      camera.position.lerpVectors(p0, to.pos, k);
      controls.target.lerpVectors(t0, to.target, k);
    }, 1.0);
  }
  async function startShow() {
    stage.reveal();
    showing = true;
    ui.complete('show');
    cards.forEach((c) => c.remove());
    cards = [];
    host.focus({ preventScroll: true });
    await fly(SHOW_CAM);
    go(0);
    ui.info('▶ Slide show (F5)', '<p>You are the presenter now. Use your keyboard:</p><ul><li><b>→</b> or <b>Space</b>: next slide</li><li><b>←</b>: previous slide</li><li><b>B</b>: black screen, so all eyes are on you</li><li><b>Esc</b>: end the show</li></ul><p>Face the audience, not the screen!</p>');
  }
  async function endShow() {
    showing = false;
    blacked = false;
    draw();
    await fly(EDIT_CAM);
    if (!showing) drawCallouts();
    renderEditor();
  }

  host.tabIndex = 0;
  host.addEventListener('pointerdown', (e) => !e.target.closest('input, select, button') && host.focus({ preventScroll: true }));
  host.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select')) return;
    if (e.key === 'F5') {
      e.preventDefault();
      if (!showing) startShow();
      return;
    }
    if (!showing) return;
    if (['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'b', 'B', 'Escape'].includes(e.key)) e.preventDefault();
    if (['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'b', 'B'].includes(e.key)) click();
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      if (current === slides.length - 1) {
        clap = 2.5;
        ui.complete('finish');
        ui.info('👏 The audience is clapping!', '<p>You reached the end of your deck. Now invite questions: “Thank you. Are there any questions?” Press <b>Esc</b> to end the show.</p>');
      } else go(current + 1, true);
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(current - 1);
    if (e.key === 'b' || e.key === 'B') {
      blacked = !blacked;
      ui.complete('black');
      draw();
    }
    if (e.key === 'Escape') endShow();
  });

  const run = ui.group('Present');
  ui.button('▶ Start slide show (F5)', () => startShow(), { primary: true, group: run });
  ui.button('⏹ End show (Esc)', () => showing && endShow(), { group: run });
  ui.button('↺ Start again', () => {
    slides = deck();
    anim = 'carnival';
    go(0);
  }, { group: run });

  camera.position.copy(EDIT_CAM.pos);
  controls.target.copy(EDIT_CAM.target);
  drawCallouts();
  go(0);
  ui.info('Fix this deck!', '<p>This team\'s slides have design problems. Use the slide buttons to look at each slide and fix it. Then present it to the class.</p><p><b>Remember:</b> the speaker is the star. The slides are just the signboard.</p>');
}

function drawPicture() {
  const c = document.createElement('canvas');
  c.width = 430;
  c.height = 430;
  const g = c.getContext('2d');
  g.fillStyle = '#BDE0FE';
  g.fillRect(0, 0, 430, 430);
  g.fillStyle = '#80B918';
  g.fillRect(0, 330, 430, 100);
  g.fillStyle = '#4361EE';
  g.beginPath();
  g.ellipse(215, 230, 110, 26, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(105, 230, 220, 130);
  g.beginPath();
  g.ellipse(215, 360, 110, 26, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2B2D42';
  g.beginPath();
  g.ellipse(215, 222, 118, 30, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#FFD166';
  g.beginPath();
  g.arc(360, 70, 40, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1E1E24';
  g.font = 'bold 30px Arial';
  g.textAlign = 'center';
  g.fillText('Covered drum ✓', 215, 120);
  g.beginPath();
  g.arc(215, 300, 30, 0, Math.PI * 2);
  g.fillStyle = '#FFFFFF';
  g.fill();
  return c;
}

export const missions = [
  { id: 'contrast', text: 'Slide 1: choose a theme with good contrast.', hint: 'Yellow on yellow is hard to read. Try "Night", "Clean white" or "BIH plum".' },
  { id: 'sixsix', text: 'Slide 2: follow the 6-by-6 rule.', hint: 'No more than 6 bullets, and no more than 6 words in each. Delete or shorten bullets.' },
  { id: 'aspect', text: 'Slide 3: fix the squished picture.', hint: 'Tick "Lock aspect ratio" so the picture keeps its true shape.' },
  { id: 'calm', text: 'Choose a calm animation (None or Fade), not the carnival!', hint: 'Animations should help your message, not distract from it.' },
  { id: 'show', text: 'Start the slide show.', hint: 'Press the orange button or F5 while the lab is selected.' },
  { id: 'black', text: 'Press B during the show to black the screen, then B again.', hint: 'Use this when you want everyone to look at you, not the slides.' },
  { id: 'finish', text: 'Move through every slide to the end with → and hear the applause.', hint: 'Use the right-arrow key or the Space bar.' },
];

export const config = { camera: [11.5, 7.4, 15.5], target: [0, 3.2, -1], perspective: true, shadowSize: 12, groundY: -0.12, maxPolar: Math.PI * 0.55, maxDistance: 30 };

// ---------- Classroom models ----------
const WOOD = 0x9c6b3e;
const METAL = 0x5c5864;
const SKIN = [0x8d5524, 0x6b3e1f, 0xa0662f];

// Joins simple shapes into one geometry (one draw call), keeping a material group for each.
function merge(parts) {
  const pos = [];
  const nor = [];
  const uv = [];
  const out = new THREE.BufferGeometry();
  let start = 0;
  [...parts].sort((a, b) => a[1] - b[1]).forEach(([geo, m, x, y, z]) => {
    const g = geo.toNonIndexed();
    g.translate(x, y, z);
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    uv.push(...g.attributes.uv.array);
    const n = g.attributes.position.count;
    out.addGroup(start, n, m);
    start += n;
  });
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// Floor, a painted band along the wall, a louvre window and a clock.
function buildRoom(scene) {
  const floor = rbox(16, 0.12, 11, 0xd6c7b0, 0.04);
  floor.position.set(0, -0.06, 1.35);
  scene.add(floor);
  const band = box(16, 1.3, 0.04, 0xd9d3de);
  band.position.set(0, 0.65, -3.83);
  scene.add(band);
  const win = new THREE.Group();
  const sash = rbox(2.2, 3.0, 0.14, 0xf8f9fa, 0.04);
  const sky = box(1.9, 2.7, 0.02, 0xbde0fe);
  sky.position.z = 0.06;
  win.add(sash, sky);
  for (let i = 0; i < 8; i++) {
    const blade = box(1.9, 0.04, 0.3, 0xdbe9f4, { transparent: true, opacity: 0.85 });
    blade.position.set(0, -1.2 + i * 0.34, 0.12);
    blade.rotation.x = -0.6;
    win.add(blade);
  }
  const sill = box(2.4, 0.08, 0.3, 0xf8f9fa);
  sill.position.set(0, -1.54, 0.12);
  win.add(sill);
  win.position.set(-6.6, 4.4, -3.8);
  scene.add(win);
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32), mat(0xffffff));
  clock.rotation.x = Math.PI / 2;
  clock.position.set(6.4, 6.3, -3.8);
  scene.add(clock);
  const face = decal(0.76, 0.76, (g, w) => {
    g.translate(w / 2, w / 2);
    g.fillStyle = '#24182E';
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      g.fillRect(-3, -w * 0.46, 6, w * (i % 3 === 2 ? 0.1 : 0.05));
    }
    g.lineCap = 'round';
    g.lineWidth = 10;
    g.strokeStyle = '#24182E';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w * 0.2, -w * 0.12);
    g.moveTo(0, 0);
    g.lineTo(-w * 0.05, -w * 0.34);
    g.stroke();
  }, { px: 128 });
  face.position.set(6.4, 6.3, -3.755);
  scene.add(face);
}

// Pull-down screen: a roller case at the top and a weighted bar at the bottom.
function buildRoller() {
  const g = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 10.3, 20), mat(0xe9ecef));
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 7.38, -3.72);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 9.9, 10), mat(0x2b2730));
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.5, -3.78);
  const pull = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 16), mat(0x2b2730));
  pull.position.set(0, 1.36, -3.78);
  g.add(roll, bar, pull);
  g.traverse((m) => m.isMesh && (m.castShadow = true));
  return g;
}

function buildProjector() {
  const g = new THREE.Group();
  const top = rbox(1.4, 0.08, 1.0, WOOD, 0.03);
  top.position.y = 0.96;
  const shelf = box(1.2, 0.05, 0.8, WOOD);
  shelf.position.y = 0.3;
  g.add(top, shelf);
  for (const [x, z] of [[-0.62, -0.42], [0.62, -0.42], [-0.62, 0.42], [0.62, 0.42]]) {
    const leg = box(0.06, 0.92, 0.06, METAL);
    leg.position.set(x, 0.46, z);
    g.add(leg);
  }
  const body = rbox(0.95, 0.32, 0.75, 0xe9ecef, 0.07);
  body.position.set(0, 1.16, 0.1);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 20), mat(0x2b2730));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.18, -0.3);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), mat(0xbde0fe, { emissive: 0xfff3c4, emissiveIntensity: 0.6 }));
  glass.rotation.y = Math.PI;
  glass.position.set(0, 1.18, -0.355);
  const vents = decal(0.6, 0.18, (c, w, h) => {
    c.fillStyle = '#8a7a98';
    for (let i = 0; i < 8; i++) c.fillRect(6 + i * (w / 8), 6, w / 8 - 12, h - 12);
  }, { px: 64 });
  vents.rotation.y = Math.PI / 2;
  vents.position.set(0.477, 1.16, 0.1);
  g.add(body, lens, glass, vents);
  g.position.z = 0.6;
  return g;
}

// The beam: a thin, see-through pyramid from the lens to the screen corners.
function buildBeam(lens, screen) {
  const p = screen.position;
  const c = [[-4.8, 2.7], [4.8, 2.7], [4.8, -2.7], [-4.8, -2.7]].map(([x, y]) => new THREE.Vector3(p.x + x, p.y + y, p.z + 0.02));
  const pts = [];
  for (let i = 0; i < 4; i++) pts.push(lens, c[i], c[(i + 1) % 4]);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
  m.userData.noInk = true;
  m.raycast = () => {};
  return m;
}

// The lectern, with the presenter's laptop showing the current slide.
function buildLectern(tex) {
  const g = new THREE.Group();
  const body = rbox(1.2, 1.5, 0.8, 0x8d6e4c, 0.05);
  body.position.y = 0.75;
  const top = rbox(1.4, 0.08, 1.0, WOOD, 0.03);
  top.position.y = 1.56;
  top.rotation.x = 0.18;
  const panel = box(0.9, 0.9, 0.02, COLORS.blue);
  panel.position.set(0, 0.85, 0.41);
  g.add(body, top, panel);
  const laptop = new THREE.Group();
  const base = rbox(0.9, 0.05, 0.6, 0x8d939b, 0.02);
  const lid = new THREE.Group();
  lid.position.set(0, 0.03, 0.3);
  lid.rotation.x = 0.3;
  const shell = rbox(0.9, 0.58, 0.03, 0x8d939b, 0.015);
  shell.position.y = 0.29;
  const view = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.46), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  view.userData.noInk = true;
  view.rotation.y = Math.PI; // faces the speaker
  view.position.set(0, 0.29, -0.017);
  lid.add(shell, view);
  laptop.add(base, lid);
  laptop.position.set(0, 1.66, 0);
  laptop.rotation.x = 0.18;
  g.add(laptop);
  return g;
}

// The presenter: standing, facing the class, clicker in the right hand.
function buildSpeaker() {
  const g = new THREE.Group();
  const trousers = mat(0x2b2730);
  for (const x of [-0.14, 0.14]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 1.0, 12), trousers);
    leg.position.set(x, 0.5, 0);
    const shoe = rbox(0.18, 0.1, 0.32, 0x1b1214, 0.04);
    shoe.position.set(x, 0.05, 0.06);
    g.add(leg, shoe);
  }
  const shirt = mat(COLORS.red);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, 1.0, 16), shirt);
  torso.position.y = 1.5;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.15, 10), mat(SKIN[0]));
  neck.position.y = 2.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), mat(SKIN[0]));
  head.position.y = 2.36;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.3), mat(0x1b1214));
  hair.position.y = 2.38;
  g.add(torso, neck, head, hair);
  for (const x of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x1b1214));
    eye.position.set(x, 2.4, 0.23);
    g.add(eye);
  }
  // Left arm hangs down; the right forearm points forward, holding the clicker.
  const arm = (x) => {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.62, 10), shirt);
    a.geometry.translate(0, -0.31, 0);
    a.position.set(x, 1.95, 0);
    g.add(a);
    return a;
  };
  arm(-0.37).rotation.z = -0.12;
  const upper = arm(0.37);
  upper.rotation.z = 0.12;
  const forearm = new THREE.Group();
  forearm.position.set(0, -0.6, 0);
  forearm.rotation.x = -Math.PI / 2;
  const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.5, 10), mat(SKIN[0]));
  fa.position.y = 0.25;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(SKIN[0]));
  hand.position.y = 0.52;
  const clickerBody = rbox(0.07, 0.2, 0.05, 0x1b1214, 0.02);
  clickerBody.position.set(0, 0.58, 0.05);
  const clicker = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat(COLORS.red, { emissive: 0x000000 }));
  clicker.position.set(0, 0.66, 0.08);
  forearm.add(fa, hand, clickerBody, clicker);
  upper.add(forearm);
  return { speaker: g, forearm, clicker };
}

// 3 rows of 6 pupils at combined desk-chairs. The furniture shares one
// geometry, and the pupils share geometries and materials, so it stays light.
function buildAudience(scene) {
  const furniture = merge([
    [B(0.62, 0.05, 0.55), 0, 0, 0.45, 0.02], // seat
    [B(0.6, 0.42, 0.04), 0, 0, 0.78, 0.31], // back rest
    [B(0.95, 0.05, 0.45), 0, 0, 0.78, -0.5], // desk top
    [B(0.04, 0.45, 0.04), 1, -0.27, 0.225, -0.22],
    [B(0.04, 0.45, 0.04), 1, 0.27, 0.225, -0.22],
    [B(0.04, 0.98, 0.04), 1, -0.27, 0.49, 0.28],
    [B(0.04, 0.98, 0.04), 1, 0.27, 0.49, 0.28],
    [B(0.04, 0.76, 0.04), 1, -0.42, 0.38, -0.65],
    [B(0.04, 0.76, 0.04), 1, 0.42, 0.38, -0.65],
    [B(0.88, 0.04, 0.04), 1, 0, 0.12, -0.65], // foot bar
    [B(0.04, 0.04, 0.95), 1, -0.27, 0.1, -0.2], // runner joining chair and desk
    [B(0.04, 0.04, 0.95), 1, 0.27, 0.1, -0.2],
  ]);
  const furnMats = [mat(WOOD), mat(METAL, { metalness: 0.4 })];
  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.8, 12);
  const headGeo = new THREE.SphereGeometry(0.2, 12, 10);
  const hairGeo = new THREE.SphereGeometry(0.205, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const shirts = [0xffbe00, 0x2ec4b6, 0x5a4470, 0xca1f3f].map((c) => mat(c));
  const skins = SKIN.map((c) => mat(c));
  const hairMat = mat(0x1b1214);
  const audience = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 6; c++) {
      const x = -4.5 + c * 1.8;
      const z = 2 + r * 1.6;
      const seat = new THREE.Mesh(furniture, furnMats);
      seat.castShadow = seat.receiveShadow = true;
      seat.position.set(x, 0, z);
      scene.add(seat);
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, shirts[(r + c) % 4]);
      body.position.y = 0.88;
      const head = new THREE.Mesh(headGeo, skins[(r * 6 + c) % 3]);
      head.position.y = 1.5;
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 1.52;
      body.castShadow = head.castShadow = true;
      g.add(body, head, hair);
      g.position.set(x, 0, z);
      scene.add(g);
      audience.push(g);
    }
  return audience;
}
