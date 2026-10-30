// Session 14 (and Session 15 re-tries) — Form Filler. A 3D laptop shows a
// practice online application for a fictional pupil. Someone started it on
// this shared computer and left mistakes: catch them, fill every required
// field, attach a photo that meets the rules, submit once, then keep proof.
// Only made-up profiles are used: never real personal details.
import { THREE, COLORS, rbox, mat, decal, label } from './runtime.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = (px, w = 600) => `${w} ${px}px Rubik, system-ui, sans-serif`;

// The fictional profiles from the workbooks (Session 14, and Station 4 of Session 15).
const PROFILES = {
  14: {
    who: 'Akosua', helper: 'Yaw', title: 'BIH Hub Holiday Camp Registration (PRACTICE)', url: 'forms.example.org/bih-camp',
    surname: 'Boateng', first: 'Akosua', other: 'Serwaa', dob: '14/08/2012', dobLong: '14 August 2012', school: 'Bozoma Model JHS', cls: 'JHS 2', track: 'Coding', acts: ['Typing contest', 'Quiz'],
    guardian: 'Mr Kwame Boateng', phone: '024 000 0000', email: 'akosua.boateng@example.org', photo: 'Practice_Photo_Akosua.jpg',
    ref: 'BIH-CAMP-14', folder: 'Documents › BIH_TechClub', save: 'Camp_Confirmation_Akosua.pdf',
    planted: { first: 'akosua', dob: '2012/14/08', phone: '024 000 000', email: 'akosua boateng@example.org' },
  },
  15: {
    who: 'Selasi', helper: 'Yaw', title: 'Skills Lab 2 Practice Form', url: 'forms.example.org/skills-lab-2',
    surname: 'Agbeko', first: 'Selasi', other: 'Kafui', dob: '03/11/2011', dobLong: '3 November 2011', school: 'Bozoma Model JHS', cls: 'JHS 3', track: 'Robotics', acts: ['Quiz', 'Football'],
    guardian: 'Mrs Dzifa Agbeko', phone: '020 000 0000', email: 'selasi.agbeko@example.org', photo: 'Practice_Photo_Selasi.jpg',
    ref: 'BIH-SL2-15', folder: 'Documents › BIH_TechClub › Online_Basics', save: 'Form_Confirmation_Selasi.pdf',
    planted: { first: 'selasi', dob: '2011/03/11', phone: '020 000 000', email: 'selasi agbeko@example.org' },
  },
};
function pageSession() {
  const v = document.querySelector('.lab[data-lab="formfill"]')?.dataset.session ?? document.querySelector('[data-path]')?.dataset.path ?? (location.pathname.match(/sessions\/(\d+)/) || [])[1];
  return Number(v) || 14;
}
const CLASSES = ['JHS 1', 'JHS 2', 'JHS 3'];
const TRACKS = ['Coding', 'Design', 'Robotics'];
const ACTS = ['Typing contest', 'Quiz', 'Drama', 'Football'];
// The form's fields, in order. `req` = required (*).
const FIELDS = [
  { id: 'surname', label: 'Surname', req: true, kind: 'text' },
  { id: 'first', label: 'First name', req: true, kind: 'text' },
  { id: 'other', label: 'Other names', kind: 'text' },
  { id: 'dob', label: 'Date of birth', hint: 'DD/MM/YYYY', req: true, kind: 'text' },
  { id: 'school', label: 'School', req: true, kind: 'text' },
  { id: 'cls', label: 'Class', req: true, kind: 'select' },
  { id: 'track', label: 'Camp track', req: true, kind: 'radio' },
  { id: 'acts', label: 'Activities', kind: 'check' },
  { id: 'guardian', label: 'Parent/guardian name', req: true, kind: 'text' },
  { id: 'phone', label: "Guardian's phone", req: true, kind: 'text' },
  { id: 'email', label: 'Email', kind: 'text' },
  { id: 'photo', label: 'Photo (JPG or PNG, max 1 MB)', kind: 'file' },
  { id: 'agree', label: 'I agree to the camp rules', req: true, kind: 'agree' },
];
const TIPS = {
  surname: 'The <b>surname</b> is the family name. Type it exactly as on the documents: capital first letter, then small letters.',
  first: 'Type the first name <b>exactly</b> as on the birth certificate: same spelling, no nickname, a capital first letter.',
  other: '<b>Other names</b> are the middle names. Not required (no *), but fill it in if the profile has one.',
  dob: 'Read the hint: <b>DD/MM/YYYY</b>, day first, as we write dates in Ghana. 4 July 2012 is 04/07/2012.',
  school: 'Write the school\'s full name, exactly as on the profile card.',
  cls: 'A <b>drop-down</b>: click and pick one. Check that the right one shows after you choose.',
  track: '<b>Radio buttons</b> (round): you can choose only <b>one</b>.',
  acts: '<b>Checkboxes</b> (square): tick <b>all</b> that apply, and nothing extra.',
  guardian: 'The parent or guardian\'s name, with their title (Mr, Mrs), exactly as on the profile.',
  phone: 'A Ghana mobile number has <b>10 digits</b> and starts with 0, e.g. 024 xxx xxxx. Count them in groups: 3 + 3 + 4.',
  email: 'An email address has <b>no spaces</b> and every letter right. A wrong email means no confirmation.',
};
const FILES = [
  { name: 'Photo_BIG.jpg', size: '3.2 MB', ok: false, why: 'too big: <b>3.2 MB</b>, and the limit is <b>1 MB</b>. Make a smaller copy first (ask your mentor), never use someone else\'s photo.' },
  { name: 'Birth_Certificate.docx', size: '85 KB', ok: false, why: 'the wrong <b>format</b>: a .docx Word file. This field wants a photo: <b>JPG or PNG</b>.' },
  { name: 'PHOTO', size: '240 KB', ok: true },
];

