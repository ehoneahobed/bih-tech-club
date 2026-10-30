// Sessions 6, 7 & 14 — The internet as a road network. Send web requests
// (HTTP vs HTTPS), follow an email through the digital post office, and watch
// classmates edit a shared document in the cloud.
import { THREE, COLORS, box, mat, label, setLabel } from './runtime.js';

const NODES = {
  you: { name: 'Your computer', pos: [-7, 0, 3], kind: 'pc', color: COLORS.purple, info: 'Your device, in the computer lab. Every request starts here.' },
  router: { name: 'School Wi-Fi router', pos: [-4, 0, 4.5], kind: 'router', color: 0x495057, info: 'Connects the lab computers to each other and passes traffic to the Internet Service Provider.' },
  isp: { name: 'ISP (e.g. mobile network)', pos: [-1.5, 0, 1.5], kind: 'tower', color: 0xadb5bd, info: 'The <b>Internet Service Provider</b> — the company whose "roads" connect your school to the rest of the internet.' },
  hub: { name: 'The Internet', pos: [1.5, 0, -1], kind: 'globe', color: COLORS.blue, info: 'Millions of computers joined by cables, satellites and radio. The <b>internet</b> is the road network; the <b>Web</b> is one kind of traffic on it.' },
  web: { name: 'Web server', pos: [6, 0, -4], kind: 'server', color: COLORS.green, info: 'A computer that stores websites and sends pages to anyone who asks.' },
  mailA: { name: 'School mail server', pos: [-5, 0, -3], kind: 'server', color: COLORS.gold, info: 'Your school\'s digital post office. It sends your outgoing mail.' },
  mailB: { name: 'Friend\'s mail server', pos: [6.5, 0, 1.5], kind: 'server', color: COLORS.gold, info: 'The receiving post office. It keeps the email until your friend opens their inbox.' },
  friend: { name: 'Friend\'s computer', pos: [8.5, 0, 4.5], kind: 'pc', color: COLORS.red, info: 'Kofi, at another school.' },
  teacher: { name: 'Teacher\'s computer', pos: [4, 0, 5.5], kind: 'pc', color: 0x5a4470, info: 'Your teacher, who was Cc\'d.' },
  cloud: { name: 'Cloud drive', pos: [1.5, 0, -5.5], kind: 'cloud', color: 0x90e0ef, info: 'A file stored online so the whole team can work on it at once.' },
  ama: { name: 'Ama (Editor)', pos: [-2.5, 0, -7], kind: 'pc', color: 0x2a9d8f, info: 'Ama can <b>edit</b> the shared document.' },
  yaw: { name: 'Yaw (Commenter)', pos: [5.5, 0, -7.5], kind: 'pc', color: 0xf4a261, info: 'Yaw can <b>comment</b> but not change the text.' },
};
// Cards for the most important places: [icon, title, text, point on it, dx, dy].
const CALLOUTS = {
  you: ['💻', 'Your computer', 'Every request starts here', [0, 1.3, 0], -30, 95],
  router: ['📶', 'Wi-Fi router', 'Joins the lab to the ISP', [0, 0.3, 0], 150, 85],
  hub: ['🌍', 'The Internet', 'A road network of computers', [0.6, 2.4, 0], 230, -105],
  web: ['🗄️', 'Web server', 'Stores websites, sends pages', [0.5, 1.2, 0], 115, 5],
  mailA: ['📮', 'Mail server', 'Your school\'s digital post office', [0, 1.4, 0], -70, -95],
  cloud: ['☁️', 'Cloud drive', 'One shared file, saved online', [0, 1.9, 0], 0, -95],
};
const LINKS = [['you', 'router'], ['router', 'isp'], ['isp', 'hub'], ['hub', 'web'], ['router', 'mailA'], ['mailA', 'hub'], ['hub', 'mailB'], ['mailB', 'friend'], ['mailB', 'teacher'], ['hub', 'cloud'], ['ama', 'cloud'], ['yaw', 'cloud']];

const SITES = [
  { url: 'https://www.wikipedia.org', secure: true, ext: '.org', note: 'An organisation (often non-profit).' },
  { url: 'https://moe.gov.gh', secure: true, ext: '.gov.gh', note: 'A Government of Ghana website — usually reliable for official information.' },
  { url: 'https://www.ug.edu.gh', secure: true, ext: '.edu.gh', note: 'An education institution in Ghana.' },
  { url: 'http://free-phone-prizes.com', secure: false, ext: '.com', note: 'A commercial site. No padlock, and the offer is too good to be true — be very careful!' },
];

