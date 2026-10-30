// Mounts every <div class="lab" data-lab="name"> on the page.
import { createStage, createUI, webglAvailable } from './runtime.js';

// Wait (briefly) for the brand fonts, so 3D labels are drawn in Rubik.
// (No top-level await: the USB kit bundles this file as a classic script.)
Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
  for (const host of document.querySelectorAll('.lab[data-lab]')) mount(host);
});

async function mount(host) {
  const status = host.querySelector('.lab-status');
  if (!webglAvailable()) {
    status.textContent = 'This computer cannot show 3D graphics (WebGL is turned off or not supported). Everything in the workbook still works without it.';
    return;
  }
  try {
    const mod = await import(`./${host.dataset.lab}.js`);
    const stage = createStage(host, mod.config);
    const ui = createUI(host);
    if (mod.missions) ui.missions(host.dataset.lab, mod.missions, () => stage.confetti());
    mod.default(stage, ui, host);
    status.remove();
  } catch (err) {
    console.error(err);
    status.textContent = 'The 3D lab could not load. Try refreshing the page.';
  }
}
