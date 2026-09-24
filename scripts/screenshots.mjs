// Regenerates the project teaser images in assets/img/projects/ from the live sites.
//
//   cd scripts && npm install && npm run screenshots            # every project
//   npm run screenshots -- permit-timeline-tracker              # just one
//
// Each project captures one or more regions (CSS pixels, relative to an element)
// and lays them out in a 1200×750 frame. Adjust the regions here if a site's
// layout changes; the output file name is the project key.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const OUT = process.env.OUT_DIR ? `${process.env.OUT_DIR.replace(/\/$/, '')}/`
  : fileURLToPath(new URL('../assets/img/projects/', import.meta.url));
const W = 1200, H = 750, SCALE = 2;
const CHROME = process.env.CHROME_PATH
  ?? (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome');

const BASE = 'https://peninsulaforeveryone.github.io';
const PROJECTS = {
  'housing-transportation-costs': {
    url: `${BASE}/housing-transportation-costs/`,
    layout: 'split',
    shots: [
      { selector: '#map', clip: { x: 260, y: 0, width: 370, height: 462 } },
      { selector: '#panels', clip: { x: 467, y: 220, width: 423, height: 430 } },
    ],
  },
  'permit-timeline-tracker': {
    url: `${BASE}/permit-timeline-tracker/`,
    layout: 'cover',
    shots: [{ selector: '.leaflet-container', clip: { x: 125, y: 0, width: 720, height: 450 } }],
  },
  'peninsula-enrollment-decline': {
    url: `${BASE}/peninsula-enrollment-decline/`,
    layout: 'contain',
    shots: [{ selector: '.chart-wrap', inset: 3 }],
  },
  'sb79-analysis': {
    url: `${BASE}/sb79-analysis/public/`,
    layout: 'cover',
    viewport: { width: 1440, height: 900 },
    settle: 12000, // MapLibre keeps loading parcels after network idle
    shots: [{ selector: 'body', clip: { x: 450, y: 0, width: 880, height: 550 } }],
  },
};

const LAYOUTS = {
  cover: ([a]) => `<img src="${a}" style="width:100%;height:100%;object-fit:cover">`,
  contain: ([a]) => `<img src="${a}" style="width:100%;height:100%;object-fit:contain">`,
  split: ([a, b]) => `
    <div style="display:grid;grid-template-columns:1fr 1fr;height:100%">
      <img src="${a}" style="width:100%;height:100%;object-fit:cover;border-right:2px solid #cbe0d7">
      <img src="${b}" style="width:100%;height:100%;object-fit:contain;padding:0 12px 0 20px;box-sizing:border-box">
    </div>`,
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capture(browser, key, project) {
  const page = await browser.newPage();
  await page.setViewport({ ...(project.viewport ?? { width: 1440, height: 1000 }), deviceScaleFactor: SCALE });
  await page.goto(project.url, { waitUntil: 'networkidle0', timeout: 120_000 });
  await sleep(project.settle ?? 6000);

  const images = [];
  for (const shot of project.shots) {
    const el = await page.$(shot.selector);
    if (!el) throw new Error(`${key}: ${shot.selector} not found; update scripts/screenshots.mjs`);
    const box = await el.boundingBox();
    const inset = shot.inset ?? 0;
    const png = await el.screenshot({
      // Relative to the element; puppeteer scrolls it into view and adds the offsets.
      clip: shot.clip ?? { x: inset, y: inset, width: box.width - 2 * inset, height: box.height - 2 * inset },
      // Capturing past the viewport resizes it, which makes WebGL maps redraw mid-capture.
      captureBeyondViewport: false,
      encoding: 'base64',
    });
    images.push(`data:image/png;base64,${png}`);
  }
  await page.close();

  const frame = await browser.newPage();
  await frame.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await frame.setContent(
    `<body style="margin:0;width:${W}px;height:${H}px;background:#fff;overflow:hidden">${LAYOUTS[project.layout](images)}</body>`,
    { waitUntil: 'load' },
  );
  await frame.screenshot({ path: `${OUT}${key}.jpg`, type: 'jpeg', quality: 84 });
  await frame.close();
  console.log(`wrote ${OUT}${key}.jpg`);
}

const only = process.argv.slice(2);
const keys = only.length ? only : Object.keys(PROJECTS);
const unknown = keys.filter(k => !PROJECTS[k]);
if (unknown.length) throw new Error(`Unknown project(s): ${unknown.join(', ')}`);

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  // Software WebGL so MapLibre maps render without a GPU.
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const key of keys) await capture(browser, key, PROJECTS[key]);
} finally {
  await browser.close();
}
