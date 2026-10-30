// Session 3 — The Desktop & Programmes: open programmes from icons, then
// practise the three window buttons (minimise, maximise, close) and the taskbar.
import { THREE, mat, rbox, decal } from './runtime.js';

const APPS = [
  { id: 'paint', name: 'Paint', icon: '🎨', color: '#F77F00' },
  { id: 'word', name: 'Word', icon: '📝', color: '#4361EE' },
  { id: 'calc', name: 'Calculator', icon: '🧮', color: '#2EC4B6' },
  { id: 'folder', name: 'My Files', icon: '📁', color: '#E9C46A' },
];

const SW = 12; // screen width
const SH = 7; // screen height
const TASKBAR_Y = -SH / 2 + 0.3;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// ---------- Canvas drawing helpers ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
// A flat picture; see-through ones (icons, buttons on the taskbar) get no ink outline.
function plane(w, h, map, transparent = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent, toneMapped: false }));
  m.userData.noInk = transparent;
  return m;
}
function rr(g, x, y, w, h, r, fill) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) (g.fillStyle = fill), g.fill();
}
function dot(g, x, y, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

// Each programme's icon, drawn in a box of size s at (x, y). No real brand logos.
function drawIcon(g, id, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s / 100, s / 100);
  g.lineJoin = g.lineCap = 'round';
  if (id === 'paint') {
    // A painter's palette with a brush.
    g.fillStyle = '#F4D8A8';
    g.beginPath();
    g.ellipse(48, 54, 44, 36, -0.3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#B07A3A';
    g.lineWidth = 3;
    g.stroke();
    dot(g, 30, 64, 8, '#fff8ee');
    ['#CA1F3F', '#FFBE00', '#2EC4B6', '#4361EE', '#7B2CBF'].forEach((c, i) => dot(g, 24 + i * 13, 40 + Math.sin(i) * 8, 7, c));
    g.strokeStyle = '#7A4A1E';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(92, 8);
    g.lineTo(62, 58);
    g.stroke();
    dot(g, 60, 62, 6, '#CA1F3F');
  } else if (id === 'word') {
    // A page of writing with a blue band.
    rr(g, 18, 6, 64, 88, 6, '#FFFFFF');
    g.strokeStyle = '#9AA5B1';
    g.lineWidth = 2;
    g.stroke();
    rr(g, 18, 6, 64, 18, [6, 6, 0, 0], '#4361EE');
    g.fillStyle = '#9AA5B1';
    for (let i = 0; i < 6; i++) g.fillRect(28, 34 + i * 9, i % 3 === 2 ? 28 : 44, 4);
  } else if (id === 'calc') {
    rr(g, 20, 4, 60, 92, 10, '#3A3344');
    rr(g, 28, 12, 44, 20, 4, '#B9F0E9');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) rr(g, 28 + c * 16, 40 + r * 13, 12, 9, 2, r === 3 && c === 2 ? '#F77F00' : '#E9ECEF');
  } else {
    // A yellow folder.
    rr(g, 8, 20, 38, 18, 5, '#D4A72C');
    rr(g, 8, 28, 84, 60, 7, '#F2C94C');
    rr(g, 8, 40, 84, 48, 7, '#FFD966');
  }
  g.restore();
}

function wallpaper() {
  return canvasTex(1024, 600, (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#24182E');
    sky.addColorStop(1, '#5A4470');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(760, 250, 10, 760, 250, 170);
    sun.addColorStop(0, 'rgba(255,190,0,0.95)');
    sun.addColorStop(0.3, 'rgba(255,190,0,0.6)');
    sun.addColorStop(1, 'rgba(255,190,0,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, W, H);
    // Rolling hills in BIH red and plum.
    const hill = (y, a, color) => {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x / 150 + a) * 30 + Math.sin(x / 61 + a * 2) * 8);
      g.lineTo(W, H);
      g.fill();
    };
    hill(390, 0.5, 'rgba(202,31,63,0.55)');
    hill(440, 2.1, 'rgba(90,68,112,0.9)');
    hill(500, 4.0, '#2E2038');
  });
}