// ---------- Checking ----------
const digits = (s) => s.replace(/\s+/g, '');
function formatError(id, v) {
  if (id === 'dob') {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
    if (!m || +m[1] < 1 || +m[1] > 31 || +m[2] < 1 || +m[2] > 12) return 'Use the format DD/MM/YYYY';
  }
  if (id === 'phone' && !/^0\d{9}$/.test(digits(v))) return 'Enter a 10-digit number starting with 0';
  if (id === 'email' && v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
  return '';
}
function rightValue(P, id, v) {
  if (id === 'phone') return digits(v) === digits(P.phone);
  if (id === 'email') return v.trim().toLowerCase() === P.email;
  if (id === 'guardian') return v.trim().replace(/^(Mrs?)\./, '$1') === P.guardian;
  if (id === 'acts') return v.length === P.acts.length && P.acts.every((a) => v.includes(a));
  if (id === 'agree') return v === true;
  if (id === 'photo') return !!v && v.ok;
  return String(v).trim() === P[id];
}

// ---------- Drawing the laptop screen (a 640 × 400 grid) ----------
function drawForm(g, W, H, s) {
  const P = s.P;
  g.save();
  g.scale(W / 640, H / 400);
  W = 640;
  H = 400;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#f4f0f6';
  g.fillRect(0, 0, W, H);
  // Browser bar with the padlock.
  g.fillStyle = '#24182e';
  g.fillRect(0, 0, W, 30);
  g.fillStyle = '#efeaf2';
  g.beginPath(); g.roundRect(70, 6, 500, 19, 9.5); g.fill();
  g.fillStyle = '#2a9d8f';
  g.fillRect(80, 13, 8, 7);
  g.strokeStyle = '#2a9d8f';
  g.lineWidth = 1.6;
  g.beginPath(); g.arc(84, 13, 3, Math.PI, 0); g.stroke();
  g.fillStyle = '#24182e';
  g.font = font(11, 600);
  g.fillText(`https://${P.url}`, 96, 16);
  ['#ca1f3f', '#ffbe00', '#2ec4b6'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(14 + k * 14, 15, 4.5, 0, 7); g.fill(); });
  if (s.done) {
    // The confirmation page.
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(90, 60, 460, 290, 12); g.fill();
    g.fillStyle = '#5a4470';
    g.fillRect(90, 60, 460, 10);
    g.fillStyle = '#2a9d8f';
    g.beginPath(); g.arc(320, 120, 26, 0, 7); g.fill();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(307, 121); g.lineTo(317, 131); g.lineTo(334, 110); g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#24182e';
    g.font = font(22, 700);
    g.fillText('Registration received', 320, 172);
    g.font = font(14, 500);
    g.fillText('Your practice reference is', 320, 206);
    g.fillStyle = '#fff3c4';
    g.beginPath(); g.roundRect(220, 220, 200, 40, 8); g.fill();
    g.fillStyle = '#24182e';
    g.font = font(24, 800);
    g.fillText(P.ref, 320, 241);
    g.font = font(13, 500);
    g.fillStyle = '#5a4470';
    g.fillText('Please save or print this page.', 320, 285);
    g.fillText(s.saved ? `✔ Saved: ${s.saved}` : 'Ctrl + P › Save as PDF', 320, 315);
    g.restore();
    return;
  }
  // The form.
  g.fillStyle = '#ffffff';
  g.beginPath(); g.roundRect(14, 38, W - 28, H - 46, 8); g.fill();
  g.fillStyle = '#5a4470';
  g.fillRect(14, 38, W - 28, 6);
  g.fillStyle = '#24182e';
  g.font = font(15, 800);
  g.fillText(P.title, 28, 60, W - 150);
  g.fillStyle = '#ca1f3f';
  g.font = font(10, 600);
  g.textAlign = 'right';
  g.fillText('* = required', W - 28, 60);
  g.textAlign = 'left';
  const colX = [28, 334];
  const rowH = 46;
  FIELDS.forEach((f, i) => {
    const col = i < 7 ? 0 : 1;
    const x = colX[col];
    const y = 76 + (col ? i - 7 : i) * rowH;
    const w = 278;
    const v = s.values[f.id];
    const err = s.errors[f.id];
    const focus = s.focus === f.id;
    g.font = font(10.5, 700);
    g.fillStyle = '#24182e';
    g.fillText(f.label, x, y + 6, w - 10);
    if (f.req) {
      const lw = Math.min(g.measureText(f.label).width, w - 10);
      g.fillStyle = '#ca1f3f';
      g.fillText('*', x + lw + 3, y + 6);
    }
    const by = y + 13;
    g.lineWidth = focus ? 2.4 : 1.2;
    g.strokeStyle = err ? '#ca1f3f' : focus ? '#5a4470' : '#b7adc0';
    g.font = font(12, 500);
    g.fillStyle = '#24182e';
    if (f.kind === 'text' || f.kind === 'select' || f.kind === 'file') {
      g.beginPath(); g.roundRect(x, by, w, 20, 4); g.stroke();
      let t = f.kind === 'file' ? (v ? v.name : 'Choose file · No file chosen') : v || '';
      if (!t && f.hint) { g.fillStyle = '#9b91a4'; t = f.hint; }
      if (f.kind === 'select' && !v) { g.fillStyle = '#9b91a4'; t = 'Choose'; }
      while (t.length > 2 && g.measureText(t).width > w - 26) t = t.slice(0, -1);
      g.fillText(t, x + 7, by + 10.5);
      if (f.kind === 'select') { g.fillStyle = '#24182e'; g.fillText('▾', x + w - 15, by + 10); }
    } else if (f.kind === 'radio' || f.kind === 'check') {
      const opts = f.kind === 'radio' ? TRACKS : ACTS;
      let ox = x;
      g.font = font(11, 500);
      for (const o of opts) {
        const on = f.kind === 'radio' ? v === o : v.includes(o);
        g.strokeStyle = err ? '#ca1f3f' : '#5a4470';
        g.lineWidth = 1.4;
        g.beginPath();
        if (f.kind === 'radio') g.arc(ox + 6, by + 10, 5.5, 0, 7);
        else g.roundRect(ox + 0.5, by + 4.5, 11, 11, 2);
        g.stroke();
        if (on) {
          g.fillStyle = '#5a4470';
          g.beginPath();
          if (f.kind === 'radio') g.arc(ox + 6, by + 10, 3, 0, 7);
          else g.roundRect(ox + 2.5, by + 6.5, 7, 7, 1);
          g.fill();
        }
        g.fillStyle = '#24182e';
        g.fillText(o, ox + 15, by + 10.5);
        ox += g.measureText(o).width + 26;
      }
    } else if (f.kind === 'agree') {
      g.strokeStyle = err ? '#ca1f3f' : '#5a4470';
      g.lineWidth = 1.4;
      g.beginPath(); g.roundRect(x + 0.5, by + 4.5, 11, 11, 2); g.stroke();
      if (v) { g.fillStyle = '#5a4470'; g.beginPath(); g.roundRect(x + 2.5, by + 6.5, 7, 7, 1); g.fill(); }
      g.fillStyle = '#24182e';
      g.fillText('Yes, I agree', x + 17, by + 10.5);
    }
    if (err) {
      g.fillStyle = '#ca1f3f';
      g.font = font(9.5, 700);
      g.fillText(`⚠ ${err}`, x, by + 28, w);
    }
  });
  // Submit, once.
  g.fillStyle = s.sending ? '#9b91a4' : '#ca1f3f';
  g.beginPath(); g.roundRect(334, 76 + 6 * rowH + 10, 120, 28, 14); g.fill();
  g.fillStyle = '#ffffff';
  g.font = font(13, 700);
  g.textAlign = 'center';
  g.fillText(s.sending ? 'Sending…' : 'Submit', 394, 76 + 6 * rowH + 24.5);
  g.restore();
}
function drawProfile(g, W, H, P) {
  g.fillStyle = '#fffdf6';
  g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
  g.fillStyle = '#5a4470';
  g.beginPath(); g.roundRect(0, 0, W, H * 0.17, [18, 18, 0, 0]); g.fill();
  g.fillStyle = '#ffffff';
  g.font = font(H * 0.07, 800);
  g.textBaseline = 'middle';
  g.fillText('🪪 FICTIONAL PUPIL PROFILE', W * 0.05, H * 0.085);
  // A cartoon avatar, never a real child's photo.
  g.fillStyle = '#e6e1ea';
  g.fillRect(W * 0.05, H * 0.23, W * 0.22, H * 0.4);
  g.fillStyle = '#8a5c00';
  g.beginPath(); g.arc(W * 0.16, H * 0.36, W * 0.055, 0, 7); g.fill();
  g.beginPath(); g.ellipse(W * 0.16, H * 0.58, W * 0.09, H * 0.1, 0, Math.PI, 0); g.fill();
  const rows = [['Name', `${P.first} ${P.other} ${P.surname}`], ['Surname', P.surname], ['Born', P.dobLong], ['Class', `${P.cls} · ${P.track}`], ['Guardian', P.guardian], ['Phone', P.phone], ['Email', P.email]];
  rows.forEach(([k, v], i) => {
    const y = H * (0.25 + i * 0.105);
    g.fillStyle = '#5a4470';
    g.font = font(H * 0.055, 700);
    g.fillText(k, W * 0.31, y);
    g.fillStyle = '#24182e';
    g.font = font(H * 0.06, 600);
    g.fillText(v, W * 0.47, y, W * 0.5);
  });
  g.fillStyle = '#ca1f3f';
  g.font = font(H * 0.05, 700);
  g.fillText('PRACTICE ONLY · not a real person', W * 0.05, H * 0.95);
}

