// Abre la web en un navegador, intenta el login docente y muestra qué pasó (sin mostrar la contraseña).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const { inputs } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const base = inputs.url.replace(/\/+$/, '');
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[consola ${m.type()}]`, m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[error de página]', e.message.slice(0, 300)));
page.on('requestfailed', (r) => console.log('[petición fallida]', r.method(), r.url(), r.failure()?.errorText));
page.on('response', (r) => { if (r.url().includes('/api/') || r.status() >= 400) console.log('[respuesta]', r.status(), r.request().method(), r.url()); });

const res = await page.goto(base + '/entrar', { waitUntil: 'networkidle' });
console.log('Página /entrar:', res?.status(), 'título:', await page.title());
await page.waitForTimeout(2000);
if (!inputs.email || !inputs.password) { console.log('Sin credenciales: solo reviso la carga.'); await browser.close(); process.exit(0); }
await page.fill('#email', inputs.email);
await page.fill('#pw', inputs.password);
await page.click('#docente button');
await page.waitForTimeout(8000);
console.log('URL final:', page.url());
const err = await page.locator('#docente .fb.no').textContent().catch(() => null);
if (err) console.log('Mensaje en el formulario:', err);
await browser.close();
