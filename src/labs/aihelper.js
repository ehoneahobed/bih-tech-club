// Session 19 — AI Helper Check: a pretend chatbot on a 3D phone.
// 1. Build a clear prompt and watch the answer get more focused.
// 2. Catch the helper's confident mistakes by checking a trusted textbook.
// 3. Decide what is fine to ask an AI and what must never be typed in.
// Every answer is written in advance: there is no real AI and no network.
import { THREE, COLORS, box, rbox, mat, decal } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Part 1: prompt pieces and pre-written answers ----------
const PIECES = [
  { id: 'task', icon: '🎯', name: 'Task', text: 'Explain how the Volta River helps Ghana', tip: 'Say exactly <b>what</b> you want: which river, and what about it.' },
  { id: 'who', icon: '🧒', name: 'Who it\'s for', text: 'for a JHS 1 pupil', tip: 'Say <b>who</b> the answer is for, so it uses the right words.' },
  { id: 'format', icon: '📋', name: 'Format', text: 'in 5 short points', tip: 'Say <b>how</b> you want it laid out: points, a table, a short paragraph…' },
  { id: 'tone', icon: '🙂', name: 'Tone', text: 'using simple, friendly words', tip: 'A nice extra: say what <b>style</b> you like.' },
];
const WEIGHT = { task: 40, who: 25, format: 25, tone: 10 };
const VAGUE = 'Tell me about rivers';

const ANSWERS = {
  vague: {
    hard: [
      'Rivers are natural flows of fresh water that move across land towards a sea, a lake or another river.',
      'Famous rivers include the Nile, the Amazon, the Niger and the Volta.',
      'Rivers are fed by rain, springs and, in some places, melting snow and ice.',
      'Over thousands of years they carve valleys and carry soil and sand downstream.',
      'They are home to fish, birds and plants, and give people water, food and transport.',
    ],
    easy: [
      'Rivers are long lines of water that flow over land.',
      'Most rivers flow into a lake or the sea.',
      'Rain and springs keep them full.',
      'Fish, birds and plants live in and near rivers.',
      'People use rivers for water, food and travel.',
    ],
  },
  volta: {
    hard: [
      'The Akosombo and Kpong dams generate hydroelectric power for the national grid.',
      'Lake Volta supports a large inland fishing industry and many livelihoods.',
      'The river supplies water for irrigation schemes along its lower course.',
      'Lake transport moves passengers and cargo between the north and the south of Ghana.',
      'Treated Volta water is piped to homes and industries, including parts of Accra and Tema.',
    ],
    easy: [
      'The Akosombo Dam uses the river to make electricity for homes and schools.',
      'People catch fish in Lake Volta to eat and to sell.',
      'Farmers use its water for their crops.',
      'Boats and ferries carry people and goods across the lake.',
      'Its water is cleaned and piped to homes, including in parts of Accra.',
    ],
  },
};
// Extra rambling an unfocused answer adds when nobody asked for a format.
const RAMBLE = {
  vague: 'There are thousands of rivers on every continent except Antarctica, and each one has its own history, wildlife and uses, so there is a great deal more that could be said about them…',
  volta: 'The Volta basin is shared by six West African countries, and the river system has a long history of trade, settlement and development projects, which could each fill a whole book…',
};

function answerFor(on) {
  const topic = on.task ? 'volta' : 'vague';
  const pts = ANSWERS[topic][on.who || on.tone ? 'easy' : 'hard'];
  let body = on.format ? pts.map((p, i) => `${i + 1}. ${p}`) : [pts.join(' ') + ' ' + RAMBLE[topic]];
  if (on.tone) body = ['Great question! 😊', ...body, 'Keep asking good questions!'];
  return body;
}

// ---------- Part 2: confident answers, some wrong (checked facts) ----------
const FACTS = [
  {
    q: 'When did Ghana become independent?', a: 'Ghana became independent on 6 March 1960.', ok: false, subject: 'History',
    fact: 'Ghana became independent on 6 March 1957.', more: 'Ghana became a republic on 1 July 1960. The helper mixed up the two dates.',
  },
  {
    q: 'What is the capital city of Ghana?', a: 'The capital of Ghana is Accra.', ok: true, subject: 'Geography',
    fact: 'Accra is the capital city of Ghana.', more: 'It is in the Greater Accra Region, on the coast.',
  },
  {
    q: 'Is a spider an insect?', a: 'Yes, a spider is an insect.', ok: false, subject: 'Science',
    fact: 'A spider is NOT an insect. It is an arachnid.', more: 'Spiders have 8 legs and 2 main body parts. Insects have 6 legs and 3 body parts.',
  },
  {
    q: 'How big is Lake Volta?', a: 'By surface area, Lake Volta is one of the largest man-made lakes in the world.', ok: true, subject: 'Geography',
    fact: 'Lake Volta is one of the largest man-made lakes in the world by surface area.', more: 'It formed behind the Akosombo Dam in the 1960s.',
  },
  {
    q: 'At what temperature does water boil?', a: 'At sea level, water boils at 100 °C.', ok: true, subject: 'Science',
    fact: 'At sea level, pure water boils at 100 °C.', more: 'High up a mountain the air pressure is lower, so water boils at a lower temperature.',
  },
  {
    q: 'Does the Sun go around the Earth?', a: 'Yes, the Sun goes around the Earth once every day.', ok: false, subject: 'Science',
    fact: 'The Earth goes around the Sun, once a year (about 365 days).', more: 'Day and night happen because the Earth spins once a day.',
  },
];

// ---------- Part 3: OK to ask, or never type into AI? ----------
const ITEMS = [
  { t: 'My full name and school', ok: false, why: 'Together they tell strangers who you are and where to find you.' },
  { t: 'Help me plan a science fair poster', ok: true, why: 'A good use: asking for ideas. You still make the poster yourself.' },
  { t: 'My MoMo PIN', ok: false, why: 'A PIN is a secret for you alone. No chatbot or company ever needs it.' },
  { t: 'Explain fractions with an example', ok: true, why: 'Perfect: asking for an explanation helps you learn.' },
  { t: 'A photo of my friend', ok: false, why: 'Your friend\'s face is their private information. It is not yours to share.' },
  { t: 'My home address', ok: false, why: 'Where you live is private. Keep it out of chatbots and websites.' },
  { t: 'Give me 5 quiz questions on the water cycle', ok: true, why: 'Great for revision, and nothing private is shared.' },
  { t: 'My password', ok: false, why: 'Never type a password anywhere except the real sign-in box.' },
];

