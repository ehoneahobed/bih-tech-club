// Session 3 — The Desktop & Programmes: open programmes from icons, then
// practise the three window buttons (minimise, maximise, close) and the taskbar.
import { THREE, box, mat, textCanvas } from './runtime.js';

const APPS = [
  { id: 'paint', name: 'Paint', icon: '🎨', color: '#F77F00' },
  { id: 'word', name: 'Word', icon: '📝', color: '#4361EE' },
  { id: 'calc', name: 'Calculator', icon: '🧮', color: '#2EC4B6' },
  { id: 'folder', name: 'My Files', icon: '📁', color: '#E9C46A' },
];

const SW = 12; // screen width
const SH = 7; // screen height
const TASKBAR_Y = -SH / 2 + 0.3;

export default function desktopLab(stage, ui) {
  const { scene } = stage;
  const root = new THREE.Group();
  root.position.y = SH / 2 + 0.6;
  scene.add(root);

  const bezel = box(SW + 0.5, SH + 0.5, 0.3, 0x24182e);
  bezel.position.z = -0.2;
  root.add(bezel);
  const wallpaper = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: gradient() }));
  wallpaper.position.z = -0.04;
  root.add(wallpaper);
  const aboutWallpaper = () => ui.info('Desktop background (wallpaper)', '<p>The picture behind everything. Clicking it does nothing — it is just the "table top" your programmes sit on.</p>');
  stage.clickable(wallpaper, aboutWallpaper);

  const taskbar = box(SW, 0.6, 0.05, 0x3a2b47);
  taskbar.position.set(0, TASKBAR_Y, 0);
  root.add(taskbar);
  const aboutTaskbar = () => ui.info('Taskbar', '<p>The strip along the bottom. It shows the <b>Start</b> button and every programme that is open — even minimised ones. Click a programme here to bring it back.</p>');
  stage.clickable(taskbar, aboutTaskbar);
  const start = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: textCanvas('⊞', { width: 128, height: 128, bg: '#4361EE', color: '#fff', font: 'bold 90px system-ui', radius: 16 }) }));
  start.position.set(-SW / 2 + 0.4, TASKBAR_Y, 0.04);
  root.add(start);
  const aboutStart = () => ui.info('Start button', '<p>Opens the Start menu: a list of every programme, plus the <b>Power</b> button for a safe shutdown.</p>');
  stage.clickable(start, aboutStart);

  // Desktop icons
  const icons = [];
  APPS.forEach((app, i) => {
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ map: textCanvas([app.icon, app.name], { width: 256, height: 256, bg: 'rgba(255,255,255,0.18)', color: '#fff', font: 'bold 64px system-ui', radius: 20 }), transparent: true })
    );
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
  let z = 0.1;

  function open(app) {
    let w = wins.get(app.id);
    if (w) {
      if (w.state === 'min') restore(w);
      focus(w);
      return;
    }
    const group = new THREE.Group();
    const W = 5.2;
    const H = 3.4;
    const body = box(W, H, 0.06, 0xffffff);
    const title = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.45), new THREE.MeshBasicMaterial({ map: textCanvas(`${app.icon}  ${app.name}`, { width: 1024, height: 90, bg: app.color, color: '#fff', font: 'bold 50px system-ui', align: 'left', radius: 0 }) }));
    title.position.set(0, H / 2 - 0.225, 0.035);
    const content = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, H - 0.75), new THREE.MeshBasicMaterial({ map: textCanvas(['This is the', `${app.name} window`], { width: 512, height: 256, bg: '#F8F9FA', color: '#adb5bd', font: 'bold 46px system-ui', radius: 0 }) }));
    content.position.set(0, -0.2, 0.035);
    group.add(body, title, content);

    const buttons = {};
    const btn = (key, sym, bg, x, fn, name, help) => {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), new THREE.MeshBasicMaterial({ map: textCanvas(sym, { width: 128, height: 110, bg, color: '#fff', font: 'bold 80px system-ui', radius: 10 }) }));
      b.position.set(x, H / 2 - 0.225, 0.04);
      group.add(b);
      const click = () => {
        fn(w);
        ui.info(name, help);
      };
      stage.clickable(b, click);
      buttons[key] = { mesh: b, click };
    };
    btn('min', '–', '#6c757d', W / 2 - 1.25, minimise, 'Minimise ( – )', '<p>Hides the window down to the taskbar. The programme is <b>still open</b> — your work is safe. Click its taskbar button to bring it back.</p>');
    btn('max', '□', '#6c757d', W / 2 - 0.77, toggleMax, 'Maximise / Restore ( □ )', '<p>Makes the window fill the whole screen. Click again to restore it to its smaller size.</p>');
    btn('close', '✕', '#E63946', W / 2 - 0.29, close, 'Close ( ✕ )', '<p>Exits the programme. If you have unsaved work, it will ask whether to save — read the question carefully!</p>');

    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: textCanvas(app.icon, { width: 128, height: 128, bg: app.color, color: '#fff', font: '80px system-ui', radius: 16 }) }));
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

  function animate(w, to, scale, done) {
    const from = w.group.position.clone();
    const s0 = w.group.scale.x;
    const target = to.clone();
    target.z = w.group.position.z;
    return stage.tween((k) => {
      w.group.position.lerpVectors(from, target, k);
      w.group.scale.setScalar(s0 + (scale - s0) * k);
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
    if (w.state === 'max') animate(w, new THREE.Vector3(0, 0.3, 0), 2.2);
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
      animate(w, new THREE.Vector3(0, 0.3, 0), 2.2);
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
    if (!open.length) card(wallpaper, '🖼️', 'Desktop', 'The background your programmes sit on', [2.5, -0.6, 0], 0, -40, aboutWallpaper);
    card(start, '⊞', 'Start button', 'Every programme, and Power', [0, -0.25, 0], -10, 85, aboutStart);
    card(taskbar, '📊', 'Taskbar', 'Shows every open programme', [3.5, -0.3, 0], 40, 85, aboutTaskbar);
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

function gradient() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 300;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 512, 300);
  grd.addColorStop(0, '#24182E');
  grd.addColorStop(1, '#5A4470');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 300);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const config = { camera: [0, 4.6, 13], target: [0, 3.6, 0], frame: 1.2, maxPolar: Math.PI * 0.6, minDistance: 6, shadowSize: 9 };

export const missions = [
  { id: 'open', text: 'Double-click the Paint icon to open it.', hint: 'Click twice quickly on the icon at the top left.' },
  { id: 'min', text: 'Minimise the window with the – button.', hint: 'The window hides in the taskbar. It is still open!' },
  { id: 'restore', text: 'Bring it back by clicking its button on the taskbar.', hint: 'The taskbar is the dark strip at the bottom of the screen.' },
  { id: 'max', text: 'Make the window fill the screen with the □ button.', hint: 'This is called "maximise".' },
  { id: 'multi', text: 'Open a second programme so two windows are open.', hint: 'Double-click Word. Working with two programmes is called multitasking.' },
  { id: 'close', text: 'Close a programme with the ✕ button.', hint: 'Closing exits the programme. Always save your work first!' },
];