export default function formLab(stage, ui) {
  const { scene } = stage;
  const sess = pageSession();
  const P = PROFILES[sess] ?? PROFILES[14];
  const photoFile = (f) => (f.name === 'PHOTO' ? { ...f, name: P.photo } : f);
  const files = FILES.map(photoFile);

  // ---------- The desk ----------
  const top = rbox(8.4, 0.18, 3.6, 0x9a6b3f, 0.05);
  top.position.set(0, 1.4, 0);
  scene.add(top);
  for (const [x, z] of [[-3.9, -1.55], [3.9, -1.55], [-3.9, 1.55], [3.9, 1.55]]) {
    const leg = rbox(0.18, 1.4, 0.18, 0x7d5733, 0.04);
    leg.position.set(x, 0.7, z);
    scene.add(leg);
  }
  const D = 1.49;
  // A kente table runner under the laptop.
  const runner = decal(4.8, 1.2, (g, W, H) => {
    const cols = ['#ffbe00', '#2a7d4f', '#ca1f3f', '#24182e'];
    for (let i = 0; i < 16; i++) {
      g.fillStyle = cols[i % 4];
      g.fillRect((i * W) / 16, 0, W / 16 + 1, H);
      g.fillStyle = cols[(i + 2) % 4];
      for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect((i * W) / 16 + W / 64, (j * H) / 4 + H / 16, W / 32, H / 8);
    }
  }, { px: 128, transparent: false });
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, D + 0.003, 1.1);
  scene.add(runner);

  // ---------- The laptop ----------
  const laptop = new THREE.Group();
  laptop.position.set(0, D, 0.1);
  const base = rbox(4.6, 0.14, 2.6, 0xc9c3cf, 0.05, { metalness: 0.3 });
  base.position.set(0, 0.07, 0.4);
  const keys = decal(4.0, 1.3, (g, W, H) => {
    g.fillStyle = '#3b3f46';
    const kw = W / 15;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) {
      if (r === 4 && c > 3 && c < 10) continue;
      g.beginPath(); g.roundRect(kw * 0.55 + c * kw, H * 0.04 + r * H * 0.19, kw * 0.82, H * 0.15, 4); g.fill();
    }
    g.beginPath(); g.roundRect(kw * 4.55, H * 0.8, kw * 5.8, H * 0.15, 4); g.fill();
    g.fillStyle = '#ffffff';
    g.font = font(H * 0.055, 600);
    g.fillText('Caps', kw * 0.62, H * 0.5);
    g.fillText('Tab', kw * 0.62, H * 0.31);
  }, { px: 192 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.142, 0.05);
  const pad = rbox(1.3, 0.01, 0.65, 0xb5aebb, 0.01);
  pad.position.set(0, 0.145, 1.25);
  // The Caps Lock light, which comes on if the pupil types with Caps Lock on.
  const caps = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.04), mat(0x555555, { emissive: 0x000000 }));
  caps.position.set(-1.83, 0.16, 0.0);
  caps.userData.noInk = true;
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.14, -0.86);
  hinge.rotation.x = -0.22;
  const lid = rbox(4.6, 2.9, 0.12, 0x3b3f46, 0.05);
  lid.position.y = 1.45;
  // The form as the helper left it: some fields right, four planted mistakes, the rest empty.
  const startValues = () => ({ surname: P.surname, first: P.planted.first, other: '', dob: P.planted.dob, school: '', cls: P.cls, track: '', acts: [], guardian: '', phone: P.planted.phone, email: P.planted.email, photo: null, agree: false });
  const state = { P, values: startValues(), errors: {}, focus: null, done: false, sending: false, saved: '' };
  const screen = decal(4.36, 2.725, (g, W, H) => drawForm(g, W, H, state), { px: 720, transparent: false });
  screen.position.set(0, 1.47, 0.062);
  hinge.add(lid, screen);
  laptop.add(base, keys, pad, caps, hinge);
  scene.add(laptop);
  function redraw() {
    const c = screen.material.map.image;
    drawForm(c.getContext('2d'), c.width, c.height, state);
    screen.material.map.needsUpdate = true;
  }

  // ---------- The profile card in a stand ----------
  const card = new THREE.Group();
  card.position.set(-3.25, D, 0.3);
  card.rotation.y = 0.35;
  const holder = rbox(1.9, 0.12, 0.4, 0x24182e, 0.03);
  holder.position.y = 0.06;
  const plate = rbox(1.9, 1.24, 0.05, 0xffffff, 0.04);
  plate.position.set(0, 0.72, -0.05);
  plate.rotation.x = -0.18;
  const face = decal(1.84, 1.18, (g, W, H) => drawProfile(g, W, H, P), { px: 256, transparent: false });
  face.position.set(0, 0.72, -0.02);
  face.rotation.x = -0.18;
  card.add(holder, plate, face);
  scene.add(card);

  // ---------- Three files to upload, lying on the desk ----------
  const fileGroups = files.map((f, i) => {
    const g = new THREE.Group();
    g.position.set(-3.55 + i * 0.68, D + 0.01, 1.35);
    g.rotation.y = (i - 1) * 0.12;
    const paper = rbox(0.58, 0.03, 0.74, 0xffffff, 0.01);
    const look = decal(0.52, 0.68, (c, W, H) => {
      const pic = f.name.endsWith('.jpg');
      c.fillStyle = pic ? '#bfe3f2' : '#dbe4f7';
      c.fillRect(0, 0, W, H * 0.62);
      if (pic) {
        c.fillStyle = '#8a5c00';
        c.beginPath(); c.arc(W / 2, H * 0.26, W * 0.13, 0, 7); c.fill();
        c.beginPath(); c.ellipse(W / 2, H * 0.62, W * 0.25, H * 0.17, 0, Math.PI, 0); c.fill();
      } else {
        c.fillStyle = '#1d3d8f';
        c.font = font(H * 0.2, 800);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('W', W / 2, H * 0.31);
      }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#24182e';
      c.font = font(H * 0.1, 800);
      c.fillText(f.name.split('.').pop().toUpperCase(), W / 2, H * 0.73);
      c.fillStyle = f.ok ? '#2a7d4f' : '#ca1f3f';
      c.font = font(H * 0.1, 700);
      c.fillText(f.size, W / 2, H * 0.88);
    }, { px: 96, transparent: false });
    look.rotation.x = -Math.PI / 2;
    look.position.y = 0.017;
    g.add(paper, look);
    scene.add(g);
    stage.clickable(g, () => chooseFile(i));
    return g;
  });

  // ---------- A printer, a folder for the PDF, and the form's server ----------
  const printer = new THREE.Group();
  printer.position.set(3.25, D, -0.2);
  printer.rotation.y = -0.3;
  const pBody = rbox(1.5, 0.6, 1.1, 0xe9e4ec, 0.06);
  pBody.position.y = 0.3;
  const pTop = rbox(1.2, 0.06, 0.5, 0x5a4470, 0.02);
  pTop.position.set(0, 0.63, -0.2);
  const pTray = rbox(1.0, 0.04, 0.5, 0xd9d3de, 0.02);
  pTray.position.set(0, 0.2, 0.75);
  const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), mat(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 1 }));
  pLed.position.set(0.55, 0.45, 0.555);
  pLed.userData.noInk = true;
  const paperOut = rbox(0.8, 0.012, 0.9, 0xffffff, 0.005);
  paperOut.position.set(0, 0.24, 0.5);
  paperOut.visible = false;
  printer.add(pBody, pTop, pTray, pLed, paperOut);
  scene.add(printer);
  const folder = new THREE.Group();
  folder.position.set(3.2, D, 1.25);
  folder.rotation.y = -0.2;
  const fBack = rbox(1.3, 0.04, 0.9, 0xe0a93a, 0.02);
  fBack.position.y = 0.02;
  const fTab = rbox(0.45, 0.04, 0.15, 0xe0a93a, 0.02);
  fTab.position.set(-0.4, 0.02, -0.5);
  const fFront = rbox(1.3, 0.04, 0.75, 0xf2c75c, 0.02);
  fFront.position.set(0, 0.07, 0.07);
  const fSign = decal(1.1, 0.4, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = font(H * 0.34, 800);
    g.fillText('BIH_TechClub', W / 2, H * 0.4);
    g.font = font(H * 0.2, 600);
    g.fillText('Documents', W / 2, H * 0.78);
  }, { px: 96 });
  fSign.rotation.x = -Math.PI / 2;
  fSign.position.set(0, 0.093, 0.1);
  const pdf = rbox(0.5, 0.02, 0.66, 0xffffff, 0.01);
  pdf.position.set(0.2, 0.06, -0.1);
  pdf.visible = false;
  folder.add(fBack, fTab, pdf, fFront, fSign);
  scene.add(folder);
  const server = new THREE.Group();
  server.position.set(5.2, 0, -2.4);
  server.rotation.y = -0.4;
  const rack = rbox(1.2, 2.4, 1.0, 0x2c2433, 0.05);
  rack.position.y = 1.2;
  const rackFace = decal(1.05, 2.2, (c, W, H) => {
    for (let u = 0; u < 5; u++) {
      c.fillStyle = '#4a3f56';
      c.beginPath(); c.roundRect(W * 0.04, H * (0.03 + u * 0.19), W * 0.92, H * 0.16, 8); c.fill();
      c.fillStyle = u % 2 ? '#2ec4b6' : '#ffbe00';
      c.fillRect(W * 0.8, H * (0.07 + u * 0.19), W * 0.08, H * 0.05);
      c.fillStyle = '#1b1520';
      for (let k = 0; k < 5; k++) c.fillRect(W * 0.12, H * (0.06 + u * 0.19 + k * 0.022), W * 0.5, H * 0.01);
    }
  }, { px: 128 });
  rackFace.position.set(0, 1.2, 0.502);
  server.add(rack, rackFace);
  scene.add(server);
  const serverTag = label('Form server', { scale: 0.55 });
  serverTag.position.set(0, 2.75, 0);
  server.add(serverTag);
  // A cup of tea with Ghana's colours.
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.36, 18), mat(COLORS.red));
  mug.position.set(-2.2, D + 0.18, -1.15);
  const mugBand = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.09, 18), mat(COLORS.gold));
  mugBand.position.copy(mug.position);
  mugBand.userData.noInk = true;
  scene.add(mug, mugBand);

  // ---------- Callout cards (most important first: phones show four) ----------
  const cards = {
    profile: stage.callout(face, { icon: '🪪', title: 'Profile card', text: 'Copy every detail letter for letter', at: [0, 0.6, 0], dx: -30, dy: -90, onClick: () => explain('profile') }),
    req: stage.callout(screen, { icon: '⭐', title: 'Red star *', text: 'A * field must be filled in', at: [1.95, 1.0, 0], dx: 90, dy: -90, onClick: () => explain('req') }),
    upload: stage.callout(fileGroups[0], { icon: '📎', title: 'Upload rules', text: 'Check the format and the size', at: [0, 0.05, 0.35], dx: -90, dy: 110, onClick: () => explain('upload') }),
    submit: stage.callout(screen, { icon: '📨', title: 'Submit once', text: 'Press once, then wait', at: [0.0, -0.53, 0], dx: 190, dy: 110, onClick: () => explain('submit') }),
    proof: stage.callout(printer, { icon: '🧾', title: 'Keep proof', text: 'Save or print the confirmation', at: [0, 0.65, 0], dx: 60, dy: -95, onClick: () => explain('proof') }),
    caps: stage.callout(caps, { icon: '🔠', title: 'Caps Lock light', text: 'On? Everything comes out in CAPITALS', at: [0, 0, 0], dx: 30, dy: 215, onClick: () => explain('caps') }),
  };
  const ABOUT = {
    profile: ['🪪 The profile card', `<p>This is a <b>made-up pupil</b>, ${esc(P.first)} ${esc(P.surname)}, so no real personal details go online. Copy every detail <b>letter for letter</b>: the computer is a very strict clerk and saves exactly what you type.</p>`],
    req: ['⭐ The red star *', '<p>A field marked <b>*</b> is <b>required</b>. Leave it empty and the form will not send: it shows a red message such as <b>"This is a required question"</b>. Fill it in and press Submit again.</p>'],
    upload: ['📎 Upload rules', '<p>Read the rules first: <b>format</b> (photos are usually JPG or PNG, documents PDF) and <b>size</b> (e.g. max 1 MB; remember KB and MB from Session 6). Click a file on the desk, or a file button, to attach it.</p>'],
    submit: ['📨 Submit once', '<p>Do the final check, then press <b>Submit once</b>. If the page is slow, <b>wait</b>: pressing again and again can send two copies.</p>'],
    proof: ['🧾 Keep the proof', '<p>After Submit, write down the <b>reference number</b>. Then save the page: <b>Ctrl + P › Save as PDF</b> (or print it), or take a screenshot with <b>Win + Shift + S</b>.</p>'],
    caps: ['🔠 Caps Lock', '<p>If the <b>Caps Lock</b> light is on, everything comes out in CAPITALS. Check the light before you type a form. Start each name with a capital letter, then small letters.</p>'],
  };
  function explain(k) { ui.info(...ABOUT[k]); }
  stage.clickable(card, () => explain('profile'));
  stage.clickable(printer, () => (state.done ? print() : explain('proof')));
  stage.clickable(laptop, () => explain('req'));

  // ---------- Side panel ----------
  const profBox = ui.element(`<details open><summary><b>🪪 Profile card (practice only)</b></summary><div class="mail-card" style="margin-top:6px">
    <div class="mail-row"><span>Surname</span> ${esc(P.surname)}</div><div class="mail-row"><span>First</span> ${esc(P.first)}</div><div class="mail-row"><span>Other</span> ${esc(P.other)}</div>
    <div class="mail-row"><span>Born</span> ${esc(P.dobLong)}</div><div class="mail-row"><span>School</span> ${esc(P.school)}</div><div class="mail-row"><span>Class</span> ${esc(P.cls)}</div>
    <div class="mail-row"><span>Track</span> ${esc(P.track)}</div><div class="mail-row"><span>Activities</span> ${esc(P.acts.join(' and '))}</div>
    <div class="mail-row"><span>Guardian</span> ${esc(P.guardian)}</div><div class="mail-row"><span>Phone</span> ${esc(P.phone)} (practice)</div>
    <div class="mail-row"><span>Email</span> ${esc(P.email)}</div><div class="mail-row"><span>Photo</span> ${esc(P.photo)}</div></div></details>`);
  profBox.querySelectorAll('.mail-row span').forEach((s) => (s.style.width = '78px'));
  const formBox = ui.group('The form');
  const doneBox = ui.group('');
  const inputs = {};
  let capsWarned = false;
  let caught = false;
  let complete = false;
  let submits = 0;

  function fresh() {
    state.values = startValues();
    state.perfect = state.refOk = state.savedOk = false;
    state.errors = {};
    state.done = false;
    state.sending = false;
    state.saved = '';
    submits = 0;
    caught = false;
    complete = false;
    paperOut.visible = false;
    pdf.visible = false;
    fileGroups.forEach((g) => (g.visible = true));
  }
  function buildForm() {
    formBox.innerHTML = '<span class="lab-group-title">The form</span>';
    doneBox.innerHTML = '';
    for (const f of FIELDS) {
      const v = state.values[f.id];
      const star = f.req ? ' <span style="color:var(--red)">*</span>' : '';
      let el;
      if (f.kind === 'text') {
        el = ui.element(`<label class="lab-field inline-field"><span>${esc(f.label)}${star}</span><input type="text" autocomplete="off" spellcheck="false"${f.hint ? ` placeholder="${f.hint}"` : ''}></label>`, formBox);
        const inp = el.querySelector('input');
        inp.value = v;
        inp.addEventListener('input', () => change(f.id, inp.value));
        inp.addEventListener('keyup', (e) => capsCheck(e));
        inp.addEventListener('focus', () => focus(f.id));
        inputs[f.id] = inp;
      } else if (f.kind === 'select') {
        el = ui.element(`<label class="lab-field inline-field"><span>${esc(f.label)}${star}</span><select><option value="">Choose</option>${CLASSES.map((c) => `<option>${c}</option>`).join('')}</select></label>`, formBox);
        const sel = el.querySelector('select');
        sel.value = v;
        sel.addEventListener('change', () => change(f.id, sel.value));
        sel.addEventListener('focus', () => focus(f.id));
        inputs[f.id] = sel;
      } else if (f.kind === 'radio' || f.kind === 'check') {
        const opts = f.kind === 'radio' ? TRACKS : ACTS;
        el = ui.element(`<fieldset class="lab-field" style="border:0;padding:0;margin:0"><legend style="font-weight:600;padding:0">${esc(f.label)}${star}</legend>${opts.map((o) => `<label style="display:inline-flex;gap:5px;align-items:center;margin:4px 12px 0 0;font-weight:500"><input type="${f.kind === 'radio' ? 'radio' : 'checkbox'}" name="ff-${f.id}" value="${o}" style="width:auto;margin:0">${o}</label>`).join('')}</fieldset>`, formBox);
        el.querySelectorAll('input').forEach((inp) => {
          inp.checked = f.kind === 'radio' ? v === inp.value : v.includes(inp.value);
          inp.addEventListener('change', () => {
            const on = [...el.querySelectorAll('input:checked')].map((x) => x.value);
            change(f.id, f.kind === 'radio' ? on[0] ?? '' : on);
          });
          inp.addEventListener('focus', () => focus(f.id));
        });
      } else if (f.kind === 'file') {
        el = ui.element(`<div class="lab-field"><span style="font-weight:600">${esc(f.label)}</span><div class="ff-file" style="margin:4px 0;font-size:13px;color:var(--muted)">No file chosen</div></div>`, formBox);
        const row = ui.group('');
        el.appendChild(row);
        files.forEach((file, i) => ui.button(`📄 ${file.name} · ${file.size}`, () => chooseFile(i), { group: row }));
        inputs.photo = el.querySelector('.ff-file');
      } else if (f.kind === 'agree') {
        el = ui.element(`<label class="lab-field" style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" style="width:auto;margin:0"> ${esc(f.label)}${star}</label>`, formBox);
        const inp = el.querySelector('input');
        inp.checked = v;
        inp.addEventListener('change', () => change('agree', inp.checked));
        inp.addEventListener('focus', () => focus('agree'));
      }
      const err = ui.element('<small class="ff-err" style="color:var(--red);font-weight:700;display:none" aria-live="polite"></small>', formBox);
      err.dataset.for = f.id;
    }
    const row = ui.group('');
    formBox.appendChild(row);
    ui.button('👀 Partner check', () => partnerCheck(), { group: row });
    ui.button('📨 Submit', () => submit(), { primary: true, group: row });
    ui.button('↺ New form', () => { if (state.sending) return; fresh(); buildForm(); redraw(); intro(); }, { group: row });
    showErrors();
  }
  function showErrors() {
    formBox.querySelectorAll('.ff-err').forEach((el) => {
      const e = state.errors[el.dataset.for];
      el.textContent = e ? `⚠ ${e}` : '';
      el.style.display = e ? 'block' : 'none';
    });
  }
  function focus(id) {
    state.focus = id;
    redraw();
    if (TIPS[id]) ui.info(`✏️ ${FIELDS.find((f) => f.id === id).label}`, `<p>${TIPS[id]}</p>`);
  }
  function capsCheck(e) {
    const on = e.getModifierState?.('CapsLock');
    caps.material.emissive.setHex(on ? 0x2ec4b6 : 0x000000);
    caps.material.color.setHex(on ? 0x2ec4b6 : 0x555555);
    if (on && !capsWarned) {
      capsWarned = true;
      ui.info('🔠 Caps Lock is on!', '<p>The Caps Lock light on the keyboard is on, so letters come out in CAPITALS. Press <b>Caps Lock</b> once to turn it off, then fix what you typed.</p>');
    }
    if (!on) capsWarned = false;
  }
  function change(id, v) {
    if (state.done) return;
    state.values[id] = v;
    if (state.errors[id]) {
      // A red message clears once the field is fixed.
      const f = FIELDS.find((x) => x.id === id);
      const empty = v === '' || v === false || (Array.isArray(v) && !v.length) || v === null;
      if (!(f.req && empty) && !formatError(id, String(v))) delete state.errors[id];
      showErrors();
    }
    redraw();
    progress();
  }
  // Mission checks, as the pupil works.
  function progress() {
    const V = state.values;
    if (!caught && ['first', 'dob', 'phone', 'email'].every((id) => rightValue(P, id, V[id]))) {
      caught = true;
      ui.complete('mistakes');
      ui.info('🕵🏾 All 4 mistakes caught!', `<p>You fixed every planted mistake before Submit:</p><ul><li><b>${esc(P.first)}</b> with a capital letter</li><li>the date in <b>DD/MM/YYYY</b> order: ${esc(P.dob)}</li><li>a <b>10-digit</b> phone number</li><li>an email with <b>no space</b></li></ul><p>Next: fill the empty fields, including every <b>*</b>, and attach the photo.</p>`);
    }
    if (!complete && FIELDS.every((f) => rightValue(P, f.id, V[f.id]))) {
      complete = true;
      ui.complete('complete');
      ui.info('✅ Every field matches the profile', `<p>Every <b>*</b> field is filled, every detail matches the profile card, and the photo meets the rules. Do one last check, then press <b>📨 Submit</b> once.</p>`);
    }
  }
  function chooseFile(i) {
    if (state.done) return;
    const f = files[i];
    stage.reveal();
    if (!f.ok) {
      state.values.photo = null;
      state.errors.photo = f.name.endsWith('.docx') ? 'Wrong file type: JPG or PNG only' : 'File too big: max 1 MB';
      if (inputs.photo) inputs.photo.textContent = 'No file chosen';
      ui.info('📎 That file was not attached', `<p><b>${esc(f.name)}</b> is ${f.why}</p>`);
    } else {
      state.values.photo = f;
      delete state.errors.photo;
      if (inputs.photo) inputs.photo.textContent = `📎 ${f.name} (${f.size})`;
      ui.info('📎 Photo attached', `<p><b>${esc(f.name)}</b> is a <b>JPG</b> of <b>${f.size}</b>: the right format and under 1 MB. Check that its name appears on the form.</p>`);
      const g = fileGroups[i];
      const from = g.position.clone();
      const to = screen.localToWorld(new THREE.Vector3(1.6, -0.6, 0.3));
      stage.tween((k) => {
        g.position.lerpVectors(from, to, k);
        g.position.y += Math.sin(k * Math.PI) * 0.6;
        g.scale.setScalar(1 - k * 0.8);
      }, 0.6).then(() => { g.visible = false; g.position.copy(from); g.scale.setScalar(1); });
    }
    showErrors();
    redraw();
    progress();
  }
  function partnerCheck() {
    if (state.done) return;
    const wrong = FIELDS.filter((f) => !rightValue(P, f.id, state.values[f.id])).map((f) => f.label);
    ui.info('👀 Partner check', wrong.length ? `<p>Your partner compared the form with the profile card. These fields do <b>not</b> match yet:</p><ul>${wrong.map((w) => `<li>${esc(w)}</li>`).join('')}</ul><p>They won't tell you the answer: look at the card and fix each one.</p>` : '<p>Your partner checked every field against the profile card: <b>zero errors</b>. Press <b>📨 Submit</b> once.</p>');
  }

  // ---------- Submit, once ----------
  async function submit() {
    if (state.done) return;
    if (state.sending) {
      submits++;
      ui.info('⏳ Wait, it is sending', '<p>You pressed Submit again. <b>Press once, then wait.</b> Pressing again and again can send two copies of the form (duplicate rows for the people who read it).</p>');
      return;
    }
    // The strict clerk: required fields and formats first.
    const errs = {};
    for (const f of FIELDS) {
      const v = state.values[f.id];
      const empty = v === '' || v === false || v === null || (Array.isArray(v) && !v.length);
      if (f.req && empty) errs[f.id] = 'This is a required question';
      else if (!empty && f.kind === 'text') {
        const e = formatError(f.id, v);
        if (e) errs[f.id] = e;
      }
    }
    if (state.errors.photo) errs.photo = state.errors.photo;
    state.errors = errs;
    showErrors();
    redraw();
    stage.reveal();
    const list = Object.keys(errs);
    if (list.length) {
      const req = list.filter((k) => errs[k] === 'This is a required question').length;
      ui.info('⚠️ The form did not send', `<p>The form found <b>${list.length}</b> problem${list.length === 1 ? '' : 's'} (see the red messages):</p><ul>${list.map((k) => `<li><b>${esc(FIELDS.find((f) => f.id === k).label)}</b>: ${esc(errs[k])}</li>`).join('')}</ul>${req ? '<p>A <b>*</b> field cannot be left empty. ' : '<p>'}Fix them, then press Submit again.</p><p>Careful: the form only catches <b>some</b> mistakes. It cannot tell that a name is spelt wrongly.</p>`);
      return;
    }
    state.sending = true;
    submits = 1;
    redraw();
    ui.info('📨 Sending…', '<p>The form travels to the server. <b>Press once, then wait.</b></p>');
    const env = rbox(0.5, 0.06, 0.34, 0xffffff, 0.02);
    const from = screen.localToWorld(new THREE.Vector3(0, 0, 0.3));
    const to = server.localToWorld(new THREE.Vector3(0, 2.0, 0.6));
    scene.add(env);
    await stage.tween((k) => {
      env.position.lerpVectors(from, to, k);
      env.position.y += Math.sin(k * Math.PI) * 1.2;
      env.rotation.y = k * 3;
    }, 1.6);
    scene.remove(env);
    env.geometry.dispose();
    state.sending = false;
    state.done = true;
    redraw();
    const wrong = FIELDS.filter((f) => !rightValue(P, f.id, state.values[f.id]));
    state.perfect = !wrong.length;
    formBox.innerHTML = '<span class="lab-group-title">The form</span><p class="crack">Sent. The answers cannot be changed now.</p>';
    showDone(wrong);
  }
  function showDone(wrong) {
    doneBox.innerHTML = '<span class="lab-group-title">Confirmation: keep the proof</span>';
    if (wrong.length) {
      ui.info('😬 Received, mistakes and all', `<p>The form was received, but the strict clerk saved <b>exactly</b> what was typed. These do not match the profile card:</p><ul>${wrong.map((f) => `<li><b>${esc(f.label)}</b>${f.kind === 'text' ? `: "${esc(state.values[f.id])}"` : ''}</li>`).join('')}</ul><p>A mistake like this could be printed on a certificate. Press <b>↺ New form</b> and aim for <b>zero errors</b>: check every field before Submit.</p>`);
      ui.button('↺ New form', () => { fresh(); buildForm(); redraw(); intro(); }, { primary: true, group: doneBox });
      return;
    }
    ui.info('🎉 Registration received', `<p>Zero errors! The confirmation page shows your reference: <b>${esc(P.ref)}</b>.</p><p>Now keep the proof: <b>write the reference down</b>, then <b>Ctrl + P › Save as PDF</b> into the right folder.</p>`);
    const field = ui.element('<label class="lab-field">📝 Write down the reference<input type="text" autocomplete="off" spellcheck="false" placeholder="e.g. ABC-123"></label>', doneBox);
    const inp = field.querySelector('input');
    const refRow = ui.group('');
    doneBox.appendChild(refRow);
    ui.button('✔ Check what I wrote', () => {
      const ok = inp.value.trim().toUpperCase() === P.ref;
      state.refOk = ok;
      ui.info(ok ? '📝 Written down' : '📝 Check it again', ok ? `<p><b>${esc(P.ref)}</b>: exactly right. Keep it safe: you may need it if anything goes wrong.</p>` : '<p>That does not match the reference on the screen. Copy it letter for letter, including the dashes.</p>');
      finish();
    }, { group: refRow });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); refRow.querySelector('button').click(); } });
    const pr = ui.element('<span class="lab-group-title">Ctrl + P › Save as PDF: choose the folder</span>', doneBox);
    pr.style.marginTop = '6px';
    const saveRow = ui.group('');
    doneBox.appendChild(saveRow);
    ui.button('📁 Downloads', () => save(false), { group: saveRow });
    ui.button(`📁 ${P.folder}`, () => save(true), { group: saveRow });
    ui.button('🖨️ Print it', () => print(), { group: saveRow });
    ui.button('↺ New form', () => { fresh(); buildForm(); redraw(); intro(); }, { group: saveRow });
  }
  async function save(right) {
    if (!state.done || !state.perfect) return;
    if (!right) {
      ui.info('📁 Saved in Downloads', `<p>It is saved, but <b>Downloads</b> is the doorway, not the room: files get lost there. Save it in <b>${esc(P.folder)}</b> as <b>${esc(P.save)}</b>.</p>`);
      return;
    }
    state.saved = `${P.folder} › ${P.save}`;
    state.savedOk = true;
    redraw();
    stage.reveal();
    pdf.visible = true;
    const from = screen.localToWorld(new THREE.Vector3(0, 0, 0.3));
    const to = folder.localToWorld(new THREE.Vector3(0.2, 0.06, -0.1));
    const local = folder.worldToLocal(from.clone());
    await stage.tween((k) => {
      pdf.position.lerpVectors(local, folder.worldToLocal(to.clone()), k);
      pdf.position.y += Math.sin(k * Math.PI) * 0.8;
    }, 0.7);
    ui.info('📄 Saved as PDF', `<p><b>${esc(P.save)}</b> is in <b>${esc(P.folder)}</b>: a clear name, in the right folder, easy to find again.</p>`);
    finish();
  }
  async function print() {
    if (!state.done || !state.perfect) return;
    stage.reveal();
    paperOut.visible = true;
    await stage.tween((k) => (paperOut.position.z = 0.1 + k * 0.4), 1.0);
    ui.info('🖨️ Printed', '<p>A paper copy is good proof too. In the club, the mission asks you to <b>save it as a PDF</b> in your folder as well.</p>');
    finish();
  }
  function finish() {
    if (state.perfect && state.refOk && state.savedOk) {
      ui.complete('proof');
      cards.proof.card.classList.add('done');
      ui.info('🏆 Form done, proof kept!', `<p>Submitted once with zero errors, the reference <b>${esc(P.ref)}</b> written down, and the confirmation saved as <b>${esc(P.save)}</b>. That is exactly how to do a real form, <b>with a trusted adult</b> beside you.</p>`);
    }
  }
  function intro() {
    ui.info('📋 Check before you submit', `<p>${esc(P.helper)} started filling in this form for <b>${esc(P.first)}</b> on a shared computer, and left <b>4 mistakes</b>. Compare every field with the <b>profile card</b> and fix them <b>before</b> you press Submit.</p><p>Then fill the empty fields (every <b>*</b> is required), attach the photo, and submit once.</p>`);
  }

  fresh();
  buildForm();
  redraw();
  intro();
  if (ui.isDone('proof')) cards.proof.card.classList.add('done');
}

export const missions = [
  { id: 'mistakes', text: 'Catch the 4 planted mistakes and fix them before you press Submit.', hint: 'Compare each field with the profile card: capital letters, the date order (DD/MM/YYYY), the number of phone digits, spaces in the email.' },
  { id: 'complete', text: 'Fill every * required field from the profile and attach a photo that meets the rules.', hint: 'Photo: JPG or PNG, max 1 MB. Activities: tick only the ones on the card. 👀 Partner check shows which fields are still wrong.' },
  { id: 'proof', text: 'Submit once, write down the reference and save the confirmation as a PDF in your folder.', hint: 'Copy the reference from the confirmation page, then Ctrl + P › Save as PDF into BIH_TechClub.' },
];

export const config = { camera: [1.6, 9.5, 11], target: [0.1, 1.7, 0.4], shadowSize: 9, frame: 0.86, minDistance: 4 };
