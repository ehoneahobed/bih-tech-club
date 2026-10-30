// Sessions 12–13 — Presentations: fix a badly designed 3-slide deck (contrast,
// the 6-by-6 rule, a squished picture, carnival animations), then present it
// in a 3D classroom using real slide-show keys (→, ←, B, Esc).
import { THREE, COLORS, box, mat } from './runtime.js';

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
  const wall = box(16, 8, 0.3, 0xf1f3f5);
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
  const frame = box(9.9, 5.7, 0.1, 0x212529);
  frame.position.set(0, 4.4, -3.86);
  scene.add(frame);

  const podium = box(1.2, 1.6, 0.8, 0x8d6e4c);
  podium.position.set(5.6, 0.8, -1.8);
  scene.add(podium);
  const speaker = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 1.4, 16), mat(COLORS.purple));
  sBody.position.y = 1.7;
  const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat(0x8d5524));
  sHead.position.y = 2.65;
  speaker.add(sBody, sHead);
  speaker.position.set(5.6, 0, -2.6);
  scene.add(speaker);

  const audience = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 6; c++) {
      const g = new THREE.Group();
      const chair = box(0.8, 0.5, 0.8, 0x6c757d);
      chair.position.y = 0.25;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.8, 12), mat([0xffbe00, 0x2ec4b6, 0x5a4470, 0xca1f3f][(r + c) % 4]));
      body.position.y = 0.9;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat([0x8d5524, 0x6b3e1f, 0xa0662f][(r * 6 + c) % 3]));
      head.position.y = 1.5;
      g.add(chair, body, head);
      g.position.set(-4.5 + c * 1.8, 0, 2 + r * 1.6);
      scene.add(g);
      audience.push(g);
    }
  let clap = 0;
  stage.onTick((dt, t) => {
    if (clap > 0) {
      clap -= dt;
      audience.forEach((a, i) => (a.position.y = Math.abs(Math.sin(t * 12 + i)) * 0.25));
    } else audience.forEach((a) => (a.position.y = 0));
  });

  // ---------- Drawing a slide ----------
  const picture = drawPicture();
  function draw(alpha = 1) {
    const g = canvas.getContext('2d');
    const s = slides[current];
    const th = THEMES[s.theme];
    g.clearRect(0, 0, SW, SH);
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
  const EDIT_CAM = { pos: new THREE.Vector3(9, 6, 12), target: new THREE.Vector3(0, 3.2, -1) };
  const SHOW_CAM = { pos: new THREE.Vector3(0, 3.4, 6.5), target: new THREE.Vector3(0, 4.2, -3.8) };
  async function fly(to) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    await stage.tween((k) => {
      camera.position.lerpVectors(p0, to.pos, k);
      controls.target.lerpVectors(t0, to.target, k);
    }, 1.0);
  }
  async function startShow() {
    showing = true;
    ui.complete('show');
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

export const config = { camera: [9, 6, 12], target: [0, 3.2, -1], shadowSize: 12, maxPolar: Math.PI * 0.55, maxDistance: 30 };
