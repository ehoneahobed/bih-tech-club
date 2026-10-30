// Session 31 — Learning Online: a classroom that lives in the laptop.
// Pupils join "BIH Tech Club Online Class" with the code on the board, open
// the assignment, attach their notes AND press Hand in (attaching alone leaves
// it "Assigned" and the teacher's pile empty), send a private comment and read
// the returned feedback. Then they judge four tutorials on a shelf with the
// 4 checks (Who? When? Match? Second source?) and pick the best one for Kwame.
import { THREE, COLORS, mat, rbox, decal } from './runtime.js';

const CODE = 'k7bh3qe';
const CLASS = 'BIH Tech Club Online Class';
const TASK = 'Session 31: My Best Tutorial';
const DUE = 'Due Friday, 4:00 pm';
const FILE = 'TechClub_TutorialNotes_Ama.docx';
const NOTE = 'Thank you! One thing I learned: the area of a triangle is ½ × base × height.';
const FONT = 'Rubik, system-ui, sans-serif';

const CHECKS = [
  { id: 'who', name: 'Who?', q: 'Who made it? A real teacher, school or trusted organisation?' },
  { id: 'when', name: 'When?', q: 'When was it made? Is it up to date?' },
  { id: 'match', name: 'Match?', q: 'Does it match your syllabus and your level (JHS)?' },
  { id: 'second', name: 'Second source?', q: 'Does one fact agree with your textbook or teacher?' },
];
// Kwame needs the area of a triangle for his BECE revision. Each poor video fails a different check.
const VIDEOS = [
  {
    key: 'A', title: 'EASIEST MATHS TRICK EVER!!!', by: 'xXGamerBoyXx', len: '2:04', year: 2025, views: '2.4M views', bg: '#CA1F3F', fg: '#FFBE00',
    res: {
      who: [false, 'A gamer channel with a made-up name and no teaching background. Anyone can upload a video.'],
      when: [true, 'Made this year, so it is new. But new does not mean right!'],
      match: [false, 'No worked examples, lots of adverts, and it says “area = base × height”. That is not the formula in your JHS textbook.'],
      second: [false, 'Your textbook says ½ × base × height, and the comments say the answer was wrong. 2.4 million views did not make it right.'],
    },
  },
  {
    key: 'B', title: 'Areas by integration: triangles and beyond', by: 'City University Maths Lectures', len: '58:10', year: 2024, views: '41K views', bg: '#24182E', fg: '#FFFFFF',
    res: {
      who: [true, 'University lecturers: real experts.'],
      when: [true, 'Made last year, so it is up to date.'],
      match: [false, 'This is university maths (calculus), far above JHS level. It would confuse Kwame more than it helps.'],
      second: [true, 'Its answers agree with the textbook, even if the method is much harder.'],
    },
  },
  {
    key: 'C', title: 'Area of a triangle (½ × base × height)', by: "Mrs Owusu Teaches Maths (a maths teacher's channel)", short: 'Mrs Owusu Teaches Maths', len: '9:12', year: 2025, views: '18K views', bg: '#2EC4B6', fg: '#24182E',
    res: {
      who: [true, 'A real maths teacher: she gives her name and the school where she teaches.'],
      when: [true, 'Made this year, for the current syllabus.'],
      match: [true, 'Made for JHS and BECE revision, with three worked examples.'],
      second: [true, 'Its formula, ½ × base × height, is the same as in your textbook.'],
    },
  },
  {
    key: 'D', title: 'BECE Maths: Triangles (old syllabus)', by: 'Ghana Exam Prep', len: '14:30', year: 2008, views: '95K views', bg: '#5A4470', fg: '#FFBE00',
    res: {
      who: [true, 'An exam-revision channel run by teachers.'],
      when: [false, 'Made in 2008 for the old syllabus. The topics and BECE questions have changed since then, and the picture is blurry.'],
      match: [true, 'It is JHS level.'],
      second: [true, 'Its formula agrees with your textbook.'],
    },
  },
];
const BEST = 2;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A flat canvas picture that can be redrawn when its content changes.
function board(w, h, px = 256) {
  let paint = () => {};
  const m = decal(w, h, () => {}, { px });
  const tex = m.material.map;
  const c = tex.image;
  m.redraw = (fn = paint) => {
    paint = fn;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    fn(g, c.width, c.height);
    tex.needsUpdate = true;
  };
  return m;
}
function text(g, s, x, y, size, color = '#24182E', weight = 600, align = 'left', maxW) {
  g.font = `${weight} ${size}px ${FONT}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  if (maxW) {
    let px = size;
    while (g.measureText(s).width > maxW && px > 10) g.font = `${weight} ${(px -= 1)}px ${FONT}`;
  }
  g.fillText(s, x, y);
}
function wrap(g, s, x, y, size, maxW, lh, color = '#24182E', weight = 500) {
  g.font = `${weight} ${size}px ${FONT}`;
  const words = s.split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) {
      text(g, line, x, y, size, color, weight);
      y += lh;
      line = w;
    } else line = t;
  }
  if (line) text(g, line, x, y, size, color, weight);
  return y + lh;
}
function pill(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, h / 2);
  g.fill();
}

export default function classroomLab(stage, ui) {
  const { scene } = stage;

  // ---------- The room ----------
  const floor = rbox(10.8, 0.14, 6.8, 0xe8dcc8, 0.05);
  floor.position.set(0.1, -0.07, -0.1);
  scene.add(floor);
  const tiles = decal(10.6, 6.6, (g, W, H) => {
    g.strokeStyle = 'rgba(36,24,46,0.07)';
    g.lineWidth = 2;
    for (let i = 1; i < 14; i++) { g.beginPath(); g.moveTo((i * W) / 14, 0); g.lineTo((i * W) / 14, H); g.stroke(); }
    for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(0, (i * H) / 9); g.lineTo(W, (i * H) / 9); g.stroke(); }
  }, { px: 256 });
  tiles.rotation.x = -Math.PI / 2;
  tiles.position.set(0.1, 0.002, -0.1);
  scene.add(tiles);
  const back = rbox(10.8, 4.2, 0.16, 0xf4f0f6, 0.04);
  back.position.set(0.1, 2.1, -3.5);
  const side = rbox(0.16, 4.2, 6.8, 0xefe8f2, 0.04);
  side.position.set(-5.3, 2.1, -0.1);
  scene.add(back, side);
  // A kente-coloured band along the walls.
  const bandMat = mat(COLORS.gold);
  const band = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 0.04), bandMat);
  band.position.set(0.1, 0.9, -3.4);
  const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 6.8), bandMat);
  band2.position.set(-5.2, 0.9, -0.1);
  scene.add(band, band2);

  // ---------- Whiteboard: Classwork (and the class code the mentor wrote) ----------
  const wb = new THREE.Group();
  wb.position.set(-1.0, 2.35, -3.38);
  const wbFrame = rbox(3.9, 2.2, 0.08, 0x8c8794, 0.04);
  const wbFace = board(3.75, 2.05, 300);
  wbFace.position.z = 0.045;
  const tray = rbox(2.4, 0.06, 0.16, 0x8c8794, 0.02);
  tray.position.set(0, -1.12, 0.08);
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), mat(COLORS.red));
  marker.rotation.z = Math.PI / 2;
  marker.position.set(0.6, -1.07, 0.1);
  wb.add(wbFrame, wbFace, tray, marker);
  scene.add(wb);
  // A wall clock: due dates are about time.
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 28), mat(0xffffff));
  clock.rotation.x = Math.PI / 2;
  clock.position.set(1.4, 3.55, -3.38);
  const clockFace = decal(0.6, 0.6, (g, W, H) => {
    g.strokeStyle = '#24182E';
    g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(W / 2 + Math.sin(a) * W * 0.4, H / 2 - Math.cos(a) * H * 0.4); g.lineTo(W / 2 + Math.sin(a) * W * 0.46, H / 2 - Math.cos(a) * H * 0.46); g.stroke();
    }
    g.lineWidth = 9; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + W * 0.2, H / 2 + H * 0.12); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2, H * 0.12); g.stroke();
    g.fillStyle = '#CA1F3F'; g.beginPath(); g.arc(W / 2, H / 2, 8, 0, 7); g.fill();
  }, { px: 128 });
  clockFace.position.set(1.4, 3.55, -3.34);
  scene.add(clock, clockFace);

  // ---------- Noticeboard on the side wall: the Stream ----------
  const nb = new THREE.Group();
  nb.position.set(-5.2, 2.35, -0.6);
  nb.rotation.y = Math.PI / 2;
  const nbFrame = rbox(2.9, 1.9, 0.08, 0x8a5c00, 0.04);
  const nbFace = board(2.75, 1.75, 256);
  nbFace.position.z = 0.045;
  nb.add(nbFrame, nbFace);
  scene.add(nb);

  // ---------- Teacher's table with the hand-in pile ----------
  const tt = new THREE.Group();
  tt.position.set(-3.0, 0, -1.4);
  const top = rbox(2.4, 0.1, 1.1, 0xb07a4f, 0.03);
  top.position.y = 0.82;
  tt.add(top);
  const legGeo = new THREE.BoxGeometry(0.09, 0.78, 0.09);
  const legMat = mat(0x6e4a2f);
  for (const [x, z] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.39, z);
    leg.castShadow = true;
    tt.add(leg);
  }
  const front = rbox(2.3, 0.5, 0.05, 0x9a6a43, 0.02);
  front.position.set(0, 0.5, 0.5);
  tt.add(front);
  // The in-tray: classmates' books already handed in.
  const trayBase = rbox(0.8, 0.05, 0.6, COLORS.blue, 0.02);
  trayBase.position.set(0.55, 0.895, 0.05);
  tt.add(trayBase);
  const trayTag = decal(0.78, 0.16, (g, W, H) => {
    pill(g, 0, 0, W, H, '#24182E');
    text(g, 'HANDED IN', W / 2, H * 0.55, H * 0.6, '#FFBE00', 700, 'center');
  }, { px: 48 });
  trayTag.position.set(0.55, 0.9, 0.36);
  trayTag.rotation.x = -0.3;
  tt.add(trayTag);
  const bookGeo = new THREE.BoxGeometry(0.6, 0.06, 0.44);
  [0x2ec4b6, 0xffbe00].forEach((c, i) => {
    const b = new THREE.Mesh(bookGeo, mat(c));
    b.position.set(0.55, 0.95 + i * 0.065, 0.05);
    b.rotation.y = (i - 0.5) * 0.12;
    b.castShadow = true;
    tt.add(b);
  });
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 8), mat(COLORS.red));
  pen.rotation.z = Math.PI / 2;
  pen.position.set(-0.4, 0.9, 0.2);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.2, 14), mat(COLORS.red));
  mug.position.set(-0.9, 0.97, -0.15);
  tt.add(pen, mug);
  scene.add(tt);
  const teacher = buildTeacher();
  teacher.group.position.set(-3.0, 0, -2.4);
  scene.add(teacher.group);
  // A spot on the pile where the pupil's book lands.
  const pileSpot = new THREE.Object3D();
  pileSpot.position.set(0.55, 1.08, 0.05);
  tt.add(pileSpot);

  // ---------- Pupil's desk with the laptop ----------
  const desk = new THREE.Group();
  desk.position.set(0.9, 0, 1.3);
  const dtop = rbox(3.6, 0.1, 1.3, 0xc8a27a, 0.03);
  dtop.position.y = 0.78;
  desk.add(dtop);
  for (const [x, z] of [[-1.7, -0.55], [1.7, -0.55], [-1.7, 0.55], [1.7, 0.55]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.08), legMat);
    leg.position.set(x, 0.37, z);
    leg.castShadow = true;
    desk.add(leg);
  }
  scene.add(desk);
  const laptop = new THREE.Group();
  laptop.position.set(-0.45, 0.83, -0.05);
  const base = rbox(2.3, 0.06, 1.15, 0x3b3f46, 0.03);
  base.position.set(0, 0.03, 0.15);
  const keys = decal(2.0, 0.6, (g, W, H) => {
    g.fillStyle = '#2b2730';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) { g.beginPath(); g.roundRect(c * (W / 13) + 3, r * (H / 4) + 3, W / 13 - 6, H / 4 - 6, 4); g.fill(); }
  }, { px: 128 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.062, 0.05);
  const lid = new THREE.Group();
  lid.position.set(0, 0.06, -0.4);
  lid.rotation.x = -0.22;
  const lidBox = rbox(2.3, 1.45, 0.05, 0x3b3f46, 0.03);
  lidBox.position.y = 0.72;
  const screen = board(2.2, 1.35, 360);
  screen.position.set(0, 0.72, 0.028);
  lid.add(lidBox, screen);
  laptop.add(base, keys, lid);
  desk.add(laptop);
  // The pupil's notes book (it flies to the teacher when handed in).
  const myBook = new THREE.Group();
  const myCover = new THREE.Mesh(bookGeo, mat(COLORS.red));
  myCover.castShadow = true;
  const myLabel = decal(0.5, 0.2, (g, W, H) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    text(g, 'Ama · Notes', W / 2, H / 2, H * 0.42, '#24182E', 700, 'center');
  }, { px: 48 });
  myLabel.rotation.x = -Math.PI / 2;
  myLabel.position.y = 0.032;
  const clip = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 14), mat(0xb8bcc6, { metalness: 0.6 }));
  clip.position.set(-0.28, 0.05, -0.1);
  clip.rotation.y = Math.PI / 2;
  clip.scale.set(1, 1.8, 1);
  clip.visible = false;
  myBook.add(myCover, myLabel, clip);
  const BOOK_HOME = new THREE.Vector3(2.0, 0.86, 0.95);
  myBook.position.copy(BOOK_HOME);
  myBook.rotation.y = -0.2;
  scene.add(myBook);
  // The returned feedback sheet, marked in red pen.
  const sheet = board(0.62, 0.8, 200);
  sheet.rotation.x = -Math.PI / 2;
  sheet.rotation.z = 0.25;
  sheet.visible = false;
  sheet.userData.noInk = true;
  scene.add(sheet);
  const SHEET_HOME = new THREE.Vector3(2.15, 0.845, 1.58);
  sheet.redraw((g, W, H) => {
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#d6e4f5'; g.lineWidth = 2;
    for (let y = 60; y < H; y += 22) { g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); }
    text(g, 'Tutorial notes', 18, 34, 20, '#24182E', 700);
    g.strokeStyle = '#CA1F3F'; g.lineWidth = 5;
    g.beginPath(); g.arc(W - 48, 50, 34, 0, 7); g.stroke();
    text(g, '9/10', W - 48, 52, 24, '#CA1F3F', 700, 'center');
    wrap(g, 'Great notes! Next time add the link.', 18, H - 70, 19, W - 36, 24, '#CA1F3F', 700);
  });
  const chair = buildChair();
  chair.position.set(2.4, 0, 2.5);
  chair.rotation.y = Math.PI + 0.5;
  scene.add(chair);

  // ---------- Tutorial shelf ----------
  const shelf = new THREE.Group();
  shelf.position.set(3.4, 0, -3.05);
  const sBack = rbox(3.9, 2.95, 0.1, 0xf9f9f9, 0.03);
  sBack.position.set(0, 1.55, -0.18);
  shelf.add(sBack);
  for (const x of [-1.95, 1.95]) {
    const post = rbox(0.12, 3.1, 0.55, COLORS.blue, 0.03);
    post.position.set(x, 1.55, 0.05);
    shelf.add(post);
  }
  const PLANKS = [0.2, 1.55, 2.95];
  for (const y of PLANKS) {
    const plank = rbox(3.9, 0.08, 0.55, 0xc8a27a, 0.02);
    plank.position.set(0, y, 0.05);
    shelf.add(plank);
  }
  const sTitle = decal(2.4, 0.3, (g, W, H) => {
    pill(g, 0, 0, W, H, '#24182E');
    text(g, 'TUTORIAL SHELF', W / 2, H * 0.55, H * 0.55, '#FFBE00', 700, 'center');
  }, { px: 64 });
  sTitle.position.set(0, 3.22, 0.1);
  shelf.add(sTitle);
  scene.add(shelf);
  const tablets = VIDEOS.map((v, i) => {
    const t = new THREE.Group();
    const body = rbox(1.62, 1.12, 0.07, 0x2b2730, 0.05);
    const face = board(1.52, 1.02, 256);
    face.position.z = 0.04;
    t.add(body, face);
    const stand = rbox(0.5, 0.06, 0.3, 0x2b2730, 0.02);
    stand.position.set(0, -0.58, 0.05);
    t.add(stand);
    t.position.set(i % 2 ? 0.88 : -0.88, PLANKS[i < 2 ? 1 : 0] + 0.66, 0.12);
    t.rotation.x = -0.08;
    t.userData.home = t.position.clone();
    shelf.add(t);
    stage.clickable(t, () => pick(i));
    return { group: t, face };
  });

  // ---------- State ----------
  let joined = false;
  let opened = false;
  let attached = false;
  let status = 'assigned'; // assigned | handed | returned
  let busy = false;
  let markToken = 0;
  let classSaid = false;
  let privateSent = false;
  let feedbackRead = false;
  let video = -1;
  const checked = VIDEOS.map(() => new Set());
  let chosen = -1;

  // ---------- Drawing ----------
  function drawBoard() {
    wbFace.redraw((g, W, H) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
      text(g, 'CLASSWORK', 26, 40, 34, '#24182E', 700);
      g.fillStyle = '#FFBE00'; g.fillRect(26, 64, 120, 6);
      // The code the mentor wrote in marker.
      g.save();
      g.translate(W - 210, 46);
      g.rotate(-0.04);
      text(g, 'Class code:', 0, 0, 22, '#CA1F3F', 600, 'center');
      text(g, CODE, 0, 36, 38, '#CA1F3F', 700, 'center');
      g.restore();
      if (!joined) {
        wrap(g, 'Join the online class to see your tasks here.', 26, 150, 26, W - 60, 34, '#6B6373', 500);
        return;
      }
      const row = (y, t, d, st, hi) => {
        g.fillStyle = hi ? '#FFF7DB' : '#F4F0F6';
        g.beginPath(); g.roundRect(22, y, W - 44, 76, 14); g.fill();
        text(g, '📝', 50, y + 38, 26, '#24182E', 500, 'center');
        text(g, t, 80, y + 26, 21, '#24182E', 700, 'left', W - 300);
        text(g, d, 80, y + 54, 17, '#6B6373', 500);
        if (st) { pill(g, W - 210, y + 21, 170, 34, st[1]); text(g, st[0], W - 125, y + 39, 17, st[2], 700, 'center'); }
      };
      const st = { assigned: ['Assigned', '#E3F5EF', '#146356'], handed: ['Handed in', '#24182E', '#FFBE00'], returned: ['Returned 9/10', '#CA1F3F', '#FFFFFF'] }[status];
      row(94, TASK, DUE, st, true);
      row(180, 'Session 30: Plan a team meeting', 'Done · returned last week', ['Returned', '#F4F0F6', '#6B6373'], false);
      text(g, 'Not handed in by the due date? It shows as Missing.', 26, H - 20, 16, '#6B6373', 500);
    });
  }
  function drawStream() {
    nbFace.redraw((g, W, H) => {
      g.fillStyle = '#C9A26B'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 400; i++) g.fillRect((i * 97) % W, (i * 53) % H, 3, 3);
      text(g, 'STREAM', W / 2, 30, 28, '#24182E', 700, 'center');
      const note = (x, y, w, h, color, rot, lines, pin) => {
        g.save(); g.translate(x, y); g.rotate(rot);
        g.fillStyle = color; g.fillRect(-w / 2, -h / 2, w, h);
        let yy = -h / 2 + 24;
        for (const [s, size, weight] of lines) yy = wrap(g, s, -w / 2 + 12, yy, size, w - 24, size + 4, '#24182E', weight);
        g.fillStyle = pin; g.beginPath(); g.arc(0, -h / 2 + 4, 8, 0, 7); g.fill();
        g.restore();
      };
      note(W * 0.27, H * 0.38, 210, 120, '#FFF7DB', -0.04, [['📣 Mentor', 17, 700], ['Welcome to our online class! Classwork has your first task.', 16, 500]], '#CA1F3F');
      note(W * 0.73, H * 0.36, 200, 110, '#FFFFFF', 0.05, [['👥 Kofi (class comment)', 16, 700], ['Is the video list on page 3?', 16, 500]], '#2EC4B6');
      if (classSaid) note(W * 0.5, H * 0.76, 300, 110, '#E3F5EF', -0.02, [['👥 Ama (class comment)', 16, 700], [NOTE, 15, 500]], '#5A4470');
      else note(W * 0.5, H * 0.76, 250, 78, '#F4F0F6', 0.02, [['Class comments here are seen by EVERYONE.', 16, 600]], '#FFBE00');
    });
  }
  function drawScreen() {
    screen.redraw((g, W, H) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#F4F0F6'; g.fillRect(0, 0, W, 46);
      text(g, '🎓 Classroom', 16, 24, 22, '#24182E', 700);
      if (!joined) {
        pill(g, W - 150, 9, 136, 28, '#24182E');
        text(g, '+  Join class', W - 82, 24, 16, '#FFFFFF', 600, 'center');
        text(g, 'Join class', W / 2, 110, 30, '#24182E', 700, 'center');
        text(g, 'Ask your teacher for the class code,', W / 2, 150, 18, '#6B6373', 500, 'center');
        text(g, 'then enter it here.', W / 2, 174, 18, '#6B6373', 500, 'center');
        g.strokeStyle = '#5A4470'; g.lineWidth = 3;
        g.beginPath(); g.roundRect(W / 2 - 150, 200, 300, 52, 10); g.stroke();
        text(g, typed || 'Class code', W / 2, 227, 24, typed ? '#24182E' : '#B5ADBD', 600, 'center');
        return;
      }
      text(g, CLASS, W / 2 + 40, 24, 16, '#6B6373', 600, 'center');
      if (!opened) {
        g.fillStyle = '#5A4470'; g.beginPath(); g.roundRect(16, 60, W - 32, 82, 14); g.fill();
        text(g, CLASS, 32, 90, 24, '#FFFFFF', 700);
        text(g, 'Stream · Classwork · People', 32, 122, 16, '#FFBE00', 600);
        text(g, 'Classwork', 18, 172, 20, '#24182E', 700);
        g.fillStyle = '#FFF7DB'; g.beginPath(); g.roundRect(16, 190, W - 32, 62, 12); g.fill();
        text(g, '📝  ' + TASK, 30, 212, 18, '#24182E', 700, 'left', W - 70);
        text(g, DUE, 58, 238, 15, '#6B6373', 500);
        return;
      }
      // The assignment page: instructions on the left, "Your work" on the right.
      text(g, '📝 ' + TASK, 16, 72, 19, '#24182E', 700, 'left', W * 0.58);
      text(g, 'Mentor · ' + DUE, 16, 98, 14, '#6B6373', 500);
      wrap(g, 'Find one tutorial, test it with the 4 checks and write notes: heading, date, 3 key points, a summary and the link.', 16, 130, 14, W * 0.56, 19, '#24182E', 500);
      const px = W * 0.62;
      g.fillStyle = '#FFFFFF'; g.strokeStyle = '#D9D3DE'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(px, 58, W - px - 12, H - 70, 12); g.fill(); g.stroke();
      text(g, 'Your work', px + 12, 82, 17, '#24182E', 700);
      const st = { assigned: ['Assigned', '#146356'], handed: ['Handed in', '#24182E'], returned: ['9/10 Returned', '#CA1F3F'] }[status];
      text(g, st[0], W - 22, 82, 14, st[1], 700, 'right');
      if (attached) {
        g.fillStyle = '#F4F0F6'; g.beginPath(); g.roundRect(px + 10, 100, W - px - 32, 38, 8); g.fill();
        text(g, '📎 ' + FILE, px + 18, 119, 12, '#24182E', 600, 'left', W - px - 46);
      } else {
        g.strokeStyle = '#5A4470'; g.setLineDash([5, 4]);
        g.beginPath(); g.roundRect(px + 10, 100, W - px - 32, 38, 8); g.stroke(); g.setLineDash([]);
        text(g, '+ Add or create', px + (W - px - 12) / 2, 119, 14, '#5A4470', 600, 'center');
      }
      const bx = px + 10;
      const bw = W - px - 32;
      if (status === 'assigned') {
        pill(g, bx, 150, bw, 36, attached ? '#2E6BE6' : '#B5ADBD');
        text(g, attached ? 'Hand in' : 'Mark as done', bx + bw / 2, 168, 16, '#FFFFFF', 700, 'center');
        if (attached) text(g, 'Not handed in yet!', bx + bw / 2, 204, 13, '#CA1F3F', 700, 'center');
      } else {
        g.strokeStyle = '#D9D3DE'; g.lineWidth = 2; g.beginPath(); g.roundRect(bx, 150, bw, 36, 18); g.stroke();
        text(g, status === 'handed' ? 'Unsubmit' : 'Returned', bx + bw / 2, 168, 15, '#5A4470', 600, 'center');
      }
      text(g, '🔒 Private comments', px + 12, 230, 13, '#24182E', 700);
      let y = 254;
      if (privateSent) y = wrap(g, 'Ama: ' + NOTE, px + 12, y, 11, W - px - 36, 14, '#6B6373', 500);
      if (status === 'returned') wrap(g, 'Mentor: ' + reply(), px + 12, y + 2, 11, W - px - 36, 14, '#CA1F3F', 600);
      else if (!privateSent) text(g, 'Only you and the teacher see these.', px + 12, y, 11, '#6B6373', 500);
    });
  }
  const reply = () => (privateSent ? 'Thank you, Ama! I am glad the ½ × base × height idea clicked.' : 'Well done, Ama. Only you and I can see this comment.');

  function drawTablet(i) {
    const v = VIDEOS[i];
    tablets[i].face.redraw((g, W, H) => {
      g.fillStyle = v.bg; g.fillRect(0, 0, W, H);
      // A play button, a triangle doodle (it is about triangles) and the title.
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.beginPath(); g.moveTo(W * 0.7, H * 0.18); g.lineTo(W * 0.95, H * 0.6); g.lineTo(W * 0.45, H * 0.6); g.closePath(); g.fill();
      text(g, v.key, 22, 30, 30, v.fg, 700);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(W - 92, 12, 80, 30, 8); g.fill();
      text(g, v.len, W - 52, 28, 18, '#FFFFFF', 600, 'center');
      wrap(g, v.title, 22, 82, 26, W - 44, 30, v.fg, 700);
      text(g, (v.short ?? v.by) + ' · ' + v.year, 22, H - 76, 17, v.fg, 500, 'left', W - 44);
      text(g, v.views, 22, H - 52, 15, v.fg, 500);
      // The four check chips: grey until checked, then green or red.
      CHECKS.forEach((c, k) => {
        const done = checked[i].has(c.id);
        const ok = v.res[c.id][0];
        const x = 14 + k * ((W - 28) / 4);
        pill(g, x + 2, H - 32, (W - 28) / 4 - 4, 26, done ? (ok ? '#2EC4B6' : '#CA1F3F') : 'rgba(255,255,255,0.75)');
        text(g, `${done ? (ok ? '✓' : '✗') : '?'} ${['Who', 'When', 'Match', '2nd'][k]}`, x + (W - 28) / 8, H - 18, 14, done && !ok ? '#FFFFFF' : '#24182E', 700, 'center');
      });
      if (chosen === i) { g.strokeStyle = '#FFBE00'; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12); }
    });
  }

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    work: stage.callout(lid, { icon: '💻', title: 'Your work', text: 'Attaching is not handing in.', at: [0.9, 1.3, 0], dx: 90, dy: -30 }),
    pile: stage.callout(tt, { icon: '📥', title: 'Hand in', text: 'Nothing from you on the pile yet.', at: [0.55, 1.1, 0.05], dx: 10, dy: 110 }),
    board: stage.callout(wb, { icon: '📝', title: 'Classwork', text: 'Tasks and due dates.', at: [-1.6, 0.9, 0], dx: -40, dy: -60 }),
    shelf: stage.callout(shelf, { icon: '🎬', title: 'Tutorials', text: 'Use the 4 checks before you trust one.', at: [1.6, 2.4, 0.2], dx: 30, dy: -70 }),
    stream: stage.callout(nb, { icon: '📌', title: 'Stream', text: 'Class comments: everyone reads them.', at: [0.4, 0.95, 0], dx: 30, dy: -60 }),
    feedback: stage.callout(sheet, { icon: '🖍️', title: 'Feedback', text: 'Read it, then improve.', dx: -90, dy: 60 }),
  };

  // ---------- Side panel ----------
  const g1 = ui.group('1 · Join the class');
  const field = ui.element(`<label class="lab-field">Class code (your mentor wrote it on the board)<input type="text" maxlength="12" autocomplete="off" spellcheck="false" placeholder="e.g. abc1234"></label>`, g1);
  const input = field.querySelector('input');
  let typed = '';
  input.addEventListener('input', () => { typed = input.value.slice(0, 12); if (!joined) drawScreen(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); join(); } });
  const joinBtn = ui.button('Join', () => join(), { primary: true, group: g1 });
  const openBtn = ui.button('📝 Open the assignment', () => openTask(), { group: g1 });

  const g2 = ui.group('2 · Your work');
  const statusBox = ui.element('<div class="mail-card" aria-live="polite"></div>', g2).firstElementChild;
  const attachBtn = ui.button('📎 + Add or create: attach my notes', () => attach(), { group: g2 });
  const handBtn = ui.button('📤 Hand in', () => handIn(), { primary: true, group: g2 });
  const unsubBtn = ui.button('↩ Unsubmit', () => unsubmit(), { group: g2 });
  ui.element(`<p class="crack" style="margin-top:4px">💬 Comment to send: <i>“${esc(NOTE)}”</i></p>`, g2);
  const classBtn = ui.button('👥 Post as class comment', () => comment('class'), { group: g2 });
  const privBtn = ui.button('🔒 Send as private comment', () => comment('private'), { group: g2 });
  const readBtn = ui.button('🖍️ Read the feedback', () => readFeedback(), { group: g2 });

  const g3 = ui.group('3 · Find a tutorial for Kwame');
  ui.element('<p class="crack">Kwame needs to learn the <b>area of a triangle</b> for his BECE revision. Pick a video, run all 4 checks, then choose the best one.</p>', g3);
  const vidBtns = VIDEOS.map((v, i) => ui.button(`${v.key} · ${v.short ?? v.by}`, () => pick(i), { group: g3 }));
  const vidBox = ui.element('<div class="mail-card" aria-live="polite"><small style="color:var(--muted)">No video picked yet. Click one on the shelf or above.</small></div>', g3).firstElementChild;
  const checkRow = ui.group('');
  g3.appendChild(checkRow);
  const checkBtns = CHECKS.map((c) => ui.button(`🔍 ${c.name}`, () => runCheck(c.id), { group: checkRow }));
  const chooseBtn = ui.button('✅ Choose this tutorial', () => choose(), { primary: true, group: g3 });

  const g4 = ui.group('');
  ui.button('↺ Start the class again', () => restart(), { group: g4 });

  function setBusy(on) {
    busy = on;
    for (const b of [attachBtn, handBtn, unsubBtn, classBtn, privBtn, readBtn]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }

  function renderStatus() {
    const pillCss = { assigned: 'background:var(--green-tint);color:#146356', handed: 'background:var(--plum);color:var(--gold)', returned: 'background:var(--red);color:#fff' }[status];
    const word = { assigned: 'Assigned', handed: 'Handed in', returned: 'Returned · 9/10' }[status];
    statusBox.innerHTML = !opened
      ? '<small style="color:var(--muted)">Join the class and open the assignment first.</small>'
      : `<b>${esc(TASK)}</b><br><small style="color:var(--muted)">${esc(DUE)}</small>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">Status: <span style="padding:2px 10px;border-radius:99px;font-weight:700;font-size:13px;${pillCss}">${word}</span></div>
        <div style="font-size:13px;margin-top:6px">📎 Attached: ${attached ? `<b>${esc(FILE)}</b>` : '<i>nothing yet</i>'}</div>
        <div style="font-size:13px;margin-top:2px">📥 Teacher's pile: ${status === 'assigned' ? '<b style="color:var(--red)">nothing from you</b>' : '<b>your notes are there</b>'}</div>`;
    unsubBtn.hidden = status !== 'handed';
    handBtn.hidden = status !== 'assigned';
    readBtn.hidden = status !== 'returned';
    openBtn.hidden = !joined || opened;
    joinBtn.hidden = joined;
    field.hidden = joined;
    cards.pile.set('Hand in', { assigned: 'Nothing from you on the pile yet.', handed: 'Your notes reached the teacher.', returned: 'Marked and given back to you.' }[status]);
    cards.work.set('Your work', { assigned: attached ? 'Attached, but NOT handed in.' : 'Attaching is not handing in.', handed: 'Handed in: the teacher has it.', returned: 'Returned with a mark.' }[status]);
  }
  const redrawAll = () => { drawScreen(); drawBoard(); renderStatus(); };

  // ---------- Actions ----------
  function join() {
    if (joined) return;
    const code = input.value.trim().toLowerCase().replace(/\s+/g, '');
    if (!code) {
      ui.info('Type the class code', `<p>Your mentor wrote the code on the <b>whiteboard</b> (top right, in red). Type it in the box, then press <b>Join</b>.</p>`);
      return;
    }
    if (code !== CODE) {
      ui.info('❌ Class not found', `<p>You typed <b>${esc(code)}</b>, but the code on the board is different. Codes are short and easy to mistype, so read it back <b>letter by letter</b>.</p><p>Check you are signed in with the <b>Hub's learning account</b>, too.</p>`);
      return;
    }
    joined = true;
    typed = '';
    redrawAll();
    stage.reveal();
    ui.info('🎉 You joined the class!', `<p>You are now in <b>${esc(CLASS)}</b>. The whiteboard shows <b>Classwork</b>: the tasks your teacher set, each with a <b>due date</b>.</p><p>Next: press <b>Open the assignment</b> to read the task.</p>`);
    openBtn.focus();
  }

  function openTask() {
    if (!joined) {
      ui.info('Join the class first', '<p>You can only see a class\'s Classwork after you join it with the code.</p>');
      return;
    }
    if (opened) return;
    opened = true;
    redrawAll();
    ui.info(`📝 ${TASK}`, `<p><b>${esc(DUE)}.</b> Write it down so you don't forget!</p><p>The task: find one tutorial, test it with the 4 checks and write notes. Under <b>Your work</b> you can attach your notes and hand them in.</p>`);
    ui.complete('join');
  }

  function needOpen() {
    if (opened) return false;
    ui.info('Open the assignment first', `<p>${joined ? 'Press <b>Open the assignment</b>.' : 'Join the class with the code on the board, then open the assignment.'} “Your work” is inside the assignment.</p>`);
    return true;
  }

  async function attach() {
    if (busy || needOpen()) return;
    if (status !== 'assigned') {
      ui.info('Already handed in', '<p>To change your attachment, press <b>Unsubmit</b> first, fix it, then hand in again before the due date.</p>');
      return;
    }
    if (attached) {
      ui.info('Your notes are attached', '<p>Your file is attached already. Look at the status: it still says <b>Assigned</b>. Press <b>Hand in</b>!</p>');
      return;
    }
    attached = true;
    clip.visible = true;
    redrawAll();
    stage.tween((k) => { myBook.position.y = BOOK_HOME.y + Math.sin(k * Math.PI) * 0.25; }, 0.5);
    ui.info('📎 Attached… but not handed in!', `<p>Your notes are attached, but look: the status still says <b>Assigned</b>, and the teacher's pile has <b>nothing from you</b>.</p><p>The teacher cannot see attached work until you press <b>Hand in</b> (it says <b>Turn in</b> on American-English settings). It is like having your exercise book in your bag, not on the teacher's table.</p>`);
  }

  async function handIn() {
    if (busy || needOpen()) return;
    if (!attached) {
      ui.info('Nothing to hand in yet', '<p>Your work is empty! Without a file the button only says <b>Mark as done</b>, and the teacher gets nothing to mark. Press <b>+ Add or create</b> to attach your notes first.</p>');
      return;
    }
    if (status !== 'assigned') return;
    setBusy(true);
    status = 'handed';
    redrawAll();
    ui.info('📤 Handed in!', '<p>Now the status says <b>Handed in</b> and your notes are on the teacher\'s pile. <b>Now</b> the teacher has it.</p><p>Made a mistake? Press <b>Unsubmit</b>, fix it and hand in again, before the due date. While you wait, send your mentor a <b>private comment</b>.</p>');
    await arc(myBook, tt.localToWorld(pileSpot.position.clone()), 1.6, 1.0);
    setBusy(false);
    const token = ++markToken;
    // The mentor marks it with a red pen, then returns it.
    teacher.marking = true;
    await stage.wait(5);
    if (token !== markToken || status !== 'handed') return;
    teacher.marking = false;
    setBusy(true);
    status = 'returned';
    sheet.visible = true;
    sheet.position.copy(myBook.position);
    await Promise.all([arc(myBook, BOOK_HOME, 1.4, 0.9), arc(sheet, SHEET_HOME, 1.8, 1.0)]);
    setBusy(false);
    redrawAll();
    stage.reveal();
    ui.info('📬 Your work was returned!', '<p>The status says <b>Returned</b>, with a mark. Your job is not finished until you read the feedback: press <b>Read the feedback</b>.</p>');
  }

  async function unsubmit() {
    if (busy || status !== 'handed') return;
    markToken++;
    teacher.marking = false;
    setBusy(true);
    status = 'assigned';
    redrawAll();
    await arc(myBook, BOOK_HOME, 1.4, 0.8);
    setBusy(false);
    ui.info('↩ Unsubmitted', '<p>Your notes came back to you and the status is <b>Assigned</b> again. The teacher no longer has them. Fix what you need, then press <b>Hand in</b> again, before the due date.</p>');
  }

  function comment(kind) {
    if (busy || needOpen()) return;
    if (kind === 'class') {
      classSaid = true;
      drawStream();
      ui.info('👥 Posted to the whole class', '<p>Look at the <b>Stream</b> noticeboard: your comment is pinned there, and <b>everyone in the class</b> can read it.</p><p>Class comments are for questions that help everybody (“Is the diagram on page 4 or 5?”). A message about <b>your own work</b> belongs in a <b>private comment</b>, which only you and the teacher can read.</p>');
      return;
    }
    if (privateSent) {
      ui.info('Already sent', '<p>Your private comment is under <b>Your work</b>. Only you and the teacher can read it.</p>');
      return;
    }
    privateSent = true;
    drawScreen();
    ui.info('🔒 Private comment sent', `<p>Only you and your mentor can read it: it is like a quiet word at the teacher's desk. The Stream noticeboard does not show it.</p>${status === 'assigned' ? '<p>Remember to <b>Hand in</b> your work too!</p>' : ''}`);
    checkWork();
  }

  function readFeedback() {
    if (status !== 'returned') {
      ui.info('No feedback yet', '<p>The teacher can only mark work that has been <b>handed in</b>.</p>');
      return;
    }
    feedbackRead = true;
    cards.feedback.set('Feedback', 'Mark 9/10. Next time: add the link.');
    ui.info('🖍️ Feedback: 9 out of 10', `<p><b>Mentor's comment:</b> “Great notes, Ama: a clear heading, the date and 3 key points in your own words. Next time, add the <b>link</b> to the tutorial you used.”</p>
      <p><b>🔒 Private comment from your mentor:</b> “${esc(reply())}”</p>
      <p>Feedback tells you how to make your <b>next</b> piece of work better. ${privateSent ? '' : 'Now send your mentor a <b>private comment</b> too (one thing you learned).'}</p>`);
    checkWork();
  }
  function checkWork() {
    if (feedbackRead && privateSent && status === 'returned') {
      ui.complete('handin');
    }
  }

  function pick(i) {
    if (busy && video === i) return;
    video = i;
    ui.toggle(vidBtns, vidBtns[i]);
    tablets.forEach((t, k) => {
      const h = t.group.userData.home;
      const from = t.group.position.z;
      const to = k === i ? h.z + 0.35 : h.z;
      stage.tween((e) => (t.group.position.z = from + (to - from) * e), 0.3);
    });
    renderVideo();
    const v = VIDEOS[i];
    ui.info(`🎬 Video ${v.key}: “${v.title}”`, `<p>By <b>${esc(v.by)}</b> · ${v.len} · ${v.year} · ${v.views}</p><p>Before you trust it, run the <b>4 checks</b>: Who? When? Match? Second source?</p>`);
  }
  function renderVideo() {
    if (video < 0) return;
    const v = VIDEOS[video];
    vidBox.innerHTML = `<b>${v.key}: ${esc(v.title)}</b><br><small style="color:var(--muted)">${esc(v.by)} · ${v.len} · ${v.year} · ${v.views}</small>
      <ul style="list-style:none;padding:0;margin:8px 0 0;font-size:13px;display:grid;gap:4px">${CHECKS.map((c) => {
        const done = checked[video].has(c.id);
        const [ok, why] = v.res[c.id];
        return `<li style="padding:4px 8px;border-radius:8px;background:${done ? (ok ? 'var(--green-tint)' : 'var(--red-tint)') : 'var(--plum-tint)'}">${done ? (ok ? '✅' : '❌') : '⬜'} <b>${c.name}</b> ${done ? esc(why) : `<span style="color:var(--muted)">${esc(c.q)}</span>`}</li>`;
      }).join('')}</ul>`;
  }
  function runCheck(id) {
    if (video < 0) {
      ui.info('Pick a video first', '<p>Click a video on the shelf, or one of the buttons A to D.</p>');
      return;
    }
    checked[video].add(id);
    drawTablet(video);
    renderVideo();
    const c = CHECKS.find((x) => x.id === id);
    const [ok, why] = VIDEOS[video].res[id];
    const left = CHECKS.filter((x) => !checked[video].has(x.id)).length;
    ui.info(`${ok ? '✅' : '❌'} ${c.name} Video ${VIDEOS[video].key}`, `<p>${esc(why)}</p><p>${left ? `${left} check${left === 1 ? '' : 's'} left for this video.` : 'All 4 checks done for this video. Is it good enough? Choose it, or try another video.'}</p>`);
  }
  function choose() {
    if (video < 0) {
      ui.info('Pick a video first', '<p>Click a video on the shelf, or one of the buttons A to D.</p>');
      return;
    }
    const v = VIDEOS[video];
    const left = CHECKS.filter((c) => !checked[video].has(c.id));
    if (left.length) {
      ui.info('Judge it before you trust it', `<p>You have not run ${left.map((c) => `<b>${c.name}</b>`).join(', ')} on video ${v.key} yet. A good tutorial must pass <b>all 4 checks</b>.</p>`);
      return;
    }
    const fails = CHECKS.filter((c) => !v.res[c.id][0]);
    if (fails.length) {
      ui.info(`❌ Not video ${v.key}`, `<p>It fails ${fails.map((c) => `<b>${c.name}</b>`).join(', ')}: ${esc(v.res[fails[0].id][1])}</p><p>Try another video on the shelf.</p>`);
      return;
    }
    chosen = video;
    tablets.forEach((_, k) => drawTablet(k));
    const t = tablets[video].group;
    const y0 = t.position.y;
    stage.reveal();
    stage.tween((k) => { t.position.y = y0 + Math.sin(k * Math.PI) * 0.4; t.rotation.y = k * Math.PI * 2; }, 0.9);
    ui.info(`🏆 Video ${v.key} is the best tutorial!`, `<p>It passes all 4 checks: a real teacher (<b>Who</b>), made this year (<b>When</b>), made for JHS with worked examples (<b>Match</b>), and its formula agrees with the textbook (<b>Second source</b>).</p><p>Notice that video A had the most views, and it was wrong. <b>Views and likes are not proof.</b></p>`);
    ui.complete('tutorial');
  }

  function restart() {
    if (busy) return;
    markToken++;
    teacher.marking = false;
    joined = opened = attached = classSaid = privateSent = feedbackRead = false;
    status = 'assigned';
    video = chosen = -1;
    checked.forEach((s) => s.clear());
    input.value = typed = '';
    clip.visible = false;
    sheet.visible = false;
    myBook.position.copy(BOOK_HOME);
    tablets.forEach((t, k) => { t.group.position.copy(t.group.userData.home); drawTablet(k); });
    ui.toggle(vidBtns, null);
    vidBox.innerHTML = '<small style="color:var(--muted)">No video picked yet. Click one on the shelf or above.</small>';
    cards.feedback.set('Feedback', 'Read it, then improve.');
    drawStream();
    redrawAll();
    intro();
  }

  async function arc(obj, to, height, duration) {
    const from = obj.position.clone();
    await stage.tween((k) => {
      obj.position.lerpVectors(from, to, k);
      obj.position.y += Math.sin(k * Math.PI) * height;
    }, duration);
  }

  stage.onTick((dt, t) => {
    if (teacher.marking) {
      teacher.arm.rotation.x = -1.1 + Math.sin(t * 9) * 0.18;
      teacher.arm.rotation.z = Math.sin(t * 4.5) * 0.2;
    } else {
      teacher.arm.rotation.x = -0.15;
      teacher.arm.rotation.z = 0;
    }
    teacher.head.rotation.y = teacher.marking ? 0 : Math.sin(t * 0.7) * 0.25;
  });

  function intro() {
    ui.info('Welcome to the online class 🎓', `<p>Google Classroom is your real classroom on a website: the <b>Stream</b> is the noticeboard, <b>Classwork</b> is the tasks on the board, <b>Hand in</b> is the pile on the teacher's table, and <b>feedback</b> is the red pen.</p><p>Start by typing the <b>class code</b> from the whiteboard and pressing <b>Join</b>.</p>`);
  }
  drawStream();
  tablets.forEach((_, k) => drawTablet(k));
  redrawAll();
  intro();
}