// The picture inside each programme's window, below its title bar.
function appContent(app) {
  return canvasTex(1024, 578, (g, W, H) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, W, H);
    g.font = `16px ${FONT}`;
    g.textBaseline = 'middle';
    if (app.id === 'paint') {
      g.fillStyle = '#F3F1F5';
      g.fillRect(0, 0, W, 86);
      ['File', 'Edit', 'View'].forEach((t, i) => ((g.fillStyle = '#24182E'), g.fillText(t, 16 + i * 60, 18)));
      for (let i = 0; i < 6; i++) rr(g, 16 + i * 52, 36, 42, 40, 6, i === 1 ? '#FFE3B8' : '#E4E1E8');
      ['#000000', '#7F7F7F', '#CA1F3F', '#F77F00', '#FFBE00', '#2EC4B6', '#4361EE', '#7B2CBF', '#FFFFFF', '#5A4470'].forEach((c, i) => {
        rr(g, 400 + (i % 5) * 30, 34 + Math.floor(i / 5) * 24, 24, 20, 3, c);
        g.strokeStyle = '#ADB5BD';
        g.lineWidth = 1;
        g.stroke();
      });
      g.fillStyle = '#D9D3DE';
      g.fillRect(0, 86, W, H - 86);
      g.fillStyle = '#FFFFFF';
      g.fillRect(24, 106, W - 160, H - 140);
      // A child's drawing: a house under the sun.
      dot(g, 700, 190, 40, '#FFBE00');
      g.fillStyle = '#CA1F3F';
      g.beginPath();
      g.moveTo(180, 300); g.lineTo(300, 200); g.lineTo(420, 300);
      g.fill();
      g.fillStyle = '#F4D8A8';
      g.fillRect(200, 300, 200, 150);
      g.fillStyle = '#5A4470';
      g.fillRect(280, 370, 44, 80);
      g.strokeStyle = '#2EC4B6';
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(24, 470); g.quadraticCurveTo(400, 430, W - 136, 470);
      g.stroke();
    } else if (app.id === 'word') {
      g.fillStyle = '#F3F1F5';
      g.fillRect(0, 0, W, 86);
      ['File', 'Home', 'Insert', 'Layout'].forEach((t, i) => ((g.fillStyle = i === 1 ? '#4361EE' : '#24182E'), g.fillText(t, 16 + i * 70, 18)));
      rr(g, 16, 40, 150, 32, 4, '#FFFFFF');
      g.fillStyle = '#24182E';
      g.fillText('Calibri  11', 26, 56);
      ['B', 'I', 'U'].forEach((t, i) => {
        rr(g, 180 + i * 40, 40, 32, 32, 4, '#E4E1E8');
        g.fillStyle = '#24182E';
        g.font = `${['bold ', 'italic ', ''][i]}20px ${FONT}`;
        g.fillText(t, 190 + i * 40, 57);
      });
      g.fillStyle = '#D9D3DE';
      g.fillRect(0, 86, W, H - 86);
      g.fillStyle = '#FFFFFF';
      g.fillRect(232, 104, 560, H - 104);
      g.fillStyle = '#24182E';
      g.font = `bold 30px ${FONT}`;
      g.fillText('My Holiday Story', 280, 150);
      g.fillStyle = '#ADB5BD';
      for (let i = 0; i < 12; i++) g.fillRect(280, 196 + i * 28, i % 4 === 3 ? 260 : 460, 9);
      g.fillStyle = '#24182E';
      g.fillRect(280 + 262, 196 + 3 * 28 - 8, 3, 24); // the cursor
    } else if (app.id === 'calc') {
      g.fillStyle = '#F3F1F5';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#24182E';
      g.font = `bold 64px ${FONT}`;
      g.textAlign = 'right';
      g.fillText('125', W - 40, 70);
      g.font = `20px ${FONT}`;
      g.fillStyle = '#6C757D';
      g.fillText('100 + 25 =', W - 40, 22);
      const keys = ['%', 'CE', 'C', '⌫', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '='];
      g.textAlign = 'center';
      keys.forEach((k, i) => {
        const c = i % 4, r = Math.floor(i / 4);
        rr(g, 24 + c * 246, 120 + r * 90, 236, 80, 8, k === '=' ? '#2EC4B6' : r === 0 || c === 3 ? '#E4E1E8' : '#FFFFFF');
        g.fillStyle = '#24182E';
        g.font = `600 30px ${FONT}`;
        g.fillText(k, 24 + c * 246 + 118, 160 + r * 90);
      });
    } else {
      g.fillStyle = '#F3F1F5';
      g.fillRect(0, 0, W, 56);
      rr(g, 16, 12, 560, 32, 6, '#FFFFFF');
      g.fillStyle = '#24182E';
      g.fillText('This PC  ›  Documents', 30, 28);
      g.fillStyle = '#F8F7FA';
      g.fillRect(0, 56, 220, H - 56);
      ['Desktop', 'Documents', 'Pictures', 'Music', 'Downloads'].forEach((t, i) => {
        if (i === 1) rr(g, 8, 70 + i * 44, 204, 36, 6, '#E4E1E8');
        drawIcon(g, 'folder', 16, 76 + i * 44, 24);
        g.fillStyle = '#24182E';
        g.fillText(t, 50, 89 + i * 44);
      });
      ['School', 'Homework', 'Photos', 'Songs', 'Projects', 'Letters'].forEach((t, i) => {
        const x = 270 + (i % 4) * 180, y = 90 + Math.floor(i / 4) * 170;
        drawIcon(g, 'folder', x, y, 110);
        g.fillStyle = '#24182E';
        g.font = `20px ${FONT}`;
        g.textAlign = 'center';
        g.fillText(t, x + 55, y + 124);
        g.textAlign = 'left';
      });
    }
  });
}

