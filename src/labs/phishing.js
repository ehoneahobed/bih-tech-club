// Sessions 7 & 15 — Spot the Phish: emails fly onto the desk one at a time.
// Read the sender, subject, message and link, then sort each into the inbox
// tray (safe) or the shredder (phishing). Every answer explains the clues.
import { THREE, COLORS, box, mat, label, setLabel } from './runtime.js';

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
    from: 'Mr. Asante (Head Teacher)', addr: 'k.asante@bozomamodeljhs.edu.gh', subject: 'Inter-schools tech championship: team list',
    body: 'Congratulations to our capstone team! The full list of representatives is on the notice board. Well done everyone.',
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

  const desk = box(10, 0.3, 5, 0xc8a27a);
  desk.position.y = 1.5;
  scene.add(desk);
  const laptop = box(2.6, 0.12, 1.8, 0xadb5bd);
  laptop.position.set(0, 1.71, 0.4);
  scene.add(laptop);
  const lid = box(2.6, 1.7, 0.08, 0xadb5bd);
  lid.position.set(0, 2.6, -0.5);
  lid.rotation.x = -0.2;
  scene.add(lid);
  const screenGlow = box(2.4, 1.5, 0.02, 0x5a4470, { emissive: 0x24182e });
  screenGlow.position.set(0, 2.6, -0.45);
  screenGlow.rotation.x = -0.2;
  scene.add(screenGlow);

  const tray = new THREE.Group();
  const tb = box(1.8, 0.15, 1.3, COLORS.green);
  tb.position.y = 0.08;
  tray.add(tb);
  for (const [x, z, w, d] of [[0, -0.62, 1.8, 0.06], [0, 0.62, 1.8, 0.06], [-0.87, 0, 0.06, 1.3], [0.87, 0, 0.06, 1.3]]) {
    const side = box(w, 0.35, d, COLORS.green);
    side.position.set(x, 0.2, z);
    tray.add(side);
  }
  tray.position.set(-3.4, 1.65, 0.6);
  scene.add(tray);
  const trayTag = label('✅ Inbox (safe): 0', { scale: 0.42 });
  trayTag.position.set(-3.4, 2.8, 0.6);
  scene.add(trayTag);

  const shredder = new THREE.Group();
  const sb = box(1.6, 1.3, 1.2, 0x343a40);
  sb.position.y = 0.65;
  const mouth = box(1.3, 0.06, 0.2, 0x111111);
  mouth.position.set(0, 1.31, 0);
  shredder.add(sb, mouth);
  shredder.position.set(3.4, 1.65, 0.6);
  scene.add(shredder);
  const shredTag = label('🎣 Shredder (phishing): 0', { scale: 0.42 });
  shredTag.position.set(3.4, 3.3, 0.6);
  scene.add(shredTag);
  const strips = new THREE.Group();
  scene.add(strips);

  const envelope = new THREE.Group();
  const env = box(1.1, 0.04, 0.75, 0xffffff);
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.35, 4), mat(COLORS.gold));
  flap.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  flap.scale.set(1, 1, 0.08);
  flap.position.set(0, 0.04, -0.16);
  envelope.add(env, flap);
  scene.add(envelope);

  // ---------- Email card (HTML) ----------
  const card = ui.element('<div class="mail-card"></div>', ui.group('📧 New email: read it carefully'));
  const mail = card.querySelector('.mail-card');
  const choose = ui.group('Is it safe?');
  ui.button('✅ Safe: keep it', () => answer(false), { group: choose });
  ui.button('🎣 Phishing: shred it', () => answer(true), { primary: true, group: choose });

  function showEmail() {
    const e = EMAILS[order[at]];
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
      for (let i = 0; i < 8; i++) {
        const s = box(0.06, 0.02, 0.6, 0xffffff);
        s.position.set(3.0 + i * 0.11, 1.75, 1.4);
        s.userData.v = Math.random() * 0.5;
        strips.add(s);
      }
    }
    envelope.visible = false;
    setLabel(trayTag, `✅ Inbox (safe): ${at + 1 - caught}`);
    setLabel(shredTag, `🎣 Shredder (phishing): ${caught}`);
    at++;
    busy = false;
    if (at < EMAILS.length) return showEmail();
    ui.complete('all');
    if (score >= 7) ui.complete('expert');
    mail.innerHTML = `<p class="mail-done">🏁 You sorted all ${EMAILS.length} emails and got <b>${score} of ${EMAILS.length}</b> right.</p>`;
    ui.info(score >= 7 ? '🏆 Phishing expert!' : 'Good effort!', `<p>Score: <b>${score}/${EMAILS.length}</b>.</p><p><b>The 4 big clues of phishing:</b></p><ul><li>Panic and hurry (URGENT!, 2 hours)</li><li>Asks for passwords, PINs, money or ID</li><li>A strange or misspelled address</li><li>Prizes you never entered for</li></ul>`);
  }

  const again = ui.group('');
  ui.button('↺ New round', () => {
    order = shuffle(order);
    at = score = caught = spotted = 0;
    strips.clear();
    setLabel(trayTag, '✅ Inbox (safe): 0');
    setLabel(shredTag, '🎣 Shredder (phishing): 0');
    showEmail();
  }, { group: again });

  stage.onTick((dt) => strips.children.forEach((s) => (s.position.y = Math.max(1.66, s.position.y - dt * (0.4 + s.userData.v)))));

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
