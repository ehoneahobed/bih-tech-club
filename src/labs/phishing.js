// Sessions 13 & 33 — Spot the Phish: emails fly onto the desk one at a time.
// Read the sender, subject, message and link, then sort each into the inbox
// tray (safe) or the shredder (phishing). Every answer explains the clues.
import { THREE, COLORS, box, rbox, mat, decal } from './runtime.js';

// All names and addresses are fictional except the well-known Google sign-in pattern.
const EMAILS = [
  {
    from: 'Mobile Money Support', addr: 'support@m0bilemoney-gh.com', subject: 'URGENT!!! Your wallet will be BLOCKED in 2 hours',
    body: 'Dear customer, we detected a problem. To keep your money safe, confirm your PIN now or your account will be closed today.',
    link: 'http://m0bilemoney-gh-verify.com/pin', phish: true,
    clues: ['The address uses a zero: “m<b>0</b>bilemoney”', 'Panic words: URGENT, BLOCKED, 2 hours', 'It asks for your <b>PIN</b>. Real companies never do', 'The link has no padlock (http)'],
  },
  {
    from: 'Mrs. Owusu (Tech Club mentor)', addr: 'a.owusu@bozomamodeljhs.edu.gh', subject: 'Bring your USB drive on Friday',
    body: 'Hello Tech Club, on Friday we will copy our capstone folders. Please bring a USB drive if you have one. See you in the lab!',
    link: null, phish: false,
    clues: ['The sender is your mentor, from the school\'s own .edu.gh address', 'No link, no attachment, no request for passwords', 'It matches what you were told in class'],
  },
  {
    from: 'Exam Results Portal', addr: 'results@exam-check-free.net', subject: 'See your BECE results EARLY: pay GH₵ 5',
    body: 'Be the first to see your results! Send GH₵ 5 by mobile money and type your index number and date of birth here.',
    link: 'http://exam-check-free.net/early', phish: true,
    clues: ['Results are never released "early" for money', 'Asks for payment and personal details', 'A strange web address, not an official one'],
  },
  {
    from: 'Google', addr: 'no-reply@accounts.google.com', subject: 'New sign-in on a Windows computer',
    body: 'Your account was just signed in to on a Windows device. If this was you, you don\'t need to do anything. If not, we\'ll help you secure your account.',
    link: 'https://myaccount.google.com/notifications', phish: false,
    clues: ['The address really ends in google.com', 'It does not ask for your password', 'It says “If this was you, you don\'t need to do anything”', 'Still smart: open the website yourself instead of clicking the link'],
  },
  {
    from: 'Kofi', addr: 'kofi.mensah.gh2011@gmail.com', subject: 'lol is this YOU in this video?? 😂😂',
    body: 'omg everybody is sharing it. click quick before they delete it',
    link: 'http://bit.ly/v1de0-y0u', phish: true,
    clues: ['Even a friend\'s account can be hacked and send scam links', 'Hidden short link (bit.ly) with odd spelling', 'Pressure: “click quick before they delete it”', 'If unsure, ask Kofi in person'],
  },
  {
    from: 'School Library', addr: 'library@bozomamodeljhs.edu.gh', subject: 'Reminder: your library book is due on Monday',
    body: 'Hello, “Things Fall Apart” is due back on Monday. You can renew it at the library desk.',
    link: null, phish: false,
    clues: ['Comes from the school address', 'Asks you to come to the desk, not to click or pay', 'Calm, normal tone'],
  },
  {
    from: 'ShopGhana Prize Team', addr: 'winner@shopghana-prizes.win', subject: '🎉 Congratulations! You WON a brand-new phone',
    body: 'You are our lucky winner! Just pay a small delivery fee of GH₵ 50 and send your home address and a photo of your ID.',
    link: 'http://shopghana-prizes.win/claim', phish: true,
    clues: ['You cannot win a competition you never entered', 'Asks for money, home address and ID', 'Odd domain ending: .win'],
  },
  {
    from: 'Mr. Asante (Head Teacher)', addr: 'k.asante@bozomamodeljhs.edu.gh', subject: 'Science fair: our team list',
    body: 'Congratulations to our science fair team! The full list is on the notice board. Well done everyone.',
    link: null, phish: false,
    clues: ['School address and a real school event', 'Sends you to the notice board, not to a link', 'No request for anything private'],
  },
];

