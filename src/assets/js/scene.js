/* MCCPS — hero scene: a stream of light carrying a payment through four gates
   (Tap → Authorize → Settle → Deposit). Particles ride a curve sampled into a float
   texture, so the GPU moves every particle; the CPU only steers the camera. */
import * as THREE from 'three';

const host = document.querySelector('[data-stage]');
if (host) init(host);

function init(host) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) { return; }
  host.appendChild(canvas);
  host.closest('.hero')?.classList.add('has-3d');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  // ---- the path ----
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-16, -3.5, -14), new THREE.Vector3(-9, 1.8, -8), new THREE.Vector3(-3, -.6, -3),
    new THREE.Vector3(2.5, 1.4, -1), new THREE.Vector3(7, -.4, -4), new THREE.Vector3(11, 2.6, -10), new THREE.Vector3(15, 1, -18)
  ], false, 'centripetal');
  const N = 256;
  const frames = curve.computeFrenetFrames(N - 1, false);
  const data = new Float32Array(N * 3 * 4);
  for (let i = 0; i < N; i++) {
    const p = curve.getPointAt(i / (N - 1)), n = frames.normals[i], b = frames.binormals[i];
    data.set([p.x, p.y, p.z, 1], i * 4);
    data.set([n.x, n.y, n.z, 1], (N + i) * 4);
    data.set([b.x, b.y, b.z, 1], (2 * N + i) * 4);
  }
  const pathTex = new THREE.DataTexture(data, N, 3, THREE.RGBAFormat, THREE.FloatType);
  pathTex.minFilter = pathTex.magFilter = THREE.LinearFilter; pathTex.needsUpdate = true;

  // ---- particle stream ----
  const COUNT = small ? 5000 : 14000;
  const g = new THREE.BufferGeometry();
  const seed = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const core = Math.random() < .55;
    seed[i * 4] = Math.random();                                   // phase along the path
    seed[i * 4 + 1] = Math.random() * Math.PI * 2;                 // angle around it
    seed[i * 4 + 2] = core ? Math.pow(Math.random(), 2) * .35 : .25 + Math.pow(Math.random(), 1.6) * 1.6; // radius
    seed[i * 4 + 3] = .5 + Math.random();                          // speed / size jitter
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const uni = { uTime: { value: 0 }, uPath: { value: pathTex }, uPx: { value: renderer.getPixelRatio() }, uPulse: { value: 0 } };
  const stream = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform sampler2D uPath; uniform float uTime; uniform float uPx; uniform float uPulse;
      attribute vec4 aSeed; varying vec3 vCol; varying float vA;
      vec3 row(float t, float r){ return texture(uPath, vec2(t * (255./256.) + .5/256., (r + .5) / 3.)).xyz; }
      void main(){
        float t = fract(aSeed.x + uTime * .022 * aSeed.w);
        vec3 p = row(t, 0.), n = row(t, 1.), b = row(t, 2.);
        float ang = aSeed.y + uTime * (.35 + aSeed.w * .25) + t * 9.;
        float rad = aSeed.z * (1. + .35 * sin(t * 18. + uTime));
        // gates squeeze the stream as it passes through them
        float gate = 0.;
        for (int k = 0; k < 4; k++){ float c = .14 + float(k) * .24; gate += exp(-pow((t - c) * 28., 2.)); }
        rad *= 1. - .55 * gate;
        vec3 pos = p + (n * cos(ang) + b * sin(ang)) * rad;
        vec4 mv = modelViewMatrix * vec4(pos, 1.);
        gl_Position = projectionMatrix * mv;
        float s = (aSeed.z < .35 ? 2.6 : 1.7) * (.7 + .6 * aSeed.w) * (1. + gate * 1.4);
        gl_PointSize = s * uPx * (14. / -mv.z);
        vec3 cobalt = vec3(.42,.58,1.), emerald = vec3(.24,.86,.59), champ = vec3(.91,.81,.59);
        vCol = t < .5 ? mix(cobalt, emerald, smoothstep(.0,.5,t)) : mix(emerald, champ, smoothstep(.55,1.,t));
        vCol += gate * .35;
        vA = smoothstep(0., .06, t) * (1. - smoothstep(.9, 1., t)) * (aSeed.z < .35 ? .95 : .45);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vCol * a, a * vA); }`
  }));
  stream.frustumCulled = false;
  scene.add(stream);

  // ---- distant dust ----
  const DN = small ? 600 : 1600, dp = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) dp.set([(Math.random() - .5) * 70, (Math.random() - .5) * 36, -Math.random() * 50 - 2], i * 3);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfd2ff, size: .06, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // ---- the four gates ----
  const gates = [], tags = [...host.parentElement.querySelectorAll('.stage-tag')], list = [...document.querySelectorAll('[data-stage-list] li')];
  const GT = [.14, .38, .62, .86], COL = [0x6b95ff, 0x7fd8ff, 0x3ddc97, 0xe9cf96];
  GT.forEach((t, k) => {
    const grp = new THREE.Group(), p = curve.getPointAt(t), tan = curve.getTangentAt(t);
    grp.position.copy(p); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().multiplyScalar(.55).add(new THREE.Vector3(0, 0, 1)).normalize());
    const ringMat = new THREE.MeshBasicMaterial({ color: COL[k], transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, .018, 8, 160), ringMat);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, .14, 8, 120), new THREE.MeshBasicMaterial({ color: COL[k], transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false }));
    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.6, .006, 6, 160, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: 0xf3efe6, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const ticks = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.012, i % 6 ? .07 : .16), new THREE.MeshBasicMaterial({ color: 0xf3efe6, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false }));
      const a = i / 24 * Math.PI * 2; m.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0); m.rotation.z = a - Math.PI / 2; ticks.add(m);
    }
    grp.add(ring, halo, outer, ticks); scene.add(grp);
    gates.push({ grp, ring, halo, outer, ticks, t, tag: tags[k], item: list[k], pos: p.clone() });
  });

  // ---- camera rig ----
  const look = new THREE.Vector3(-8.2, -3.4, -5), target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let scrollP = 0;
  const camAt = (sp) => {
    // framed so the stream rides above/right of the headline; scrolling dollies down the stream
    const m = innerWidth < 760;
    const pos = m ? new THREE.Vector3(1, 2.5 + sp * 2.5, 24 - sp * 10) : new THREE.Vector3(2 + cur.x * 2.4, 2.4 + cur.y * 1.4 + sp * 2.5, 17 - sp * 9);
    const at = m ? new THREE.Vector3(0.5, -5.2 + sp * 1.5, -5) : new THREE.Vector3(-8.2, -3.4 + sp * 1.5, -5);
    return { pos, look: at };
  };
  const size = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < 760 ? 58 : 42; camera.updateProjectionMatrix();
  };
  size(); addEventListener('resize', size);

  if (matchMedia('(hover:hover)').matches) addEventListener('pointermove', (e) => { target.x = e.clientX / innerWidth - .5; target.y = -(e.clientY / innerHeight - .5); }, { passive: true });
  const hero = host.closest('.hero');
  const onScroll = () => { const r = hero.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / r.height)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const v = new THREE.Vector3();
  let visible = true, hidden = false, running = false, last = performance.now(), time = 8, active = -1;
  const start = () => { if (running || reduce || !visible || hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const frame = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduce) time += dt;
    cur.x += (target.x - cur.x) * .04; cur.y += (target.y - cur.y) * .04;
    const c = camAt(scrollP);
    camera.position.copy(c.pos); look.lerp(c.look, .08); camera.lookAt(look);
    uni.uTime.value = time;
    dust.rotation.y = time * .006;

    // which gate the light is "at" — cycles so the list on the right reads like a live ledger
    const cyc = Math.floor(time / 2.6) % 4;
    const w = host.clientWidth, h = host.clientHeight;
    gates.forEach((gt, k) => {
      const on = k === cyc, pulse = on ? .5 + .5 * Math.sin(time * 6) : 0;
      gt.ring.rotation.z = time * (k % 2 ? -.4 : .4);
      gt.outer.rotation.z = -time * .25 + k;
      gt.ticks.rotation.z = time * .08;
      gt.halo.material.opacity = .06 + (on ? .16 + pulse * .1 : 0);
      gt.ring.scale.setScalar(1 + (on ? .06 * pulse : 0));
      if (gt.tag) {
        v.copy(gt.pos).project(camera);
        const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h, inView = v.z < 1 && x > 40 && x < w - 40 && y > 90 && y < h - 40;
        gt.tag.style.transform = `translate(${(x + 26).toFixed(1)}px,${(y - 44).toFixed(1)}px)`;
        gt.tag.classList.toggle('is-on', inView && w > 760);
      }
    });
    if (cyc !== active) { active = cyc; list.forEach((li, k) => li.classList.toggle('is-on', k === cyc)); }
    host.style.opacity = String(1 - scrollP * .9);
    renderer.render(scene, camera);
    if (visible && !hidden && !reduce) requestAnimationFrame(frame); else running = false;
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(host);
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; start(); });
  if (reduce) { requestAnimationFrame(frame); addEventListener('resize', () => requestAnimationFrame(frame)); } else start();
}