// Title-bar button faces: minimise, maximise, restore (two squares) and close.
function buttonTex(kind) {
  return canvasTex(128, 110, (g, W, H) => {
    rr(g, 2, 4, W - 4, H - 8, 10, kind === 'close' ? '#E81123' : '#E4E1E8');
    g.strokeStyle = kind === 'close' ? '#FFFFFF' : '#24182E';
    g.lineWidth = 6;
    g.lineCap = 'round';
    const cx = W / 2, cy = H / 2;
    g.beginPath();
    if (kind === 'min') {
      g.moveTo(cx - 20, cy + 2);
      g.lineTo(cx + 20, cy + 2);
    } else if (kind === 'max') g.strokeRect(cx - 18, cy - 18, 36, 36);
    else if (kind === 'restore') {
      g.strokeRect(cx - 20, cy - 10, 30, 30);
      g.moveTo(cx - 10, cy - 20);
      g.lineTo(cx + 20, cy - 20);
      g.lineTo(cx + 20, cy + 10);
    } else {
      g.moveTo(cx - 18, cy - 18);
      g.lineTo(cx + 18, cy + 18);
      g.moveTo(cx + 18, cy - 18);
      g.lineTo(cx - 18, cy + 18);
    }
    g.stroke();
  });
}

export default function desktopLab(stage, ui) {
  const { scene } = stage;
  const root = new THREE.Group();
  root.position.y = SH / 2 + 1.7;
  scene.add(root);

  // ---------- The monitor around the screen ----------
  const frame = rbox(SW + 0.5, SH + 1.0, 0.3, 0x24182e, 0.12);
  frame.position.set(0, -0.25, -0.2);
  const back = rbox(SW * 0.55, SH * 0.6, 0.5, 0x2e2238, 0.2);
  back.position.set(0, -0.4, -0.55);
  const neck = rbox(1.1, 2.2, 0.3, 0x3a3344, 0.1);
  neck.position.set(0, -root.position.y + 1.2, -0.75);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.14, 48), mat(0x3a3344));
  foot.scale.z = 0.5;
  foot.position.set(0, -root.position.y + 0.07, -0.7);
  foot.castShadow = foot.receiveShadow = true;
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), mat(0x88aaff, { emissive: 0x3366ff, emissiveIntensity: 0.8 }));
  led.rotation.x = Math.PI / 2;
  led.position.set(SW / 2 - 0.3, -SH / 2 - 0.38, -0.04);
  const webcam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), mat(0x0b0b14, { roughness: 0.1 }));
  webcam.rotation.x = Math.PI / 2;
  webcam.position.set(0, SH / 2 + 0.13, -0.04);
  // Menu buttons on the chin.
  const chin = decal(1.2, 0.12, (g, W, H) => {
    for (let i = 0; i < 4; i++) rr(g, i * W * 0.22, H * 0.3, W * 0.14, H * 0.4, 4, 'rgba(255,255,255,0.3)');
  }, { px: 32 });
  chin.position.set(SW / 2 - 1.3, -SH / 2 - 0.38, -0.048);
  root.add(frame, back, neck, foot, led, webcam, chin);

  const wall = plane(SW, SH, wallpaper());
  wall.position.z = -0.04;
  root.add(wall);
  const aboutWallpaper = () => ui.info('Desktop background (wallpaper)', '<p>The picture behind everything. Clicking it does nothing — it is just the "table top" your programmes sit on.</p>');
  stage.clickable(wall, aboutWallpaper);

  // ---------- Taskbar ----------
  const taskbar = rbox(SW, 0.6, 0.05, 0x2c2036, 0.02);
  taskbar.position.set(0, TASKBAR_Y, 0);
  root.add(taskbar);
  // System tray on the right: network, sound, battery and the clock.
  const tray = decal(3.0, 0.6, (g, W, H) => {
    g.strokeStyle = g.fillStyle = '#F1F0F3';
    g.lineWidth = 4;
    g.lineCap = 'round';
    const y = H / 2;
    g.beginPath();
    g.moveTo(W * 0.04, y + 6); g.lineTo(W * 0.06, y - 6); g.lineTo(W * 0.08, y + 6); // "show hidden icons" arrow
    g.stroke();
    for (const r of [8, 18, 28]) {
      g.beginPath();
      g.arc(W * 0.2, y + 14, r, -Math.PI * 0.75, -Math.PI * 0.25);
      g.stroke();
    }
    dot(g, W * 0.2, y + 14, 4, '#F1F0F3');
    g.beginPath();
    g.moveTo(W * 0.3, y - 6); g.lineTo(W * 0.315, y - 6); g.lineTo(W * 0.335, y - 16); g.lineTo(W * 0.335, y + 16); g.lineTo(W * 0.315, y + 6); g.lineTo(W * 0.3, y + 6);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(W * 0.34, y, 14, -0.8, 0.8);
    g.stroke();
    g.strokeRect(W * 0.42, y - 10, 44, 20);
    g.fillRect(W * 0.42 + 4, y - 6, 28, 12);
    g.fillRect(W * 0.42 + 44, y - 4, 4, 8);
    g.font = `600 30px ${FONT}`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    g.fillText('10:30', W * 0.92, y - 17);
    g.font = `26px ${FONT}`;
    g.fillText('30/10/2026', W * 0.92, y + 18);
  }, { px: 128 });
  tray.position.set(SW / 2 - 1.5, 0, 0.027);
  taskbar.add(tray);
  const aboutTaskbar = () => ui.info('Taskbar', '<p>The strip along the bottom. It shows the <b>Start</b> button and every programme that is open — even minimised ones. Click a programme here to bring it back.</p>');
  stage.clickable(taskbar, aboutTaskbar);
  // Start button: a generic four-dot mark (not any real company's logo).
  const start = plane(0.5, 0.5, canvasTex(128, 128, (g) => {
    rr(g, 8, 8, 112, 112, 22, '#FFBE00');
    for (const [x, y] of [[44, 44], [84, 44], [44, 84], [84, 84]]) dot(g, x, y, 15, '#24182E');
  }), true);
  start.position.set(-SW / 2 + 0.4, TASKBAR_Y, 0.04);
  root.add(start);
  const aboutStart = () => ui.info('Start button', '<p>Opens the Start menu: a list of every programme, plus the <b>Power</b> button for a safe shutdown.</p>');
  stage.clickable(start, aboutStart);

  // Desktop icons
  const icons = [];
  APPS.forEach((app, i) => {
    const icon = plane(1.1, 1.1, canvasTex(256, 256, (g, W) => {
      rr(g, 8, 8, W - 16, W - 16, 22, 'rgba(255,255,255,0.10)');
      g.shadowColor = 'rgba(0,0,0,0.45)';
      g.shadowBlur = 8;
      drawIcon(g, app.id, 63, 26, 130);
      g.fillStyle = '#FFFFFF';
      g.font = `600 ${app.name.length > 8 ? 38 : 46}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(app.name, W / 2, 205);
    }), true);
    icon.position.set(-SW / 2 + 0.9, SH / 2 - 0.9 - i * 1.35, 0.01);
    root.add(icon);
    let last = 0;
    const click = () => {
      const now = performance.now();
      if (now - last < 450) open(app);
      else ui.info(`${app.name} icon`, `<p>An <b>icon</b> is a small picture that stands for a programme. <b>Double-click</b> it (click twice quickly) to open ${app.name}.</p>`);
      last = now;
    };
    stage.clickable(icon, click);
    icons.push({ mesh: icon, click });
  });

  // ---------- Windows ----------
  const wins = new Map(); // id -> { group, state, slot, ... }
  const BTN = { min: buttonTex('min'), max: buttonTex('max'), restore: buttonTex('restore'), close: buttonTex('close') };
  const W = 5.2;
  const H = 3.4;
  // A maximised window fills the screen above the taskbar.
  const MAX_AT = new THREE.Vector3(0, TASKBAR_Y + 0.3 + (SH - 0.6) / 2, 0);
  const MAX_SCALE = new THREE.Vector3((SW - 0.04) / W, (SH - 0.62) / H, 1);
  let z = 0.1;

  function open(app) {
    let w = wins.get(app.id);
    if (w) {
      if (w.state === 'min') restore(w);
      focus(w);
      return;
    }
    const group = new THREE.Group();
    const body = rbox(W, H, 0.06, 0xf8f9fa, 0.03);
    // Title bar: the programme's icon and name, like a real window.
    const title = plane(W - 0.04, 0.45, canvasTex(1024, 88, (g, CW, CH) => {
      g.fillStyle = '#F1F0F3';
      g.fillRect(0, 0, CW, CH);
      g.fillStyle = app.color;
      g.fillRect(0, CH - 5, CW, 5);
      drawIcon(g, app.id, 18, 18, 52);
      g.fillStyle = '#24182E';
      g.font = `600 36px ${FONT}`;
      g.textBaseline = 'middle';
      g.fillText(app.name, 86, CH / 2);
    }));
    title.position.set(0, H / 2 - 0.245, 0.035);
    const content = plane(W - 0.08, H - 0.51, appContent(app));
    content.position.set(0, -0.215, 0.035);
    group.add(body, title, content);

    const buttons = {};
    const btn = (key, x, fn, name, help) => {
      const b = plane(0.42, 0.36, BTN[key]);
      b.position.set(x, H / 2 - 0.245, 0.04);
      group.add(b);
      const click = () => {
        fn(w);
        ui.info(name, help);
      };
      stage.clickable(b, click);
      buttons[key] = { mesh: b, click };
    };
    btn('min', W / 2 - 1.25, minimise, 'Minimise ( – )', '<p>Hides the window down to the taskbar. The programme is <b>still open</b> — your work is safe. Click its taskbar button to bring it back.</p>');
    btn('max', W / 2 - 0.77, toggleMax, 'Maximise / Restore ( □ )', '<p>Makes the window fill the whole screen. Click again to restore it to its smaller size.</p>');
    btn('close', W / 2 - 0.29, close, 'Close ( ✕ )', '<p>Exits the programme. If you have unsaved work, it will ask whether to save — read the question carefully!</p>');

    // Taskbar button: the programme's icon with a coloured "open" line under it.
    const slot = plane(0.5, 0.5, canvasTex(128, 128, (g) => {
      rr(g, 4, 4, 120, 120, 18, 'rgba(255,255,255,0.16)');
      drawIcon(g, app.id, 24, 16, 80);
      rr(g, 40, 110, 48, 8, 4, app.color);
    }), true);
    root.add(slot);
    const slotClick = () => {
      if (w.state === 'min') restore(w);
      else minimise(w);
      ui.info('Taskbar button', `<p>${app.name} is open. Clicking its taskbar button switches between showing and minimising it.</p>`);
    };
    stage.clickable(slot, slotClick);

    const offset = wins.size;
    w = { app, group, slot, slotClick, buttons, state: 'normal', home: new THREE.Vector3(-1.2 + offset * 0.9, 0.6 - offset * 0.5, 0), scale: 1 };
    wins.set(app.id, w);
    stage.clickable(body, () => focus(w));
    stage.clickable(title, () => focus(w));
    stage.clickable(content, () => focus(w));
    root.add(group);
    layoutSlots();
    group.position.copy(slot.position);
    group.scale.setScalar(0.05);
    focus(w);
    animate(w, w.home, 1);
    ui.complete('open');
    if (wins.size >= 2) ui.complete('multi');
    drawCallouts();
    ui.info(`${app.name} is open`, '<p>A <b>window</b> is a framed area where a programme runs. Try the three buttons in its top-right corner: <b>–</b> minimise, <b>□</b> maximise, <b>✕</b> close. Open a second programme to practise <b>multitasking</b>.</p>');
  }

  function layoutSlots() {
    [...wins.values()].forEach((w, i) => w.slot.position.set(-SW / 2 + 1.1 + i * 0.62, TASKBAR_Y, 0.04));
  }

  function focus(w) {
    z += 0.08;
    w.group.position.z = z;
    w.z = z;
    drawCallouts();
  }

  // The maximise button shows "restore" (two squares) while the window is maximised.
  function setMaxFace(w) {
    w.buttons.max.mesh.material.map = w.state === 'max' || (w.state === 'min' && w.prev === 'max') ? BTN.restore : BTN.max;
  }

  // scale: a number, or a Vector3 (a maximised window is stretched to fill the screen).
  function animate(w, to, scale, done) {
    setMaxFace(w);
    const from = w.group.position.clone();
    const s0 = w.group.scale.clone();
    const s1 = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : scale;
    const target = to.clone();
    target.z = w.group.position.z;
    return stage.tween((k) => {
      w.group.position.lerpVectors(from, target, k);
      w.group.scale.lerpVectors(s0, s1, k);
    }, 0.45).then(() => done?.());
  }

  function minimise(w) {
    ui.complete('min');
    w.prev = w.state === 'max' ? 'max' : 'normal';
    w.state = 'min';
    drawCallouts();
    animate(w, w.slot.position, 0.04, () => (w.group.visible = false));
  }
  function restore(w) {
    ui.complete('restore');
    w.group.visible = true;
    w.state = w.prev ?? 'normal';
    focus(w);
    if (w.state === 'max') animate(w, MAX_AT, MAX_SCALE);
    else animate(w, w.home, 1);
  }
  function toggleMax(w) {
    if (w.state === 'max') {
      w.state = 'normal';
      drawCallouts();
      animate(w, w.home, 1);
    } else {
      w.state = 'max';
      ui.complete('max');
      focus(w);
      animate(w, MAX_AT, MAX_SCALE);
    }
  }
  function close(w) {
    ui.complete('close');
    wins.delete(w.app.id);
    root.remove(w.slot);
    animate(w, w.group.position, 0.01, () => root.remove(w.group));
    layoutSlots();
    drawCallouts();
  }

  // ---------- Callouts ----------
  // Cards for the desktop parts, plus the window buttons of the window on top and
  // the taskbar button of a minimised programme. Redrawn whenever a window changes.
  let cards = [];
  function card(obj, icon, title, text, at, dx, dy, onClick, mission) {
    const c = stage.callout(obj, { icon, title, text, at, dx, dy, onClick });
    if (mission && ui.isDone(mission)) c.card.classList.add('done');
    cards.push(c);
  }
  function drawCallouts() {
    cards.forEach((c) => c.remove());
    cards = [];
    const open = [...wins.values()];
    const top = open.filter((w) => w.state !== 'min').sort((a, b) => b.z - a.z)[0];
    const hidden = open.find((w) => w.state === 'min');
    if (top?.state !== 'max') card(icons[0].mesh, '🖱️', 'Icons', 'Double-click an icon to open it', [0.4, 0.5, 0], 70, -70, icons[0].click, 'open');
    if (!open.length) card(wall, '🖼️', 'Desktop', 'The background your programmes sit on', [2.5, -0.6, 0], 0, -40, aboutWallpaper);
    card(start, '⊞', 'Start button', 'Every programme, and Power', [0, -0.25, 0], -10, 85, aboutStart);
    card(taskbar, '📊', 'Taskbar', 'Shows every open programme', [2.5, -0.3, 0], 40, 85, aboutTaskbar);
    if (hidden) card(hidden.slot, '⬆️', `${hidden.app.name} button`, `Click to bring ${hidden.app.name} back`, [0, 0.25, 0], 110, -75, hidden.slotClick, 'restore');
    if (top) {
      // Normal window: cards fan out to its right. Maximised: above and below the buttons.
      const b = top.buttons;
      const max = top.state === 'max';
      card(b.min.mesh, '➖', 'Minimise', 'Hide it in the taskbar', [0, 0.18, 0], max ? -130 : 200, max ? -70 : -60, b.min.click, 'min');
      card(b.max.mesh, '⬜', max ? 'Restore' : 'Maximise', max ? 'Back to a smaller window' : 'Fill the whole screen', [0, max ? 0.18 : 0, 0], max ? 0 : 170, max ? -95 : 5, b.max.click, 'max');
      card(b.close.mesh, '❌', 'Close', 'Exit the programme', [0.21, 0, 0], max ? 60 : 140, max ? 75 : 70, b.close.click, 'close');
    }
  }

  drawCallouts();

  ui.info('Your desktop', '<p>This is the screen you see after signing in. <b>Double-click an icon</b> on the left to open a programme, then use the window buttons. Click the taskbar or Start button to learn what they do.</p>');
  const g = ui.group('Shortcuts');
  ui.button('Open Paint + Word (multitask)', () => {
    open(APPS[0]);
    setTimeout(() => open(APPS[1]), 500);
  }, { group: g });
  ui.button('Minimise all (show desktop)', () => wins.forEach((w) => w.state !== 'min' && minimise(w)), { group: g });
}

export const config = { camera: [0, 5.6, 13], target: [0, 4.6, 0], frame: 1.3, maxPolar: Math.PI * 0.6, minDistance: 6, shadowSize: 9 };

export const missions = [
  { id: 'open', text: 'Double-click the Paint icon to open it.', hint: 'Click twice quickly on the icon at the top left.' },
  { id: 'min', text: 'Minimise the window with the – button.', hint: 'The window hides in the taskbar. It is still open!' },
  { id: 'restore', text: 'Bring it back by clicking its button on the taskbar.', hint: 'The taskbar is the dark strip at the bottom of the screen.' },
  { id: 'max', text: 'Make the window fill the screen with the □ button.', hint: 'This is called "maximise".' },
  { id: 'multi', text: 'Open a second programme so two windows are open.', hint: 'Double-click Word. Working with two programmes is called multitasking.' },
  { id: 'close', text: 'Close a programme with the ✕ button.', hint: 'Closing exits the programme. Always save your work first!' },
];