export default function phishingLab(stage, ui) {
  const { scene } = stage;
  let order = shuffle(EMAILS.map((_, i) => i));
  let at = 0;
  let score = 0;
  let caught = 0;
  let spotted = 0;
  let busy = false;

  // ---------- The desk ----------
  const desk = rbox(10, 0.3, 5, 0xc8a27a, 0.05);
  desk.position.y = 1.5;
  scene.add(desk);
  // Opaque (no blending) so it is cheap to draw on slow PCs.
  const grain = decal(9.9, 4.9, (g, W, H) => {
    g.fillStyle = '#c8a27a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,80,40,0.18)';
    g.lineWidth = 2;
    for (let k = 0; k < 26; k++) {
      const y = (k + 0.5) * (H / 26);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 90 + k * 1.7) * 4);
      g.stroke();
    }
  }, { px: 256, transparent: false });
  grain.material.color.setScalar(0.82);
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = 1.652;
  scene.add(grain);
  for (const x of [-4.6, 4.6]) for (const z of [-2.1, 2.1]) {
    const leg = rbox(0.28, 1.36, 0.28, 0x8a6a4a, 0.04);
    leg.position.set(x, 0.68, z);
    scene.add(leg);
  }
  const deskMat = rbox(4.4, 0.025, 2.7, 0x3a2b47, 0.012);
  deskMat.position.set(0, 1.663, 0.55);
  scene.add(deskMat);

  // ---------- Laptop ----------
  const laptop = rbox(2.6, 0.1, 1.8, 0xc9c3cf, 0.04, { metalness: 0.35, roughness: 0.4 });
  laptop.position.set(0, 1.725, 0.4);
  scene.add(laptop);
  const keys = decal(2.3, 0.95, (g, W, H) => {
    const rows = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const kw = W / 12.4, kh = H / 5.6;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${kh * 0.42}px Rubik, system-ui, sans-serif`;
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      const x = kw * (0.9 + c + r * 0.35), y = kh * (0.3 + r * 1.08);
      g.fillStyle = '#2b2530';
      g.beginPath(); g.roundRect(x, y, kw * 0.88, kh * 0.9, 5); g.fill();
      g.fillStyle = '#ffffff';
      g.fillText(ch, x + kw * 0.44, y + kh * 0.46);
    }));
    g.fillStyle = '#2b2530';
    g.beginPath(); g.roundRect(kw * 3.2, kh * 4.6, kw * 6, kh * 0.9, 5); g.fill();
    g.beginPath(); g.roundRect(kw * 10.6, kh * 1.38, kw * 1.4, kh * 1.98, 5); g.fill();
    g.fillStyle = '#ffffff';
    g.font = `bold ${kh * 0.3}px Rubik, system-ui, sans-serif`;
    g.fillText('Enter', kw * 11.3, kh * 2.4);
  }, { px: 320 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 1.777, 0.05);
  scene.add(keys);
  const pad = rbox(0.9, 0.012, 0.5, 0xb5aebb, 0.005);
  pad.position.set(0, 1.776, 0.98);
  scene.add(pad);
  const lid = rbox(2.6, 1.7, 0.08, 0xc9c3cf, 0.04, { metalness: 0.35, roughness: 0.4 });
  lid.position.set(0, 2.6, -0.5);
  lid.rotation.x = -0.2;
  scene.add(lid);
  // The screen shows a mail app with the email being checked.
  const screen = decal(2.48, 1.58, () => {}, { px: 640, transparent: false });
  screen.position.z = 0.042;
  lid.add(screen);
  function drawMail(e, n) {
    const tex = screen.material.map, c = tex.image, g = c.getContext('2d');
    const W = c.width, H = c.height, f = (px, w = 'normal') => `${w} ${px}px Rubik, system-ui, sans-serif`;
    g.fillStyle = '#1b1520';
    g.fillRect(0, 0, W, H);
    const x0 = W * 0.025, y0 = H * 0.04, w = W * 0.95, h = H * 0.92;
    g.fillStyle = '#ffffff';
    g.fillRect(x0, y0, w, h);
    g.fillStyle = '#24182e';
    g.fillRect(x0, y0, w, h * 0.1);
    g.fillStyle = '#ffffff';
    g.font = f(h * 0.05, 'bold');
    g.textBaseline = 'middle';
    g.fillText('✉  Mail', x0 + w * 0.02, y0 + h * 0.05);
    // Folders.
    g.fillStyle = '#f4f0f6';
    g.fillRect(x0, y0 + h * 0.1, w * 0.2, h * 0.9);
    ['Inbox', 'Sent', 'Spam', 'Trash'].forEach((t, k) => {
      if (!k) { g.fillStyle = '#ffbe00'; g.fillRect(x0, y0 + h * 0.13, w * 0.2, h * 0.08); }
      g.fillStyle = '#24182e';
      g.font = f(h * 0.042, k ? 'normal' : 'bold');
      g.fillText(t, x0 + w * 0.03, y0 + h * (0.17 + k * 0.1));
    });
    const rx = x0 + w * 0.23, rw = w * 0.74;
    let y = y0 + h * 0.17;
    g.fillStyle = '#24182e';
    if (!e) {
      g.font = f(h * 0.07, 'bold');
      g.fillText('All emails sorted!', rx, y + h * 0.1);
      g.font = f(h * 0.045);
      g.fillText('Press "New round" to play again.', rx, y + h * 0.2);
      tex.needsUpdate = true;
      return;
    }
    const line = (text, px, weight, color) => {
      g.fillStyle = color;
      g.font = f(px, weight);
      // Wrap long text onto more lines.
      const words = text.split(' ');
      let cur = '';
      for (const wd of words) {
        if (g.measureText(cur + wd).width > rw && cur) { g.fillText(cur, rx, y); y += px * 1.3; cur = ''; }
        cur += wd + ' ';
      }
      g.fillText(cur, rx, y);
      y += px * 1.45;
    };
    line(`Email ${n} of ${EMAILS.length}`, h * 0.036, 'normal', '#9b91a4');
    line(e.from, h * 0.05, 'bold', '#24182e');
    line(`<${e.addr}>`, h * 0.04, 'normal', '#5a4470');
    line(e.subject, h * 0.048, 'bold', '#24182e');
    g.fillStyle = '#d9d3de';
    g.fillRect(rx, y - h * 0.02, rw, 2);
    y += h * 0.03;
    line(e.body.replace(/<[^>]+>/g, ''), h * 0.04, 'normal', '#3b3f46');
    if (e.link) {
      g.fillStyle = '#5a4470';
      g.beginPath(); g.roundRect(rx, y - h * 0.035, w * 0.2, h * 0.075, 10); g.fill();
      g.fillStyle = '#ffffff';
      g.font = f(h * 0.04, 'bold');
      g.fillText('Click here', rx + w * 0.03, y + h * 0.002);
    }
    tex.needsUpdate = true;
  }

  // ---------- Inbox tray (a wire letter tray) ----------
  const tray = new THREE.Group();
  const wire = 0x2a9d8f;
  const tb = rbox(1.8, 0.04, 1.3, wire, 0.015);
  tb.position.y = 0.02;
  tray.add(tb);
  const rod = (a, b) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, A.distanceTo(B), 6), mat(wire, { metalness: 0.4, roughness: 0.4 }));
    m.position.copy(A).lerp(B, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    tray.add(m);
  };
  const X = 0.88, Z = 0.63;
  // Top and middle rims, lower at the front so letters slide in.
  for (const y of [0.18, 0.36]) {
    rod([-X, y, -Z], [X, y, -Z]);
    rod([-X, y, -Z], [-X, y * 0.6, Z]);
    rod([X, y, -Z], [X, y * 0.6, Z]);
  }
  rod([-X, 0.2, Z], [X, 0.2, Z]);
  for (const x of [-X, -X / 3, X / 3, X]) rod([x, 0.03, -Z], [x, 0.36, -Z]);
  for (const x of [-X, X]) rod([x, 0.03, Z], [x, 0.2, Z]);
  for (const z of [-Z / 3, Z / 3]) for (const x of [-X, X]) rod([x, 0.03, z], [x, 0.36 - (z + Z) / (2 * Z) * 0.14, z]);
  const tag = decal(0.7, 0.18, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(2, 2, W - 4, H - 4, 10); g.fill();
    g.fillStyle = '#24182e';
    g.font = `bold ${H * 0.6}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('INBOX', W / 2, H * 0.55);
  }, { px: 64, transparent: false });
  tag.position.set(0, 0.11, Z + 0.03);
  tag.userData.noInk = false;
  tray.add(tag);
  const kept = new THREE.Group();
  tray.add(kept);
  tray.position.set(-3.4, 1.65, 0.6);
  scene.add(tray);

  // ---------- Shredder: cutting head on a bin with a window ----------
  const shredder = new THREE.Group();
  const sb = rbox(1.5, 1.0, 1.1, 0x3b3f46, 0.06);
  sb.position.y = 0.5;
  const win = decal(1.0, 0.65, (g, W, H) => {
    g.fillStyle = '#1b1520';
    g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(W * 0.1, H * 0.7); g.lineTo(W * 0.35, H * 0.15); g.stroke();
  }, { px: 128, transparent: true });
  win.position.set(0, 0.5, 0.552);
  const head = rbox(1.6, 0.3, 1.2, 0x24182e, 0.06);
  head.position.y = 1.15;
  const mouth = box(1.2, 0.03, 0.08, 0x0b090d);
  mouth.position.set(0, 1.3, 0);
  const panel = decal(1.4, 0.3, (g, W, H) => {
    g.fillStyle = '#2ec4b6';
    g.beginPath(); g.arc(W * 0.08, H / 2, H * 0.22, 0, 7); g.fill();
    g.fillStyle = '#ffffff';
    g.font = `bold ${H * 0.34}px Rubik, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText('AUTO', W * 0.16, H / 2);
    g.fillStyle = '#ffbe00';
    g.font = `bold ${H * 0.28}px Rubik, system-ui, sans-serif`;
    g.fillText('⚠ Fingers clear', W * 0.5, H / 2);
  }, { px: 64 });
  panel.rotation.x = -Math.PI / 2;
  panel.position.set(0, 1.302, 0.4);
  shredder.add(sb, win, head, mouth, panel);
  shredder.position.set(3.4, 1.65, 0.6);
  scene.add(shredder);
  const strips = new THREE.Group();
  scene.add(strips);

  // ---------- The email: an envelope with flap, stamp and address ----------
  const envelope = new THREE.Group();
  const env = rbox(1.1, 0.04, 0.75, 0xfdfcf8, 0.012);
  const face = decal(1.08, 0.73, (g, W, H) => {
    g.fillStyle = '#ca1f3f';
    g.fillRect(W * 0.78, H * 0.62, W * 0.16, H * 0.3);
    g.strokeStyle = '#ffffff';
    g.setLineDash([4, 4]);
    g.lineWidth = 3;
    g.strokeRect(W * 0.79, H * 0.64, W * 0.14, H * 0.26);
    g.setLineDash([]);
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.arc(W * 0.86, H * 0.77, H * 0.07, 0, 7); g.fill();
    g.strokeStyle = '#5a4470';
    g.lineWidth = 3;
    g.beginPath(); g.arc(W * 0.72, H * 0.72, H * 0.12, 0, 7); g.stroke();
    g.fillStyle = '#9b91a4';
    [0.66, 0.76, 0.86].forEach((y, k) => g.fillRect(W * 0.1, H * y, W * (k === 2 ? 0.25 : 0.4), H * 0.04));
  }, { px: 128 });
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.022;
  // The flap: a gold triangle folded over the top half.
  const flapShape = new THREE.Shape([new THREE.Vector2(-0.54, -0.37), new THREE.Vector2(0.54, -0.37), new THREE.Vector2(0, 0.05)]);
  const flapGeo = new THREE.ExtrudeGeometry(flapShape, { depth: 0.012, bevelEnabled: false });
  const flap = new THREE.Mesh(flapGeo, mat(COLORS.gold));
  flap.rotation.x = -Math.PI / 2;
  flap.position.y = 0.022;
  flap.castShadow = true;
  envelope.add(env, face, flap);
  scene.add(envelope);

  // ---------- A few desk things ----------
  const note = rbox(0.8, 0.02, 0.8, 0xffe27a, 0.01);
  note.position.set(-1.95, 1.675, 1.7);
  note.rotation.y = 0.12;
  const noteText = decal(0.72, 0.72, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.font = `bold ${H * 0.15}px "Comic Sans MS", Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    ['Think', 'before', 'you click!'].forEach((t, k) => g.fillText(t, W / 2, H * (0.3 + k * 0.22)));
  }, { px: 128 });
  noteText.rotation.x = -Math.PI / 2;
  noteText.position.y = 0.012;
  note.add(noteText);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 20, 1, true), mat(COLORS.blue, { side: THREE.DoubleSide }));
  cup.position.set(-4.3, 1.95, -1.6);
  cup.castShadow = true;
  scene.add(note, cup);
  [[0.08, 0.05, COLORS.red, 0.1], [-0.08, 0.06, COLORS.gold, -0.12], [0.02, -0.1, 0x2a9d8f, 0.05]].forEach(([x, z, c, t]) => {
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), mat(c));
    pen.position.set(-4.3 + x, 2.1, -1.6 + z);
    pen.rotation.set(t, 0, t);
    scene.add(pen);
  });

  // ---------- Callouts ----------
  // Cards on the parts that stay put; their text follows the game.
  const cards = {
    lid: stage.callout(lid, { icon: '🔍', title: 'Check the clues', text: 'Who sent it? Where does the link go?', at: [0, 0.85, 0], dx: 0, dy: -60 }),
    envelope: stage.callout(envelope, { icon: '📧', title: 'New email', at: [0.3, 0, 0.2], dx: 120, dy: 85 }),
    tray: stage.callout(tray, { icon: '✅', title: 'Inbox (safe)', at: [0, 0.4, 0], dx: -60, dy: -95 }),
    shredder: stage.callout(shredder, { icon: '🎣', title: 'Shredder', at: [0, 1.3, 0], dx: 70, dy: -95 }),
  };
  function setCounts(safe, phish) {
    cards.tray.set('Inbox (safe)', `Safe emails go here: ${safe}`);
    cards.shredder.set('Shredder', `Phishing goes here: ${phish}`);
  }
  setCounts(0, 0);

  // ---------- Email card (HTML) ----------
  const card = ui.element('<div class="mail-card"></div>', ui.group('📧 New email: read it carefully'));
  const mail = card.querySelector('.mail-card');
  const choose = ui.group('Is it safe?');
  ui.button('✅ Safe: keep it', () => answer(false), { group: choose });
  ui.button('🎣 Phishing: shred it', () => answer(true), { primary: true, group: choose });

  function showEmail() {
    const e = EMAILS[order[at]];
    drawMail(e, at + 1);
    mail.innerHTML = `
      <div class="mail-row"><span>From:</span> <b>${e.from}</b></div>
      <div class="mail-row addr">&lt;${e.addr}&gt;</div>
      <div class="mail-row"><span>Subject:</span> <b>${e.subject}</b></div>
      <p>${e.body}</p>
      ${e.link ? `<p><a class="mail-link" tabindex="0" title="${e.link}">👉 Click here</a><small class="hover-tip">Hover or tap the link to see where it really goes: <code>${e.link}</code></small></p>` : ''}
      <small class="mail-count">Email ${at + 1} of ${EMAILS.length}</small>`;
    const link = mail.querySelector('.mail-link');
    link?.addEventListener('click', (ev) => {
      ev.preventDefault();
      ui.info('😬 You clicked the link!', '<p>In real life, <b>never</b> click a link just to see what happens. First hover over it to check the real address. Then decide: safe or phishing?</p>');
    });
    cards.envelope.set('New email', `Email ${at + 1} of ${EMAILS.length}: safe or phishing?`);
    cards.lid.set('Check the clues', 'Who sent it? Where does the link go?', '🔍');
    envelope.visible = true;
    const from = new THREE.Vector3(0, 6, -4);
    const to = new THREE.Vector3(0, 1.75, 1.7);
    stage.tween((k) => {
      envelope.position.lerpVectors(from, to, k);
      envelope.rotation.y = (1 - k) * Math.PI * 2;
    }, 0.8);
  }

  async function answer(saysPhish) {
    if (busy || at >= EMAILS.length) return;
    busy = true;
    const e = EMAILS[order[at]];
    const right = saysPhish === e.phish;
    if (right) score++;
    ui.complete('first');
    ui.info(
      right ? (e.phish ? '🎣 Well spotted! It\'s phishing.' : '✅ Correct, this one is safe.') : (e.phish ? '😟 Careful! That was phishing.' : '🤔 Actually, this one is safe.'),
      `<p><b>The clues:</b></p><ul>${e.clues.map((c) => `<li>${c}</li>`).join('')}</ul>${e.phish ? '<p>What to do: don\'t click, don\'t reply, tell a trusted adult and delete it.</p>' : ''}`
    );
    const target = (e.phish ? shredder : tray).position.clone().add(new THREE.Vector3(0, e.phish ? 1.5 : 0.4, 0));
    const start = envelope.position.clone();
    await stage.tween((k) => {
      envelope.position.lerpVectors(start, target, k);
      envelope.position.y += Math.sin(k * Math.PI) * 1.2;
    }, 0.7);
    if (e.phish) {
      caught++;
      if (right && ++spotted >= 3) ui.complete('three');
      await stage.tween((k) => (envelope.position.y = target.y - k * 0.4), 0.3);
      // Paper strips drop into the bin, where you can see them through the window.
      for (let i = 0; i < 8; i++) {
        const s = box(0.05, 0.3, 0.01, i % 3 ? 0xfdfcf8 : COLORS.gold);
        s.userData.noInk = true;
        s.position.set(3.0 + i * 0.11 + Math.random() * 0.04, 2.7, 1.158);
        s.rotation.z = (Math.random() - 0.5) * 0.6;
        s.userData.v = Math.random() * 0.5;
        s.userData.floor = 1.98 + Math.min(0.25, strips.children.length * 0.006) + Math.random() * 0.04;
        strips.add(s);
      }
    } else {
      // Safe emails stay in the tray: one more letter on the pile.
      const n = kept.children.length;
      const letter = rbox(1.0, 0.03, 0.7, 0xfdfcf8, 0.01);
      letter.position.set((n % 2) * 0.05 - 0.02, 0.06 + n * 0.035, 0);
      letter.rotation.y = (n % 3 - 1) * 0.08;
      kept.add(letter);
    }
    envelope.visible = false;
    setCounts(at + 1 - caught, caught);
    at++;
    busy = false;
    if (at < EMAILS.length) return showEmail();
    ui.complete('all');
    if (score >= 7) ui.complete('expert');
    drawMail(null);
    cards.lid.set('All sorted!', `${score} of ${EMAILS.length} right. Try a "New round"`, '🏁');
    mail.innerHTML = `<p class="mail-done">🏁 You sorted all ${EMAILS.length} emails and got <b>${score} of ${EMAILS.length}</b> right.</p>`;
    ui.info(score >= 7 ? '🏆 Phishing expert!' : 'Good effort!', `<p>Score: <b>${score}/${EMAILS.length}</b>.</p><p><b>The 4 big clues of phishing:</b></p><ul><li>Panic and hurry (URGENT!, 2 hours)</li><li>Asks for passwords, PINs, money or ID</li><li>A strange or misspelled address</li><li>Prizes you never entered for</li></ul>`);
  }

  const again = ui.group('');
  ui.button('↺ New round', () => {
    order = shuffle(order);
    at = score = caught = spotted = 0;
    strips.clear();
    kept.clear();
    setCounts(0, 0);
    showEmail();
  }, { group: again });

  stage.onTick((dt) => strips.children.forEach((s) => (s.position.y = Math.max(s.userData.floor, s.position.y - dt * (0.8 + s.userData.v)))));

  showEmail();
  ui.info('Spot the phish 🎣', '<p><b>Phishing</b> is a trick email that tries to make you click a bad link or give away private information. Read each email, check <b>who sent it</b> and <b>where the link really goes</b>, then decide.</p>');
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
  { id: 'first', text: 'Read the first email and decide: Safe or Phishing?', hint: 'Look at the sender\'s full address, not only the name.' },
  { id: 'three', text: 'Catch 3 phishing emails and shred them.', hint: 'Watch for panic words, requests for PINs or money, and odd addresses.' },
  { id: 'all', text: 'Sort all 8 emails.', hint: 'Read every clue in the explanation after each answer.' },
  { id: 'expert', text: 'Score 7 or more out of 8 (press "New round" to try again).', hint: 'Hover over links to see where they really go.' },
];

export const config = { camera: [4.5, 7, 8], target: [0, 2, 0.5], shadowSize: 8 };