// ---------- Models ----------
function buildTeacher() {
  const group = new THREE.Group();
  const skin = mat(0x7a4a2e);
  const legs = rbox(0.5, 0.8, 0.32, COLORS.purple, 0.1);
  legs.position.y = 0.4;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.55, 4, 12), mat(0xffffff, { map: kente() }));
  body.position.y = 1.2;
  body.castShadow = true;
  const head = new THREE.Group();
  head.position.y = 1.95;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), skin);
  face.castShadow = true;
  const wrapTop = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.8), mat(COLORS.gold));
  wrapTop.position.set(0, 0.1, -0.04);
  wrapTop.scale.set(1, 1.3, 1);
  const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), mat(COLORS.purple));
  glasses.position.set(-0.08, 0.02, 0.24);
  const glasses2 = glasses.clone();
  glasses2.position.x = 0.08;
  head.add(face, wrapTop, glasses, glasses2);
  // The writing arm, holding the red pen.
  const arm = new THREE.Group();
  arm.position.set(0.36, 1.45, 0.05);
  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 8), mat(COLORS.red));
  sleeve.position.y = -0.3;
  const penHand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), mat(COLORS.red));
  penHand.position.set(0, -0.62, 0.04);
  arm.add(sleeve, penHand);
  const arm2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 8), mat(COLORS.red));
  arm2.position.set(-0.4, 1.2, 0.05);
  arm2.rotation.z = -0.15;
  group.add(legs, body, head, arm, arm2);
  return { group, head, arm, marking: false };
}

