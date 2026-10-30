// Finds a Chrome/Chromium for the local-only scripts (PDFs and preview images).
import { readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';

export function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const dir of [`${homedir()}/Library/Caches/ms-playwright`, `${homedir()}/.cache/ms-playwright`]) {
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse())
      for (const sub of readdirSync(`${dir}/${d}`)) candidates.unshift(`${dir}/${d}/${sub}/chrome-headless-shell`);
  }
  return candidates.find(existsSync);
}
