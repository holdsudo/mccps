/* MCCPS — hero 3D card (light studio look). Drag to rotate, tap to flip, gentle float. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.querySelector('[data-hero-card]');
const canvas = document.getElementById('card-canvas');
if (host && canvas) init();

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0); host.classList.add('has-3d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50); camera.position.set(0, 0.15, 8.2);

  // soft studio environment (bright)
  { const pm = new THREE.PMREMGenerator(renderer); const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), new THREE.MeshBasicMaterial({ color: 0xe9eef5, side: THREE.BackSide })));
    const mk = (w, h, c, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...p); m.rotation.set(...r); env.add(m); };
    mk(14, 5, 0xffffff, [0, 8, -4], [Math.PI / 3, 0, 0]); mk(6, 10, 0xdfe9ff, [-12, 0, 0], [0, Math.PI / 2, 0]); mk(6, 10, 0xe3f7ea, [12, 0, 0], [0, -Math.PI / 2, 0]); mk(16, 3, 0xffffff, [0, -7, 5], [-Math.PI / 2.4, 0, 0]);
    scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose(); }
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6f2, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-4, 6, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe2ff, 0.6); fill.position.set(5, -2, 4); scene.add(fill);

  // card
  const CW = 3.4, CH = 2.15, CD = 0.07;
  const card = new THREE.Group(); scene.add(card);
  const body = new THREE.Mesh(new RoundedBoxGeometry(CW, CH, CD, 4, 0.16), new THREE.MeshPhysicalMaterial({ color: 0x1565c0, metalness: .4, roughness: .3, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1 }));
  card.add(body);
  const fTex = cardTexture('front'), bTex = cardTexture('back');
  const faceGeo = new THREE.PlaneGeometry(CW - .06, CH - .06);
  const front = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: fTex, metalness: .25, roughness: .28, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.1 })); front.position.z = CD / 2 + .002; card.add(front);
  const back = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: bTex, metalness: .25, roughness: .32, clearcoat: .8, clearcoatRoughness: .15, envMapIntensity: 1 })); back.position.z = -(CD / 2 + .002); back.rotation.y = Math.PI; card.add(back);
  const chip = new THREE.Mesh(new RoundedBoxGeometry(.44, .34, .03, 3, .05), new THREE.MeshPhysicalMaterial({ color: 0xe6c15c, metalness: .85, roughness: .3, envMapIntensity: 1.2 })); chip.position.set(-1.05, .02, CD / 2 + .015); card.add(chip);
  // contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(CW * 1.6, CH * 1.6), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, opacity: .55, depthWrite: false }));
  shadow.position.set(0, -1.9, -.4); shadow.rotation.x = -Math.PI / 2.2; scene.add(shadow);

  // interaction
  const rot = { x: .18, y: -.45, tx: .18, ty: -.45, vel: 0, flipped: 0 }; let dragging = false, moved = 0, px = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; px = e.clientX; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  window.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - px; px = e.clientX; moved += Math.abs(dx); rot.vel = dx * .012; rot.ty += rot.vel; }, { passive: true });
  window.addEventListener('pointerup', () => { if (dragging && moved < 6) { rot.flipped = rot.flipped ? 0 : 1; } dragging = false; });
  let hover = { x: 0, y: 0 };
  if (window.matchMedia('(hover: hover)').matches) canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); hover.x = (e.clientX - r.left) / r.width - .5; hover.y = (e.clientY - r.top) / r.height - .5; });
  canvas.addEventListener('pointerleave', () => { hover.x = 0; hover.y = 0; });

  function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const s = Math.min(1, w / 560); card.scale.setScalar(s); shadow.scale.setScalar(s); }
  resize(); let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 100); });

  let inView = true; new IntersectionObserver(en => { inView = en[0].isIntersecting; }, { threshold: .05 }).observe(host);
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick); if (!inView || document.hidden) return;
    const t = clock.getElapsedTime(); const f = reduce ? 0 : 1;
    if (!dragging) { rot.ty += rot.vel; rot.vel *= .93; }
    const targetY = rot.ty + rot.flipped * Math.PI + f * Math.sin(t * .5) * .18 + hover.x * .5;
    const targetX = rot.tx + f * Math.sin(t * .7) * .05 - hover.y * .3;
    card.rotation.y += (targetY - card.rotation.y) * .08; card.rotation.x += (targetX - card.rotation.x) * .08;
    card.position.y = f * Math.sin(t * .9) * .08;
    renderer.render(scene, camera);
  }
  if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(tick, tick); else tick();
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function shadowTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(256, 128, 10, 256, 128, 240); gr.addColorStop(0, 'rgba(11,18,32,.45)'); gr.addColorStop(1, 'rgba(11,18,32,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); return new THREE.CanvasTexture(c); }
function cardTexture(side) {
  const W = 1024, H = 648; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, H);
  if (side === 'front') { grad.addColorStop(0, '#0d4ea6'); grad.addColorStop(.5, '#1e7df0'); grad.addColorStop(1, '#35b25f'); } else { grad.addColorStop(0, '#123f7a'); grad.addColorStop(1, '#1a5fb4'); }
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = .2; g.strokeStyle = '#fff'; g.lineWidth = 160; g.lineCap = 'round'; g.beginPath(); g.moveTo(-100, H * .85); g.quadraticCurveTo(W * .5, H * .1, W + 120, H * .55); g.stroke(); g.restore();
  if (side === 'front') {
    g.fillStyle = '#fff'; g.font = '700 92px Outfit, Inter, system-ui, sans-serif'; g.fillText('MCCPS', 88, 150);
    g.font = '600 22px Inter, system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.88)'; g.letterSpacing = '4px'; g.fillText('MERCHANT CREDIT CARD PROCESSING SERVICES', 92, 186);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(262, 278, 14 * i, -0.7, 0.7); g.stroke(); }
    g.font = '500 54px "Courier New", ui-monospace, monospace'; g.fillStyle = '#fff'; g.letterSpacing = '6px'; g.fillText('••••  ••••  ••••  6227', 92, 450);
    g.font = '600 22px Inter, system-ui, sans-serif'; g.letterSpacing = '2px'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('ZERO PROCESSING FEES', 92, 540); g.fillText('NEXT DAY FUNDING', 92, 575);
    g.textAlign = 'right'; g.font = '700 30px Outfit, Inter, system-ui, sans-serif'; g.fillStyle = '#fff'; g.letterSpacing = '1px'; g.fillText('PCI', W - 92, 560); g.font = '500 18px Inter, system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('COMPLIANT', W - 92, 585);
  } else {
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 90, W, 96);
    g.fillStyle = '#fff'; roundRect(g, 92, 250, 620, 70, 8); g.fill();
    g.fillStyle = '#0b1a3a'; g.font = '500 34px "Courier New", ui-monospace, monospace'; g.textBaseline = 'middle'; g.letterSpacing = '4px'; g.fillText('844 826 6227', 110, 285);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '500 20px Inter, system-ui, sans-serif'; g.textBaseline = 'alphabetic'; g.letterSpacing = '2px'; g.fillText('SECURE • ENCRYPTED • 24/7 SUPPORT', 92, 400);
    g.font = '700 40px Outfit, Inter, system-ui, sans-serif'; g.fillStyle = '#fff'; g.letterSpacing = '0px'; g.fillText('MCCPS', 92, 560);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