// A rounded-box shape to share between meshes with their own material.
const rgeo = (w, h, d, r) => {
  const m = rbox(w, h, d, 0, r);
  m.material.dispose();
  return m.geometry;
};

export default function aiHelperLab(stage, ui) {
  const { scene } = stage;
  const T = 1.65; // desk top

  // ---------- The desk ----------
  const desk = rbox(8.6, 0.3, 5, 0xc8a27a, 0.05);
  desk.position.y = 1.5;
  scene.add(desk);
  const grain = decal(8.5, 4.9, (g, W, H) => {
    g.fillStyle = '#c8a27a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,80,40,0.18)';
    g.lineWidth = 2;
    for (let k = 0; k < 24; k++) {
      const y = (k + 0.5) * (H / 24);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 90 + k * 1.7) * 4);
      g.stroke();
    }
  }, { px: 256, transparent: false });
  grain.material.color.setScalar(0.82);
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = T + 0.002;
  scene.add(grain);
  for (const x of [-3.9, 3.9]) for (const z of [-2.1, 2.1]) {
    const leg = rbox(0.28, 1.36, 0.28, 0x8a6a4a, 0.04);
    leg.position.set(x, 0.68, z);
    scene.add(leg);
  }

  // ---------- The phone on its stand ----------
  const PW = 2.6, PH = 5.0, SW = 2.4, SH = 4.76;
  const stand = new THREE.Group();
  const standMat = mat(0x5a4470, { roughness: 0.5 });
  const sBase = new THREE.Mesh(rgeo(1.9, 0.14, 1.5, 0.05), standMat);
  sBase.position.set(0, 0.07, -0.25);
  const sBack = new THREE.Mesh(rgeo(1.5, 2.6, 0.14, 0.05), standMat);
  sBack.position.set(0, 1.42, -0.4);
  sBack.rotation.x = -0.25;
  const sLip = new THREE.Mesh(rgeo(1.9, 0.3, 0.14, 0.05), standMat);
  sLip.position.set(0, 0.2, 0.42);
  for (const m of [sBase, sBack, sLip]) m.castShadow = m.receiveShadow = true;
  stand.add(sBase, sBack, sLip);
  stand.position.set(0, T, -0.6);
  scene.add(stand);

  const phone = new THREE.Group();
  const body = rbox(PW, PH, 0.22, COLORS.purple, 0.3, { roughness: 0.35, metalness: 0.2 });
  body.position.y = PH / 2;
  const glass = rbox(PW - 0.1, PH - 0.1, 0.02, 0x0b090d, 0.26, { roughness: 0.2 });
  glass.position.set(0, PH / 2, 0.106);
  glass.userData.noInk = true;
  const screen = decal(SW, SH, () => {}, { px: 512, transparent: false });
  screen.position.set(0, PH / 2, 0.118);
  phone.add(body, glass, screen);
  // Side buttons and the camera bump on the back.
  const btnMat = mat(0x3d2c4a, { metalness: 0.4, roughness: 0.35 });
  const sideBtn = (h, y, x) => {
    const b = new THREE.Mesh(rgeo(0.06, h, 0.1, 0.025), btnMat);
    b.position.set(x, y, 0);
    phone.add(b);
  };
  sideBtn(0.6, PH - 1.3, PW / 2 + 0.02);
  sideBtn(0.45, PH - 1.0, -PW / 2 - 0.02);
  sideBtn(0.45, PH - 1.6, -PW / 2 - 0.02);
  const bump = rbox(0.9, 0.9, 0.08, 0x3d2c4a, 0.18);
  bump.position.set(-0.55, PH - 0.7, -0.14);
  phone.add(bump);
  const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20);
  const lensMat = mat(0x0b090d, { roughness: 0.15, metalness: 0.5 });
  for (const [x, y] of [[-0.72, PH - 0.52], [-0.38, PH - 0.88], [-0.72, PH - 0.88]]) {
    const l = new THREE.Mesh(lensGeo, lensMat);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, y, -0.2);
    phone.add(l);
  }
  phone.position.set(0, T + 0.16, -0.5);
  phone.rotation.x = -0.25;
  scene.add(phone);
  // Points on the screen for the callouts.
  const promptSpot = new THREE.Object3D();
  promptSpot.position.set(-PW / 2, 0.45, 0);
  const answerSpot = new THREE.Object3D();
  answerSpot.position.set(-PW / 2, PH * 0.58, 0);
  phone.add(promptSpot, answerSpot);

  // ---------- Drawing the chat app ----------
  const scr = screen.material.map.image;
  const sg = scr.getContext('2d');
  const SWpx = scr.width, SHpx = scr.height;
  const f = (px, w = 500) => `${w} ${px}px ${FONT}`;
  function wrap(text, maxW, font, maxLines = 99) {
    sg.font = font;
    const out = [];
    for (const para of String(text).split('\n')) {
      let cur = '';
      for (const word of para.split(' ')) {
        const tryLine = cur ? cur + ' ' + word : word;
        if (sg.measureText(tryLine).width > maxW && cur) { out.push(cur); cur = word; } else cur = tryLine;
      }
      out.push(cur);
    }
    if (out.length > maxLines) {
      out.length = maxLines;
      out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, '') + ' …';
    }
    return out;
  }
  // msgs: [{ who: 'me' | 'ai' | 'note' | 'typing', text, color }]
  let chat = { msgs: [], input: '', inputBold: false };
  function drawScreen() {
    const g = sg, W = SWpx, H = SHpx;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = '#f4f0f6';
    g.fillRect(0, 0, W, H);
    // Status bar with the camera "island".
    g.fillStyle = '#24182e';
    g.fillRect(0, 0, W, 176);
    g.fillStyle = '#ffffff';
    g.font = f(24, 600);
    g.fillText('9:41', 34, 36);
    g.fillStyle = '#0b090d';
    g.beginPath(); g.roundRect(W / 2 - 64, 16, 128, 38, 19); g.fill();
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) g.fillRect(W - 128 + i * 11, 44 - i * 6, 7, 6 + i * 6);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(W - 74, 25, 40, 22, 5); g.stroke();
    g.fillRect(W - 70, 29, 26, 14);
    // App header.
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.arc(66, 118, 36, 0, 7); g.fill();
    g.fillStyle = '#24182e';
    g.font = f(30, 700);
    g.textAlign = 'center';
    g.fillText('AI', 66, 120);
    g.textAlign = 'left';
    g.fillStyle = '#ffffff';
    g.font = f(36, 700);
    g.fillText('AI Helper', 118, 104);
    g.fillStyle = '#d9d3de';
    g.font = f(21, 400);
    g.fillText('Practice chatbot · not real AI', 118, 140);
    // Messages, newest at the bottom.
    const top = 190, bottom = H - 128, maxW = W * 0.74, pad = 18;
    const lay = chat.msgs.map((m) => {
      let font = m.who === 'note' ? f(28, 700) : f(33, m.who === 'me' ? 600 : 400);
      let lh = m.who === 'note' ? 34 : 41;
      let lines = m.who === 'typing' ? [''] : wrap(m.text, m.who === 'note' ? W * 0.82 : maxW, font, m.who === 'ai' ? 15 : 5);
      // A long answer uses smaller text, so it still fits under the question.
      if (m.who === 'ai' && lines.length > 9) {
        font = f(27, 400);
        lh = 33;
        lines = wrap(m.text, W * 0.8, font, 15);
      }
      return { m, font, lh, lines, h: lines.length * lh + pad * 2 };
    });
    const total = lay.reduce((s, l) => s + l.h + 16, 0);
    let y = total > bottom - top ? bottom - total : top;
    g.save();
    g.beginPath(); g.rect(0, top - 8, W, bottom - top + 8); g.clip();
    for (const { m, font, lh, lines, h } of lay) {
      g.font = font;
      const tw = m.who === 'typing' ? 90 : Math.max(...lines.map((l) => g.measureText(l).width));
      const bw = tw + pad * 2;
      const x = m.who === 'me' ? W - 24 - bw : m.who === 'note' ? (W - bw) / 2 : 24;
      if (m.who === 'ai' || m.who === 'typing') {
        g.fillStyle = '#ffffff';
        g.strokeStyle = m.color ?? '#d9d3de';
        g.lineWidth = m.color ? 6 : 2;
        g.beginPath(); g.roundRect(x, y, bw, h, [26, 26, 26, 6]); g.fill(); g.stroke();
      } else if (m.who === 'me') {
        g.fillStyle = '#ffbe00';
        g.beginPath(); g.roundRect(x, y, bw, h, [26, 26, 6, 26]); g.fill();
      } else {
        g.fillStyle = m.color ?? '#5a4470';
        g.beginPath(); g.roundRect(x, y, bw, h, h / 2); g.fill();
      }
      if (m.who === 'typing') {
        g.fillStyle = '#9b91a4';
        for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + pad + 14 + i * 30, y + h / 2, 9, 0, 7); g.fill(); }
      } else {
        g.fillStyle = m.who === 'note' ? '#ffffff' : m.who === 'me' ? '#24182e' : '#24182e';
        lines.forEach((l, i) => g.fillText(l, x + pad, y + pad + lh * i + lh / 2));
      }
      y += h + 16;
    }
    g.restore();
    // The prompt bar.
    g.fillStyle = '#ffffff';
    g.fillRect(0, H - 120, W, 120);
    g.fillStyle = '#d9d3de';
    g.fillRect(0, H - 120, W, 2);
    g.fillStyle = '#f4f0f6';
    g.strokeStyle = '#5a4470';
    g.lineWidth = 3;
    g.beginPath(); g.roundRect(20, H - 104, W - 112, 70, 35); g.fill(); g.stroke();
    const inp = wrap(chat.input || 'Type a message…', W - 160, f(24, chat.inputBold ? 600 : 400), 2);
    g.fillStyle = chat.input ? '#24182e' : '#9b91a4';
    inp.forEach((l, i) => g.fillText(l, 44, H - 69 + (i - (inp.length - 1) / 2) * 28));
    g.fillStyle = '#ca1f3f';
    g.beginPath(); g.arc(W - 52, H - 69, 34, 0, 7); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(W - 64, H - 86); g.lineTo(W - 34, H - 69); g.lineTo(W - 64, H - 52); g.lineTo(W - 58, H - 69); g.fill();
    g.fillStyle = '#24182e';
    g.beginPath(); g.roundRect(W / 2 - 70, H - 18, 140, 7, 4); g.fill();
    screen.material.map.needsUpdate = true;
  }
  function say(msgs, input = '', inputBold = false) {
    chat = { msgs, input, inputBold };
    drawScreen();
  }

  // ---------- Trusted source: a textbook that opens ----------
  const BW = 1.8, BD = 2.4;
  const book = new THREE.Group();
  const coverMat = mat(COLORS.red, { roughness: 0.6 });
  const pageMat = mat(0xfdfcf8, { roughness: 0.9 });
  const coverGeo = rgeo(BW, 0.04, BD, 0.015);
  const back = new THREE.Mesh(coverGeo, coverMat);
  back.position.y = 0.02;
  const pagesR = new THREE.Mesh(rgeo(BW - 0.08, 0.12, BD - 0.08, 0.02), pageMat);
  pagesR.position.set(0.02, 0.1, 0);
  const rightPage = decal(BW - 0.16, BD - 0.16, () => {}, { px: 320, transparent: false });
  rightPage.rotation.x = -Math.PI / 2;
  rightPage.position.set(0.02, 0.1601, 0);
  // The front half swings open around the spine.
  const flip = new THREE.Group();
  flip.position.set(-BW / 2, 0.16, 0);
  const pagesL = new THREE.Mesh(pagesR.geometry, pageMat);
  pagesL.position.set(BW / 2 - 0.02, 0.06, 0);
  const front = new THREE.Mesh(coverGeo, coverMat);
  front.position.set(BW / 2, 0.14, 0);
  const coverArt = decal(BW - 0.12, BD - 0.12, (g, W, H) => {
    g.fillStyle = '#ca1f3f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffbe00';
    g.fillRect(0, H * 0.12, W, H * 0.05);
    g.fillRect(0, H * 0.83, W, H * 0.05);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${W * 0.15}px ${FONT}`;
    g.fillText('TEXTBOOK', W / 2, H * 0.3);
    g.font = `500 ${W * 0.075}px ${FONT}`;
    g.fillText('Science · Geography', W / 2, H * 0.42);
    g.fillText('· History ·', W / 2, H * 0.5);
    g.strokeStyle = '#ffbe00';
    g.lineWidth = W * 0.03;
    g.beginPath(); g.arc(W / 2, H * 0.67, W * 0.12, 0, 7); g.stroke();
    g.fillStyle = '#ffbe00';
    g.font = `700 ${W * 0.12}px ${FONT}`;
    g.fillText('★', W / 2, H * 0.675);
  }, { px: 200, transparent: false });
  coverArt.rotation.x = -Math.PI / 2;
  coverArt.position.set(BW / 2, 0.1605, 0);
  const leftPage = decal(BW - 0.16, BD - 0.16, (g, W, H) => {
    g.fillStyle = '#fdfcf8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ca1f3f';
    g.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.1);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${W * 0.09}px ${FONT}`;
    g.fillText('Trusted source', W / 2, H * 0.13);
    g.fillStyle = '#24182e';
    g.font = `400 ${W * 0.068}px ${FONT}`;
    ['Written and checked', 'by teachers and', 'experts.', '', 'Check facts here,', 'with your teacher,', 'or on a trusted', 'website.'].forEach((t, i) => g.fillText(t, W / 2, H * (0.3 + i * 0.075)));
  }, { px: 320, transparent: false });
  leftPage.rotation.set(Math.PI / 2, 0, Math.PI); // reads the right way up once the cover flips
  leftPage.position.set(BW / 2 - 0.02, -0.0005, 0);
  flip.add(pagesL, front, coverArt, leftPage);
  for (const m of [back, pagesR, pagesL, front]) m.castShadow = m.receiveShadow = true;
  book.add(back, pagesR, rightPage, flip);
  book.position.set(-2.4, T, 0.65);
  book.rotation.y = 0.12;
  scene.add(book);
  function drawSource(fc) {
    const c = rightPage.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#fdfcf8';
    g.fillRect(0, 0, W, H);
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#5a4470';
    g.font = `700 ${W * 0.075}px ${FONT}`;
    g.fillText(fc ? fc.subject.toUpperCase() : 'CONTENTS', W * 0.08, H * 0.1);
    g.fillStyle = '#d9d3de';
    g.fillRect(W * 0.08, H * 0.14, W * 0.84, 2);
    const lines = (text, font, y0, lh, hi) => {
      g.font = font;
      const words = text.split(' ');
      let cur = '', y = y0;
      const flush = () => {
        if (hi) { g.fillStyle = 'rgba(255,190,0,0.45)'; g.fillRect(W * 0.07, y - lh * 0.45, g.measureText(cur).width + W * 0.02, lh * 0.9); }
        g.fillStyle = '#24182e';
        g.fillText(cur, W * 0.08, y);
        y += lh;
      };
      for (const w of words) {
        if (g.measureText(cur + ' ' + w).width > W * 0.84 && cur) { flush(); cur = w; } else cur = cur ? cur + ' ' + w : w;
      }
      flush();
      return y;
    };
    if (!fc) {
      ['1  Our country', '2  Living things', '3  Water', '4  Earth and space'].forEach((t, i) => lines(t, `400 ${W * 0.068}px ${FONT}`, H * (0.24 + i * 0.09), W * 0.09));
    } else {
      const y = lines(fc.fact, `700 ${W * 0.085}px ${FONT}`, H * 0.24, W * 0.11, true);
      lines(fc.more, `400 ${W * 0.066}px ${FONT}`, y + H * 0.04, W * 0.085);
    }
    rightPage.material.map.needsUpdate = true;
  }
  drawSource(null);
  let bookOpen = false;
  async function setBook(open) {
    if (open === bookOpen) return;
    bookOpen = open;
    const a = flip.rotation.z, b = open ? Math.PI : 0;
    const m0 = magnifier.position.clone(), m1 = open ? new THREE.Vector3(-1.45, T + 0.4, -0.2) : magHome;
    await stage.tween((k) => {
      flip.rotation.z = a + (b - a) * k;
      magnifier.position.lerpVectors(m0, m1, k);
      magnifier.position.y += Math.sin(k * Math.PI) * 0.6;
    }, 0.7);
  }

  // ---------- Magnifying glass ----------
  const magnifier = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 10, 32), mat(COLORS.gold, { metalness: 0.5, roughness: 0.35 }));
  ring.rotation.x = Math.PI / 2;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), new THREE.MeshStandardMaterial({ color: 0xcfe9f2, transparent: true, opacity: 0.35, roughness: 0.05 }));
  lens.rotation.x = -Math.PI / 2;
  lens.userData.noInk = true;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.75, 12), mat(COLORS.purple));
  handle.rotation.z = Math.PI / 2;
  handle.position.x = 0.75;
  magnifier.add(ring, lens, handle);
  magnifier.traverse((m) => m.isMesh && (m.castShadow = true));
  const magHome = new THREE.Vector3(-0.85, T + 0.06, 2.05);
  magnifier.position.copy(magHome);
  magnifier.rotation.y = -0.5;
  scene.add(magnifier);

  // ---------- Exercise book and pencil ----------
  const exBook = rbox(1.3, 0.06, 1.7, 0x6fa8dc, 0.02);
  exBook.position.set(0.55, T + 0.03, 1.55);
  exBook.rotation.y = -0.18;
  const exCover = decal(1.24, 1.64, (g, W, H) => {
    g.fillStyle = '#6fa8dc';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff';
    g.fillRect(W * 0.1, H * 0.08, W * 0.8, H * 0.2);
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${W * 0.075}px ${FONT}`;
    g.fillText('EXERCISE BOOK', W / 2, H * 0.18);
    g.fillStyle = '#ffffff';
    g.font = `500 ${W * 0.075}px ${FONT}`;
    g.textAlign = 'left';
    ['Name: ___________', 'Class: JHS 1', 'Subject: Science'].forEach((t, i) => g.fillText(t, W * 0.12, H * (0.45 + i * 0.12)));
    g.fillStyle = '#ffbe00';
    g.fillRect(0, H * 0.9, W, H * 0.04);
  }, { px: 200, transparent: false });
  exCover.rotation.x = -Math.PI / 2;
  exCover.position.y = 0.031;
  exBook.add(exCover);
  scene.add(exBook);
  const pencil = new THREE.Group();
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6), mat(COLORS.gold));
  const pTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), mat(0xe8c9a0));
  pTip.position.y = 0.62;
  const pEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.1, 6), mat(COLORS.red));
  pEnd.position.y = -0.6;
  pencil.add(pBody, pTip, pEnd);
  pencil.rotation.set(Math.PI / 2, 0, 0.9);
  pencil.position.set(0.7, T + 0.11, 1.5);
  scene.add(pencil);

  // ---------- Desk lamp and a plant ----------
  const lamp = new THREE.Group();
  const lampMat = mat(COLORS.blue);
  const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 24), lampMat);
  lBase.position.y = 0.05;
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), lampMat);
  arm1.position.set(0.15, 0.78, 0);
  arm1.rotation.z = -0.2;
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), lampMat);
  arm2.position.set(0.62, 1.62, 0);
  arm2.rotation.z = -1.0;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.5, 24, 1, true), mat(COLORS.gold, { side: THREE.DoubleSide }));
  shade.position.set(1.08, 1.75, 0);
  shade.rotation.z = 0.5;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat(0xfff6d0, { emissive: 0xffe9a0, emissiveIntensity: 0.9 }));
  bulb.position.set(1.18, 1.58, 0);
  lamp.add(lBase, arm1, arm2, shade, bulb);
  lamp.traverse((m) => m.isMesh && (m.castShadow = true));
  lamp.position.set(-3.7, T, -1.6);
  lamp.rotation.y = -0.5;
  scene.add(lamp);

  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.55, 20), mat(0xc8643c));
  pot.position.y = 0.275;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), mat(0x4a3426));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.5;
  plant.add(pot, soil);
  const leafGeo = new THREE.SphereGeometry(0.2, 12, 8);
  const leafMat = mat(0x2a9d8f);
  [[0, 0.95, 0, 0], [0.22, 0.8, 0.05, -0.6], [-0.22, 0.82, -0.04, 0.6], [0.08, 0.75, 0.22, -0.3], [-0.06, 0.78, -0.22, 0.3]].forEach(([x, y, z, r]) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(0.55, 1.5, 0.3);
    leaf.position.set(x, y, z);
    leaf.rotation.set(z * 1.5, 0, r);
    plant.add(leaf);
  });
  plant.traverse((m) => m.isMesh && (m.castShadow = true));
  plant.position.set(-1.85, T, -1.7);
  scene.add(plant);

  // ---------- The safe (private things) ----------
  const safe = new THREE.Group();
  const SS = 1.5;
  const sBody = rbox(SS, SS, SS, 0x3b3f46, 0.08, { metalness: 0.3, roughness: 0.45 });
  sBody.position.y = SS / 2;
  const hole = box(SS - 0.26, SS - 0.26, 0.02, 0x0b090d);
  hole.position.set(0, SS / 2, SS / 2 - 0.005);
  hole.userData.noInk = true;
  const door = new THREE.Group();
  door.position.set(-(SS - 0.2) / 2, SS / 2, SS / 2 + 0.02);
  const doorSlab = rbox(SS - 0.2, SS - 0.2, 0.08, 0x4a4f58, 0.05, { metalness: 0.35, roughness: 0.4 });
  doorSlab.position.x = (SS - 0.2) / 2;
  const dial = new THREE.Group();
  const dialDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 28), mat(0xd9d3de, { metalness: 0.6, roughness: 0.3 }));
  dialDisc.rotation.x = Math.PI / 2;
  const dialMark = box(0.04, 0.14, 0.02, COLORS.red);
  dialMark.position.set(0, 0.14, 0.05);
  dial.add(dialDisc, dialMark);
  dial.position.set((SS - 0.2) / 2 - 0.15, 0.12, 0.08);
  const lever = rbox(0.42, 0.08, 0.08, 0xd9d3de, 0.03, { metalness: 0.6, roughness: 0.3 });
  lever.position.set((SS - 0.2) / 2 + 0.3, -0.3, 0.08);
  const safeSign = decal(0.86, 0.26, (g, W, H) => {
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.roundRect(0, 0, W, H, 12); g.fill();
    g.fillStyle = '#24182e';
    g.font = `700 ${H * 0.5}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🔒 PRIVATE', W / 2, H * 0.54);
  }, { px: 80, transparent: true });
  safeSign.position.set((SS - 0.2) / 2 - 0.05, 0.43, 0.045);
  door.add(doorSlab, dial, lever, safeSign);
  const footGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.08, 10);
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) {
    const ft = new THREE.Mesh(footGeo, lensMat);
    ft.position.set(x, -0.04, z);
    safe.add(ft);
  }
  safe.add(sBody, hole, door);
  safe.traverse((m) => m.isMesh && (m.castShadow = true));
  safe.position.set(2.95, T + 0.08, -0.8);
  safe.rotation.y = -0.3;
  scene.add(safe);

  // ---------- The "OK to ask" tray ----------
  const tray = new THREE.Group();
  const trayMat = mat(COLORS.green, { roughness: 0.5 });
  const tBase = new THREE.Mesh(rgeo(1.7, 0.06, 1.1, 0.02), trayMat);
  tBase.position.y = 0.03;
  tray.add(tBase);
  for (const [w, d, x, z] of [[1.7, 0.06, 0, 0.52], [1.7, 0.06, 0, -0.52], [0.06, 1.1, 0.82, 0], [0.06, 1.1, -0.82, 0]]) {
    const wall = new THREE.Mesh(rgeo(w, 0.24, d, 0.02), trayMat);
    wall.position.set(x, 0.12, z);
    tray.add(wall);
  }
  const trayTag = decal(1.1, 0.2, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(2, 2, W - 4, H - 4, 10); g.fill();
    g.fillStyle = '#24182e';
    g.font = `700 ${H * 0.58}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('OK TO ASK AI', W / 2, H * 0.55);
  }, { px: 64, transparent: false });
  trayTag.position.set(0, 0.13, 0.556);
  tray.add(trayTag);
  tray.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));
  const kept = new THREE.Group();
  tray.add(kept);
  tray.position.set(2.75, T, 1.35);
  tray.rotation.y = -0.15;
  scene.add(tray);
  const slipGeo = rgeo(1.2, 0.03, 0.55, 0.012);
  const slipMat = mat(0xfdfcf8);

  // The item card that pops out of the phone in part 3.
  const card = new THREE.Group();
  const cardBase = new THREE.Mesh(rgeo(1.5, 0.62, 0.04, 0.03), slipMat);
  const cardText = decal(1.42, 0.54, () => {}, { px: 120, transparent: true });
  cardText.position.z = 0.022;
  card.add(cardBase, cardText);
  card.visible = false;
  scene.add(card);
  function drawCard(text) {
    const c = cardText.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let px = H * 0.3;
    g.font = `700 ${px}px ${FONT}`;
    while (g.measureText(text).width > W * 1.8 && px > 14) g.font = `700 ${(px -= 2)}px ${FONT}`;
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (g.measureText(cur + ' ' + w).width > W * 0.92 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    lines.push(cur);
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * px * 1.2));
    cardText.material.map.needsUpdate = true;
  }

  // ---------- Callouts (most important first: phones show only four) ----------
  const cards = {
    phone: stage.callout(phone, { icon: '🤖', title: 'Chatbot', text: 'It predicts words; it doesn\'t truly "know".', at: [PW / 2, PH - 0.6, 0], dx: 170, dy: -20, onClick: () => explain('phone') }),
    prompt: stage.callout(promptSpot, { icon: '✍️', title: 'Your prompt', text: 'Clear questions get clearer answers.', dx: -200, dy: -70, onClick: () => explain('prompt') }),
    book: stage.callout(book, { icon: '📖', title: 'Trusted source', text: 'Check facts in a textbook or with a teacher.', at: [0.55, 0.12, 1.0], dx: -60, dy: 100, onClick: () => explain('book') }),
    safe: stage.callout(safe, { icon: '🔒', title: 'Private stuff', text: 'Names, PINs and addresses stay out.', at: [0, SS + 0.05, 0], dx: 40, dy: -90, onClick: () => explain('safe') }),
    answer: stage.callout(answerSpot, { icon: '⚠️', title: 'Sounds sure', text: 'It can sound sure and still be wrong.', dx: -170, dy: -40 }),
  };
  const ABOUT = {
    phone: ['🤖 What is a chatbot?', '<p>A chatbot like this one is a kind of <b>AI</b> (artificial intelligence). It has read a huge amount of text, and it writes answers by <b>predicting which words usually come next</b>.</p><p>It does not truly <b>know</b> or <b>understand</b> things the way you do, so it can make mistakes.</p>'],
    prompt: ['✍️ Your prompt', '<p>The message you type to an AI is called a <b>prompt</b>. A clear prompt says <b>what</b> you want, <b>who</b> it is for and <b>how</b> it should look.</p>'],
    book: ['📖 Trusted sources', '<p>When an AI tells you a fact, <b>check it</b> in a textbook, with your teacher, or on a trusted website (like a government or school site). Never copy a fact you have not checked.</p>'],
    safe: ['🔒 Keep private things private', '<p>Things you type into a chatbot may be <b>saved</b> and <b>read by other people</b>. Never type your full name with your school, your address, passwords, PINs or photos of other people.</p>'],
  };
  function explain(k) {
    ui.info(...ABOUT[k]);
    if (k === 'book' && part === 2) checkSource();
  }
  stage.clickable(phone, () => explain('phone'));
  stage.clickable(book, () => (part === 2 ? checkSource() : (setBook(!bookOpen), explain('book'))));
  stage.clickable(safe, () => explain('safe'));

  // ---------- Side panel: the three parts ----------
  let part = 1;
  const tabs = ui.group('Three parts');
  const tabBtns = [
    ui.button('1 ✍️ Prompt', () => showPart(1), { group: tabs }),
    ui.button('2 🔍 Check', () => showPart(2), { group: tabs }),
    ui.button('3 🔒 Private?', () => showPart(3), { group: tabs }),
  ];
  const box3 = ui.group('');
  let run = 0; // bumps when the part changes, so old animations stop updating the screen
  function showPart(n) {
    part = n;
    run++;
    ui.toggle(tabBtns, tabBtns[n - 1]);
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n - 1)));
    box3.innerHTML = '';
    card.visible = false;
    if (n !== 2) setBook(false);
    [partPrompt, partCheck, partPrivate][n - 1]();
  }
  const title = (t) => ui.element(`<span class="lab-group-title">${esc(t)}</span>`, box3);

  // ---------- Part 1: build a clear prompt ----------
  const on = { task: false, who: false, format: false, tone: false };
  const promptText = () => {
    let t = on.task ? PIECES[0].text : VAGUE;
    for (const p of PIECES.slice(1)) if (on[p.id]) t += ' ' + p.text;
    return t + '.';
  };
  const score = () => 10 + PIECES.reduce((s, p) => s + (on[p.id] ? WEIGHT[p.id] : 0), 0);
  function partPrompt() {
    title('Build your prompt');
    const view = ui.element('<div class="mail-card"><small class="mail-count">Your prompt</small><p class="ai-prompt" style="margin:4px 0 8px;font-weight:600"></p><div class="meter"><span></span></div><p class="crack ai-clarity" style="margin-top:6px"></p></div>', box3);
    const pEl = view.querySelector('.ai-prompt');
    const bar = view.querySelector('.meter span');
    const cl = view.querySelector('.ai-clarity');
    title('Add pieces (press to add or remove)');
    const chipBtns = PIECES.map((p) => {
      const b = ui.button(`${p.icon} ${p.name}: “${p.text}”`, () => {
        on[p.id] = !on[p.id];
        refresh();
      }, { group: box3 });
      b.style.textAlign = 'left';
      return b;
    });
    const send = ui.button('📤 Send to AI Helper', () => sendPrompt(), { primary: true, group: box3 });
    function refresh() {
      chipBtns.forEach((b, i) => {
        b.classList.toggle('active', on[PIECES[i].id]);
        b.setAttribute('aria-pressed', String(on[PIECES[i].id]));
      });
      const s = Math.min(100, score());
      const p = promptText();
      pEl.textContent = p;
      bar.style.width = s + '%';
      bar.style.background = s < 50 ? '#ca1f3f' : s < 90 ? '#ffbe00' : '#2ec4b6';
      const missing = PIECES.slice(0, 3).filter((x) => !on[x.id]);
      cl.innerHTML = `Clarity: <b>${s}%</b>${missing.length ? ` · still missing: ${missing.map((x) => esc(x.name.toLowerCase())).join(', ')}` : ' · clear prompt! ✅'}`;
      if (!sending) say(lastChat ?? welcome(), p, true);
    }
    refresh();
    send.setAttribute('aria-label', 'Send the prompt to AI Helper');
  }
  const welcome = () => [{ who: 'ai', text: 'Hello! I\'m AI Helper, a pretend chatbot for practice. Ask me something!' }];
  let lastChat = null;
  let sending = false;
  async function sendPrompt() {
    if (sending) return;
    sending = true;
    const r = run;
    const p = promptText();
    const ans = answerFor(on);
    say([{ who: 'me', text: p }, { who: 'typing' }]);
    stage.reveal();
    await stage.wait(0.8);
    sending = false;
    if (r !== run) return;
    lastChat = [{ who: 'me', text: p }, { who: 'ai', text: ans.join('\n') }];
    say(lastChat, p, true);
    const full = on.task && on.who && on.format;
    const missing = PIECES.slice(0, 3).filter((x) => !on[x.id]);
    const answerHtml = `<div class="mail-card" style="margin:6px 0 8px">${ans.map((l) => `<p style="margin:4px 0">${esc(l)}</p>`).join('')}</div>`;
    if (full) {
      ui.complete('prompt');
      ui.info('✅ A clear prompt, a focused answer!', `<p>You said <b>what</b> you want, <b>who</b> it is for and <b>how</b> to lay it out. Look how short and useful the answer is:</p>${answerHtml}<p>Next: press <b>2 🔍 Check</b>. Even a clear answer can contain mistakes!</p>`);
    } else {
      ui.info(on.task ? '🙂 Better, but it could be clearer' : '😕 A vague prompt gets a vague answer', `<p>${on.task ? 'The helper knows the topic now, but not who it is for or how to lay it out.' : '“Rivers” could mean any river in the world, for anyone. So the helper rambles on.'}</p>${answerHtml}<p><b>Add:</b></p><ul>${missing.map((x) => `<li>${x.icon} ${x.tip}</li>`).join('')}</ul>`);
    }
  }

  // ---------- Part 2: check the AI's answers ----------
  let qi = 0, judged = false, right = 0, results = [];
  function partCheck() {
    title('Check the AI\'s answers');
    const view = ui.element('<div class="mail-card ai-q"></div>', box3);
    const q = view.querySelector('.ai-q');
    const row = ui.group('');
    box3.appendChild(row);
    const draw = () => {
      row.innerHTML = '';
      const tally = `<small class="mail-count">Answer ${Math.min(qi + 1, FACTS.length)} of ${FACTS.length} · ✅ ${right} judged right · ❌ ${results.length - right} mistakes</small>`;
      if (qi >= FACTS.length) {
        const perfect = right === FACTS.length;
        q.innerHTML = `<p class="mail-done">${perfect ? '🏆' : '🔁'} You judged <b>${right} of ${FACTS.length}</b> correctly.</p><small class="mail-count">${perfect ? 'Brilliant fact-checking!' : 'Try again to get all 6 right. Use 📖 Check the source when unsure.'}</small>`;
        ui.button('↺ Try again', () => { qi = 0; right = 0; results = []; judged = false; setBook(false); askNext(); draw(); }, { group: row });
        if (perfect) ui.button('Next: 3 🔒 Private? ▶', () => showPart(3), { primary: true, group: row });
        return;
      }
      const fc = FACTS[qi];
      q.innerHTML = `<div class="mail-row"><span>You:</span> ${esc(fc.q)}</div><div class="mail-row"><span>AI:</span> <b>${esc(fc.a)}</b></div>${tally}`;
      if (!judged) {
        ui.button('👍 Looks right', () => judge(true), { group: row });
        ui.button('❌ Wrong!', () => judge(false), { primary: true, group: row });
      } else ui.button(qi + 1 < FACTS.length ? 'Next answer ▶' : 'See my score ▶', () => { qi++; judged = false; setBook(false); askNext(); draw(); }, { primary: true, group: row });
      ui.button('📖 Check the source', () => checkSource(), { group: row });
    };
    function judge(saysRight) {
      if (judged) return;
      judged = true;
      const fc = FACTS[qi];
      const good = saysRight === fc.ok;
      results.push(good);
      if (good) right++;
      const note = fc.ok ? { who: 'note', text: '✓ Checked: this is correct', color: '#2a9d8f' } : { who: 'note', text: `✗ Wrong! ${fc.fact}`, color: '#ca1f3f' };
      say([{ who: 'me', text: fc.q }, { who: 'ai', text: fc.a, color: fc.ok ? '#2ec4b6' : '#ca1f3f' }, note]);
      stage.reveal();
      const head = good ? (fc.ok ? '✅ Yes, that one is right' : '🕵️ Well caught! The AI was wrong') : (fc.ok ? '🤔 Actually, that one is right' : '😟 Careful! The AI was wrong');
      ui.info(head, `<p><b>The trusted source says:</b> ${esc(fc.fact)} ${esc(fc.more)}</p>${fc.ok ? '<p>Good answers still need checking: you only know it is right because you checked.</p>' : '<p>The AI sounded just as sure as when it was right. Made-up or wrong answers like this are sometimes called <b>hallucinations</b>.</p>'}`);
      if (qi === FACTS.length - 1 && right === FACTS.length) ui.complete('check');
      draw();
    }
    askNext();
    draw();
    if (qi === 0 && !judged) ui.info('🔍 Can you trust it?', '<p>The helper will answer 6 questions. It always sounds confident, but <b>some answers are wrong</b>.</p><p>For each one, decide: <b>👍 Looks right</b> or <b>❌ Wrong!</b> Not sure? Press <b>📖 Check the source</b> to open the textbook.</p>');
  }
  function askNext() {
    if (qi >= FACTS.length) {
      say([{ who: 'ai', text: `That's all my answers! You caught ${right} of ${FACTS.length}.` }]);
      return;
    }
    const fc = FACTS[qi];
    say([{ who: 'me', text: fc.q }, { who: 'ai', text: fc.a }], '');
  }
  async function checkSource() {
    if (part !== 2 || qi >= FACTS.length) return;
    const fc = FACTS[qi];
    drawSource(fc);
    ui.info('📖 The textbook says…', `<p><b>${esc(fc.fact)}</b></p><p>${esc(fc.more)}</p><p>Now compare it with the AI's answer: “${esc(fc.a)}”</p>`);
    await setBook(true);
  }

  // ---------- Part 3: OK to ask, or never? ----------
  let order = ITEMS.map((_, i) => i), ii = 0, good3 = 0, busy3 = false;
  function partPrivate() {
    title('Safe or never?');
    const view = ui.element('<div class="mail-card ai-item"></div>', box3);
    const v = view.querySelector('.ai-item');
    const row = ui.group('');
    box3.appendChild(row);
    const draw = () => {
      row.innerHTML = '';
      if (ii >= ITEMS.length) {
        const perfect = good3 === ITEMS.length;
        v.innerHTML = `<p class="mail-done">${perfect ? '🏆' : '🔁'} You sorted <b>${good3} of ${ITEMS.length}</b> correctly.</p>`;
        ui.button('↺ Try again', () => { order = shuffle(order); ii = good3 = 0; kept.clear(); showItem(); draw(); }, { group: row });
        return;
      }
      v.innerHTML = `<small class="mail-count">Item ${ii + 1} of ${ITEMS.length} · ✅ ${good3} right</small><p style="margin:6px 0;font-size:16px"><b>“${esc(ITEMS[order[ii]].t)}”</b></p><small class="mail-count">Would you type this into an AI chatbot?</small>`;
      ui.button('✅ OK to ask AI', () => sort(true), { group: row });
      ui.button('🔒 Never type into AI', () => sort(false), { primary: true, group: row });
    };
    async function sort(saysOk) {
      if (busy3 || ii >= ITEMS.length) return;
      busy3 = true;
      const r = run;
      const it = ITEMS[order[ii]];
      const good = saysOk === it.ok;
      if (good) good3++;
      ui.info(good ? (it.ok ? '✅ Yes, that\'s fine to ask' : '🔒 Right, never type that') : (it.ok ? '🤔 Actually, that one is fine' : '⚠️ Careful! Keep that private'), `<p>${esc(it.why)}</p>`);
      say([{ who: 'note', text: it.ok ? '✓ OK to ask' : '🔒 Stopped: private!', color: it.ok ? '#2a9d8f' : '#ca1f3f' }], it.t, true);
      stage.reveal();
      await flyCard(it);
      busy3 = false;
      if (r !== run) return;
      ii++;
      if (ii >= ITEMS.length) finishPrivate();
      else showItem();
      draw();
    }
    showItem();
    draw();
    if (ii === 0) ui.info('🔒 Safe or never?', '<p>Things you type into a chatbot can be <b>saved</b>, and may be <b>read by other people</b>. For each one, decide: is it <b>OK to ask AI</b>, or something you should <b>never type into AI</b>?</p>');
  }
  function showItem() {
    if (ii >= ITEMS.length) return;
    say([{ who: 'ai', text: 'What would you like to ask me?' }], ITEMS[order[ii]].t, true);
  }
  async function flyCard(it) {
    drawCard(it.t);
    card.visible = true;
    const p0 = phone.localToWorld(new THREE.Vector3(0, 0.4, 0.4));
    card.position.copy(p0);
    card.rotation.set(0, 0, 0);
    card.scale.setScalar(0.3);
    await stage.tween((k) => {
      card.position.set(p0.x, p0.y + k * 0.9, p0.z + k * 0.6);
      card.scale.setScalar(0.3 + k * 0.7);
    }, 0.35);
    const a = card.position.clone();
    if (it.ok) {
      const n = kept.children.length;
      const b = tray.localToWorld(new THREE.Vector3(0, 0.1 + n * 0.035, 0));
      await stage.tween((k) => {
        card.position.lerpVectors(a, b, k);
        card.position.y += Math.sin(k * Math.PI) * 1.0;
        card.rotation.x = -k * Math.PI / 2;
        card.rotation.y = tray.rotation.y * k;
      }, 0.7);
      const slip = new THREE.Mesh(slipGeo, slipMat);
      slip.position.set((n % 2) * 0.06 - 0.03, 0.08 + n * 0.035, (n % 3 - 1) * 0.04);
      slip.rotation.y = (n % 3 - 1) * 0.08;
      kept.add(slip);
      card.visible = false;
    } else {
      const open = (to) => { const s = door.rotation.y; return stage.tween((k) => (door.rotation.y = s + (to - s) * k), 0.35); };
      await open(-1.7);
      const b = safe.localToWorld(new THREE.Vector3(0, SS / 2, 0));
      await stage.tween((k) => {
        card.position.lerpVectors(a, b, k);
        card.position.y += Math.sin(k * Math.PI) * 0.8;
        card.rotation.y = safe.rotation.y * k;
        card.scale.setScalar(1 - k * 0.45);
      }, 0.6);
      card.visible = false;
      await open(0);
      const d0 = dial.rotation.z;
      await stage.tween((k) => (dial.rotation.z = d0 + k * Math.PI * 1.5), 0.4);
    }
  }
  function finishPrivate() {
    const perfect = good3 === ITEMS.length;
    if (perfect) ui.complete('private');
    say([{ who: 'ai', text: 'Remember: use me to learn, not to copy. And always say when you used AI!' }]);
    ui.info(perfect ? '🏆 Private stuff stays private!' : '🔁 Nearly there', `<p>You sorted <b>${good3} of ${ITEMS.length}</b> correctly.${perfect ? '' : ' Press <b>↺ Try again</b> to get them all right.'}</p><p><b>🤝 Using AI honestly</b></p><ul><li>Use AI to <b>learn</b> and get ideas, <b>not to copy</b>. Do the work in your own words.</li><li><b>Check</b> its facts in a trusted source.</li><li><b>Say when you used it</b>, e.g. “I used a chatbot to get ideas for my poster.”</li><li>Only use real AI tools with a <b>mentor or parent</b> nearby.</li></ul>`);
  }

  // On a narrow (phone) canvas the safe's card sits below it, clear of the phone screen.
  stage.onTick((dt, t) => {
    bulb.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.1;
    const small = stage.renderer.domElement.clientWidth < 520;
    cards.safe.dy = small ? 80 : -90;
    cards.safe.dx = small ? 20 : 40;
  });

  showPart(1);
  ui.info('💬 Meet AI Helper', '<p>This phone runs a <b>pretend</b> chatbot: every answer was written in advance, so it is safe to practise here. There are <b>three parts</b>: write a clear prompt, check the answers, and keep private things private.</p><p>Most of you will use real AI tools only with a <b>mentor or parent</b>, and that is exactly right.</p>');
}

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const missions = [
  { id: 'prompt', text: 'Part 1: build a clear prompt (task + who it\'s for + format) and send it.', hint: 'Press the pieces to add them. Watch the clarity meter fill up, then press Send.' },
  { id: 'check', text: 'Part 2: judge all 6 of the AI\'s answers correctly in one round.', hint: 'Not sure? Press 📖 Check the source before you decide.' },
  { id: 'private', text: 'Part 3: sort all 8 things correctly: OK to ask AI, or never type into AI.', hint: 'Anything that shows who or where you are, or unlocks your accounts, stays private.' },
];

export const config = { camera: [3.2, 9, 11], target: [0, 2.9, 0.2], shadowSize: 8, frame: 0.76, minDistance: 4 };