function buildChair() {
  const g = new THREE.Group();
  const seat = rbox(0.7, 0.08, 0.65, COLORS.blue, 0.03);
  seat.position.y = 0.48;
  const back = rbox(0.7, 0.55, 0.06, COLORS.blue, 0.03);
  back.position.set(0, 0.8, -0.3);
  g.add(seat, back);
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.48, 6);
  const legMat = mat(0x3b3f46);
  for (const [x, z] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, 0.24, z);
    g.add(l);
  }
  return g;
}

// A simple kente-style pattern for the teacher's top.
function kente() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const cols = ['#FFBE00', '#2EC4B6', '#CA1F3F', '#24182E'];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = cols[i % 4];
    g.fillRect(i * 16, 0, 16, 128);
  }
  for (let j = 0; j < 8; j += 2) {
    g.fillStyle = 'rgba(255,190,0,0.85)';
    g.fillRect(0, j * 16 + 4, 128, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

export const config = { camera: [3.6, 7.2, 11.5], target: [0, 1.5, -0.5], shadowSize: 9, frame: 0.74 };

export const missions = [
  { id: 'join', text: 'Join the class with the code on the board, then open the assignment.', hint: 'The code is in red on the whiteboard. Type it in the box and press "Join", then "Open the assignment".' },
  { id: 'handin', text: 'Attach your notes, press Hand in, send a private comment, then read the feedback.', hint: 'Attaching is not handing in: watch the status. After it is returned, press "Read the feedback".' },
  { id: 'tutorial', text: 'Use the 4 checks to choose the best tutorial for Kwame.', hint: 'Pick a video, press all four check buttons (Who? When? Match? Second source?), then "Choose this tutorial".' },
];