export default function internetLab(stage, ui) {
  const { scene } = stage;
  const pos = (id) => new THREE.Vector3(...NODES[id].pos);

  for (const [id, n] of Object.entries(NODES)) {
    const g = new THREE.Group();
    g.position.copy(pos(id));
    if (n.kind === 'pc') {
      const s = box(1.1, 0.75, 0.08, 0x24182e);
      s.position.y = 0.9;
      const scr = box(0.98, 0.62, 0.02, n.color);
      scr.position.set(0, 0.9, 0.05);
      const st = box(0.12, 0.5, 0.12, 0x6c757d);
      st.position.y = 0.3;
      g.add(s, scr, st);
    } else if (n.kind === 'server') {
      for (let i = 0; i < 3; i++) {
        const u = box(1, 0.42, 1, 0x3a2b47);
        u.position.y = 0.25 + i * 0.46;
        const led = box(0.5, 0.06, 0.02, n.color, { emissive: n.color, emissiveIntensity: 0.6 });
        led.position.set(0, 0.25 + i * 0.46, 0.51);
        g.add(u, led);
      }
    } else if (n.kind === 'router') {
      const body = box(1.2, 0.25, 0.8, n.color);
      body.position.y = 0.15;
      g.add(body);
      for (const x of [-0.4, 0.4]) {
        const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), mat(0x212529));
        a.position.set(x, 0.65, -0.3);
        g.add(a);
      }
    } else if (n.kind === 'tower') {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 4, 1, true), mat(n.color, { wireframe: true }));
      t.position.y = 1.5;
      g.add(t);
    } else if (n.kind === 'globe') {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 20), mat(n.color, { roughness: 0.3 }));
      s.position.y = 1.4;
      const w = new THREE.Mesh(new THREE.SphereGeometry(1.23, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }));
      w.position.y = 1.4;
      g.add(s, w);
      stage.onTick((dt) => (w.rotation.y += dt * 0.3));
    } else if (n.kind === 'cloud') {
      for (const [x, y, r] of [[0, 1.2, 0.7], [0.7, 1.0, 0.5], [-0.7, 1.0, 0.5], [0.3, 1.6, 0.5]]) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(0xffffff));
        p.position.set(x, y, 0);
        p.castShadow = true;
        g.add(p);
      }
    }
    // The main places get a callout card (below); the rest keep a small tag.
    if (!CALLOUTS[id]) {
      const t = label(n.name, { scale: 0.62 });
      t.position.y = n.kind === 'tower' ? 3.5 : 2.1;
      g.add(t);
    }
    scene.add(g);
    n.group = g;
    stage.clickable(g, () => select(id));
  }

  function select(id) {
    const n = NODES[id];
    ui.info(n.name, `<p>${n.info}</p>`);
    if (id === 'hub') {
      ui.complete('globe');
      cards.hub.card.classList.add('done');
    }
  }
  // Clicking a card does the same as clicking the place.
  const cards = {};
  for (const [id, [icon, title, text, at, dx, dy]] of Object.entries(CALLOUTS)) {
    cards[id] = stage.callout(NODES[id].group, { icon, title, text, at, dx, dy, onClick: () => select(id) });
  }
  if (ui.isDone('globe')) cards.hub.card.classList.add('done');

  for (const [a, b] of LINKS) {
    const pa = pos(a).setY(0.08);
    const pb = pos(b).setY(0.08);
    const len = pa.distanceTo(pb);
    const road = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, len), mat(0x6c757d));
    road.position.copy(pa).lerp(pb, 0.5);
    road.lookAt(pb);
    road.receiveShadow = true;
    scene.add(road);
  }

  // Eavesdropper on the café-style network, used to explain HTTPS.
  const spy = label('👀 Snooper', { scale: 0.55, color: '#CA1F3F' });
  spy.position.set(-2.4, 1.2, 4.6);
  scene.add(spy);
  const spyBubble = label('…', { scale: 0.6, color: '#CA1F3F', width: 768 });
  spyBubble.position.set(-2.4, 2.0, 4.6);
  spyBubble.visible = false;
  scene.add(spyBubble);

  // ---------- Packets ----------
  function packet(kind, color) {
    const g = new THREE.Group();
    if (kind === 'mail') {
      const env = box(0.6, 0.4, 0.05, 0xffffff);
      const flap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 4), mat(color));
      flap.rotation.z = Math.PI;
      flap.position.y = 0.12;
      flap.scale.z = 0.1;
      g.add(env, flap);
    } else {
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.22), mat(color, { emissive: color, emissiveIntensity: 0.5 })));
    }
    scene.add(g);
    return g;
  }
  async function send(p, route, speed = 0.55, onHop) {
    for (let i = 0; i < route.length - 1; i++) {
      const a = pos(route[i]).setY(1.0);
      const b = pos(route[i + 1]).setY(1.0);
      onHop?.(route[i], route[i + 1]);
      await stage.tween((k) => {
        p.position.lerpVectors(a, b, k);
        p.position.y += Math.sin(k * Math.PI) * 0.6;
        p.rotation.y += 0.08;
      }, speed * Math.max(0.6, a.distanceTo(b) / 4));
    }
  }
  let busy = false;
  const once = (fn) => async () => {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } finally {
      busy = false;
    }
  };

  // ---------- Website ----------
  const webGroup = ui.group('1 · Visit a website (Session 6)');
  SITES.forEach((site) =>
    ui.button(`${site.secure ? '🔒' : '⚠️'} ${site.url.replace(/^https?:\/\//, '')}`, once(() => visit(site)), { group: webGroup })
  );
  async function visit(site) {
    ui.info(site.url, `<p><b>${site.secure ? '🔒 HTTPS' : '⚠️ HTTP — not secure'}</b> · domain ending <code>${site.ext}</code>: ${site.note}</p><p>Your request travels: computer → router → ISP → internet → web server…</p>`);
    const req = packet('data', site.secure ? COLORS.green : COLORS.red);
    await send(req, ['you', 'router', 'isp', 'hub', 'web'], 0.55, (a) => {
      if (a === 'router') {
        spyBubble.visible = true;
        setLabel(spyBubble, site.secure ? 'k#9@x!q2Zr… (scrambled!)' : 'GET /prize?phone=024…', { width: 768, color: '#CA1F3F' });
      }
      if (a === 'isp') spyBubble.visible = false;
    });
    scene.remove(req);
    const page = packet('data', COLORS.blue);
    await send(page, ['web', 'hub', 'isp', 'router', 'you']);
    scene.remove(page);
    ui.complete(site.secure ? 'https' : 'http');
    ui.info(site.url, `<p>✅ The web page arrived and your <b>browser</b> displayed it.</p><p>${site.secure ? 'The <b>padlock</b> means the data was <b>encrypted</b> (scrambled). The snooper only saw nonsense.' : '<b>No padlock:</b> the snooper on the network could read everything you sent. Never type passwords or personal details on an <code>http://</code> page.'}</p>`);
  }

  // ---------- Email ----------
  const mailGroup = ui.group('2 · Send an email (Session 7)');
  ui.button('✉️ To: Kofi', once(() => email(false)), { group: mailGroup });
  ui.button('✉️ To: Kofi · Cc: Teacher', once(() => email(true)), { group: mailGroup });
  async function email(cc) {
    ui.info('Sending email…', '<p><b>To:</b> kofi@friendschool.edu.gh' + (cc ? '<br><b>Cc:</b> teacher@friendschool.edu.gh' : '') + '<br><b>Subject:</b> Science project question</p><p>The email goes to <b>your</b> post office (mail server) first…</p>');
    const m = packet('mail', COLORS.gold);
    await send(m, ['you', 'router', 'mailA', 'hub', 'mailB']);
    ui.info('At the receiving post office', `<p>The friend's mail server reads the part after <b>@</b> to know it is the right post office, then delivers to the inbox${cc ? ' — and a <b>copy</b> for everyone in Cc' : ''}.</p>`);
    const jobs = [send(m, ['mailB', 'friend'])];
    let c2;
    if (cc) {
      c2 = packet('mail', COLORS.gold);
      c2.position.copy(m.position);
      jobs.push(send(c2, ['mailB', 'teacher']));
    }
    await Promise.all(jobs);
    scene.remove(m);
    if (c2) scene.remove(c2);
    if (cc) ui.complete('email-cc');
    ui.info('📬 Delivered!', `<p>${cc ? '<b>Cc</b> (carbon copy) means "for your information": the teacher gets the same email but Kofi is the main person who should reply.' : 'One email, one recipient. Add <b>Cc</b> to keep someone else informed.'}</p><p>Remember: a clear <b>Subject</b>, a greeting, a short message and a polite closing.</p>`);
  }

  // ---------- Shared document ----------
  const history = [];
  const histGroup = new THREE.Group();
  histGroup.position.copy(pos('cloud')).add(new THREE.Vector3(-1.9, 0, 0.6));
  scene.add(histGroup);
  const histTag = label('Version history: 0', { scale: 0.5 });
  histTag.position.set(0, 0.4, 0.8);
  histGroup.add(histTag);

  const docGroup = ui.group('3 · Edit a shared document (Session 14)');
  ui.button('Ama (Editor) adds a paragraph', once(() => edit('ama', true, 'Ama added a paragraph')), { group: docGroup });
  ui.button('You (Editor) fix a typo', once(() => edit('you', true, 'You fixed a typo')), { group: docGroup });
  ui.button('Yaw (Commenter) tries to edit', once(() => edit('yaw', false, 'Yaw tried to edit')), { group: docGroup });
  async function edit(who, allowed, what) {
    const route = who === 'you' ? ['you', 'router', 'isp', 'hub', 'cloud'] : [who, 'cloud'];
    const p = packet('data', NODES[who].color);
    await send(p, route);
    if (!allowed) {
      await stage.tween((k) => p.scale.setScalar(1 - k), 0.4);
      scene.remove(p);
      ui.complete('blocked');
      ui.info('🚫 Not allowed', '<p>Yaw is a <b>Commenter</b>. Commenters can add digital sticky notes but cannot change the text. The three access levels are <b>Viewer</b> (read only), <b>Commenter</b> and <b>Editor</b>.</p><p>Sharing law: give people the <b>lowest</b> access they need.</p>');
      return;
    }
    scene.remove(p);
    history.push(what);
    const plate = box(1, 0.1, 0.7, NODES[who].color);
    plate.position.y = 0.05 + (history.length - 1) * 0.13;
    histGroup.add(plate);
    histTag.position.y = 0.4 + history.length * 0.13;
    setLabel(histTag, `Version history: ${history.length}`);
    const others = ['ama', 'yaw'].filter((o) => o !== who);
    await Promise.all(others.map((o) => {
      const q = packet('data', NODES[who].color);
      return send(q, ['cloud', o]).then(() => scene.remove(q));
    }));
    ui.complete('cloud-edit');
    ui.info('☁️ Saved to the cloud', `<p><b>${what}.</b> Everyone sees the change within seconds — no emailing files back and forth.</p><p><b>Version history</b> keeps every save (${history.map((h, i) => `v${i + 1}`).join(', ')}), so mistakes can be undone. That is the ultimate safety net.</p>`);
  }

  ui.info('The internet: a road network of computers', '<p>Click any building to learn what it does, then send some traffic using the buttons. Drag to look around.</p>');
}

export const config = { camera: [0, 13, 14], target: [0.5, 0, -0.5], shadowSize: 14, maxDistance: 35, frame: 1.2 };

export const missions = [
  { id: 'globe', text: 'Click the blue globe called "The Internet".', hint: 'The internet is like a road network that joins computers together.' },
  { id: 'https', text: 'Visit a website that has a padlock 🔒.', hint: 'Watch what the snooper sees: only scrambled letters!' },
  { id: 'http', text: 'Visit the website with the ⚠️ warning sign.', hint: 'No padlock means anyone on the network can read what you send.' },
  { id: 'email-cc', text: 'Send an email to Kofi with your teacher in Cc.', hint: 'Count the envelopes when they reach the friend\'s mail server.' },
  { id: 'cloud-edit', text: 'Make an edit to the shared document.', hint: 'Use "Ama (Editor) adds a paragraph" or "You fix a typo".' },
  { id: 'blocked', text: 'Let Yaw (a Commenter) try to edit.', hint: 'What happens to Yaw\'s change? Why?' },
];
