// 3D 무대: 잡기 화면과 도감 상세에서 캐릭터를 입체로 보여 줍니다.
// - 기본: 카메라 화면 위에 3D 캐릭터를 띄우고, 휴대폰 자이로로 그 자리에 고정 (간이 AR)
// - 진짜 AR: WebXR(ARCore)을 지원하면 실제 바닥을 인식해 그 위에 세움
// three.js를 불러오지 못하면 null을 돌려주고, 게임은 2D 그림으로 동작합니다.

import { buildModel } from './model3d.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
let THREE = null;
let loading = null;

export function loadThree() {
  if (THREE) return Promise.resolve(THREE);
  if (!loading) {
    loading = import(THREE_URL)
      .then(m => { THREE = m; return m; })
      .catch(e => { console.warn('3D를 불러오지 못했어요', e); loading = null; return null; });
  }
  return loading;
}

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function makeRenderer(canvasParent) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.className = 'stage3d-canvas';
  canvasParent.appendChild(renderer.domElement);
  return renderer;
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7a9a6a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-1.5, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe6ff, 0.6);
  rim.position.set(2, 1.5, -2);
  scene.add(rim);
}

function blobShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  return m;
}

function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.dispose(); });
  });
}

// ---------- 공통 애니메이션 ----------

function animateIdle(model, t, extra = {}) {
  const u = model.userData;
  const body = model.children[0];
  const br = Math.sin(t * 2.4);
  body.scale.set(1 - 0.015 * br, 1 + 0.03 * br, 1 - 0.015 * br);
  // 눈 깜빡임 (3.6초마다)
  const blink = (t % 3.6) < 0.12 ? 0.12 : 1;
  for (const e of u.eyes) e.scale.y = blink;
  for (const w of u.wings) w.obj.rotation[w.axis] = (w.base ?? (w.base = w.obj.rotation[w.axis])) + w.amp * Math.sin(t * w.speed);
  for (const tl of u.tails) tl.obj.rotation[tl.axis] = (tl.base ?? (tl.base = tl.obj.rotation[tl.axis])) + tl.amp * Math.sin(t * tl.speed);
  if (!extra.noLook) model.rotation.y = 0.35 * Math.sin(t * 0.55) + 0.12 * Math.sin(t * 1.3);
}

// ---------- 잡기 화면 무대 ----------

export async function createStage(container) {
  if (!webglOk() || !(await loadThree())) return null;
  const renderer = makeRenderer(container);
  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
  const BASE_PITCH = -0.13;
  camera.rotation.set(BASE_PITCH, 0, 0);
  const baseQ = camera.quaternion.clone();

  const anchor = new THREE.Group(); // 캐릭터가 서 있는 자리
  const HOME = [0, -0.95, -3.4]; // 카메라 앞 약 3.4m, 바닥 높이
  anchor.position.set(...HOME);
  scene.add(anchor);
  const shadow = blobShadow();
  anchor.add(shadow);

  let model = null;
  let mode = 'ball';
  let state = { name: 'idle', t0: 0 };
  let fly = null;       // 곤충 비행 오프셋
  let clock = 0;
  let last = performance.now();

  // 크기 맞추기
  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    if (renderer.xr.isPresenting) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ---------- 자이로로 자리 고정 (간이 AR) ----------
  const zee = new THREE.Vector3(0, 0, 1);
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const euler = new THREE.Euler();
  const q0 = new THREE.Quaternion();
  let gyro = { on: false, ref: null, target: new THREE.Quaternion() };
  function deviceQuat(e) {
    const d = THREE.MathUtils.DEG2RAD;
    const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * d;
    euler.set(e.beta * d, e.alpha * d, -e.gamma * d, 'YXZ');
    const q = new THREE.Quaternion().setFromEuler(euler);
    q.multiply(q1);
    q.multiply(q0.setFromAxisAngle(zee, -orient));
    return q;
  }
  function onOrient(e) {
    if (e.alpha == null) return;
    const q = deviceQuat(e);
    if (!gyro.ref) gyro.ref = q.clone().invert();
    gyro.target.copy(baseQ).multiply(gyro.ref.clone().multiply(q));
    gyro.on = true;
  }
  async function enableGyro() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return false;
      }
    } catch { return false; }
    gyro.ref = null;
    window.addEventListener('deviceorientation', onOrient);
    return true;
  }
  function disableGyro() {
    window.removeEventListener('deviceorientation', onOrient);
    gyro = { on: false, ref: null, target: new THREE.Quaternion() };
    camera.quaternion.copy(baseQ);
  }

  // ---------- 진짜 AR (WebXR) ----------
  let xr = null; // { session, hitSource, placed, onEnd }
  async function xrSupported() {
    try { return Boolean(navigator.xr) && await navigator.xr.isSessionSupported('immersive-ar'); } catch { return false; }
  }
  async function startXR(overlayRoot, { onPlaced, onEnd } = {}) {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: overlayRoot },
    });
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace('viewer');
    const hitSource = await session.requestHitTestSource({ space: viewer });
    xr = { session, hitSource, placed: false, onPlaced, onEnd };
    anchor.visible = false;
    anchor.scale.setScalar(0.4); // 실제 크기 약 40cm
    session.addEventListener('end', () => {
      const cb = xr?.onEnd;
      xr = null;
      renderer.xr.enabled = false;
      anchor.visible = true;
      anchor.scale.setScalar(1);
      anchor.position.set(...HOME);
      anchor.rotation.set(0, 0, 0);
      resize();
      cb?.();
    });
  }
  function endXR() { xr?.session.end().catch(() => {}); }

  const m4 = new THREE.Matrix4();
  function xrPlace(frame) {
    if (!xr || xr.placed || !frame) return;
    const hits = frame.getHitTestResults(xr.hitSource);
    if (!hits.length) return;
    const pose = hits[0].getPose(renderer.xr.getReferenceSpace());
    if (!pose) return;
    m4.fromArray(pose.transform.matrix);
    anchor.position.setFromMatrixPosition(m4);
    const cam = renderer.xr.getCamera();
    const cp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    anchor.rotation.set(0, Math.atan2(cp.x - anchor.position.x, cp.z - anchor.position.z), 0);
    anchor.visible = true;
    xr.placed = true;
    xr.onPlaced?.();
  }

  // ---------- 상태 애니메이션 ----------
  function play(name) { state = { name, t0: clock }; }

  function update(dt) {
    clock += dt;
    if (!model) return;
    const t = clock;
    const st = clock - state.t0;
    const u = model.userData;
    animateIdle(model, t, { noLook: Boolean(fly) });
    let y = 0;
    let s = 1;
    let x = 0;
    let rotY = null;
    switch (state.name) {
      case 'appear': { const p = Math.min(1, st / 0.4) - 1; s = 1 + 2.70158 * p ** 3 + 1.70158 * p ** 2; if (st > 0.5) play('idle'); break; }
      case 'hop': y = Math.max(0, Math.sin(Math.min(1, st / 0.45) * Math.PI)) * 0.3; if (st > 0.5) play('idle'); break;
      case 'happy': y = Math.abs(Math.sin(st * 6)) * 0.25; rotY = st * 5; break;
      case 'startle': x = Math.sin(st * 40) * 0.05 * Math.max(0, 1 - st / 0.4); if (st > 0.45) play('idle'); break;
      case 'sucked': s = Math.max(0.001, 1 - st / 0.4); rotY = st * 12; y = st * 0.5; break;
      case 'netted': s = Math.max(0.55, 1 - st); break;
      case 'leave': rotY = Math.PI; x = st * 1.8; s = Math.max(0.01, 1 - st * 0.5); break;
      default:
    }
    if (u.flyer && !fly) y += 0.35 + Math.sin(t * 3) * 0.05;
    if (u.swimmer) { x += -0.4 + Math.sin(t * 0.6) * 0.3; rotY = (rotY ?? 0) + (Math.cos(t * 0.6) > 0 ? 0 : Math.PI); y += 0.35; s *= 0.62; }
    if (fly) { x += fly.x; y += fly.y; rotY = (rotY ?? 0) + fly.dir; }
    model.position.set(x, y, 0);
    model.scale.setScalar(s);
    if (rotY !== null) model.rotation.y = rotY;
    shadow.scale.setScalar(Math.max(0.2, (1 - Math.min(y, 1) * 0.6) * s));
    shadow.visible = mode !== 'fish';
  }

  renderer.setAnimationLoop((now, frame) => {
    const tnow = performance.now();
    const dt = Math.min(0.05, (tnow - last) / 1000);
    last = tnow;
    if (xr) xrPlace(frame);
    else if (gyro.on) camera.quaternion.slerp(gyro.target, 0.25);
    update(dt);
    renderer.render(scene, camera);
  });

  return {
    setCreature(sp, m) {
      if (model) { anchor.remove(model); disposeTree(model); }
      mode = m;
      fly = null;
      resize();
      model = buildModel(THREE, sp);
      anchor.add(model);
      play('appear');
    },
    clear() {
      if (model) { anchor.remove(model); disposeTree(model); model = null; }
    },
    play,
    // 곤충 비행: phase에 따라 좌우·위아래로 날아다님
    fly(phase) {
      const nx = Math.sin(phase * 1.1) * Math.cos(phase * 0.37);
      const ny = Math.sin(phase * 1.7 + 1);
      const vx = Math.cos(phase * 1.1) * Math.cos(phase * 0.37);
      fly = { x: nx * 1.0, y: 0.55 + ny * 0.32, dir: vx > 0 ? 0.6 : -0.6 };
    },
    // 캐릭터 가운데의 화면 좌표(px)와 대략의 반지름
    screenPos() {
      if (!model || !anchor.visible) return null;
      const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
      const c = new THREE.Vector3(0, 0.45, 0);
      const top = new THREE.Vector3(0, 0.95, 0);
      model.localToWorld(c);
      model.localToWorld(top);
      const rect = renderer.domElement.getBoundingClientRect();
      const toPx = (v) => { v.project(cam); return { x: (v.x + 1) / 2 * rect.width, y: (1 - v.y) / 2 * rect.height }; };
      const pc = toPx(c);
      const pt = toPx(top);
      return { x: pc.x, y: pc.y, r: Math.max(30, Math.hypot(pt.x - pc.x, pt.y - pc.y) * 0.95) };
    },
    enableGyro,
    disableGyro,
    xrSupported,
    startXR,
    endXR,
    get inXR() { return Boolean(xr); },
    get xrPlaced() { return Boolean(xr?.placed); },
  };
}

// ---------- 도감 상세: 손가락으로 돌려 보는 3D ----------

export async function createViewer(el, sp) {
  if (!webglOk() || !(await loadThree())) return null;
  const renderer = makeRenderer(el);
  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 20);
  camera.position.set(0, 0.75, 3.1);
  camera.lookAt(0, 0.5, 0);
  const model = buildModel(THREE, sp);
  scene.add(model);
  const shadow = blobShadow();
  scene.add(shadow);
  const w = el.clientWidth || 200;
  const h = el.clientHeight || 200;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  let spin = 0;
  let vel = 0.6;
  let drag = null;
  const down = (e) => { drag = { x: e.clientX, t: performance.now() }; el.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    spin += dx * 0.012;
    vel = dx * 0.6;
    drag.x = e.clientX;
  };
  const up = () => { drag = null; };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);

  let last = performance.now();
  let t = 0;
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (!drag) { vel += (0.6 - vel) * dt * 2; spin += vel * dt; }
    animateIdle(model, t, { noLook: true });
    model.rotation.y = spin;
    if (model.userData.flyer) model.position.y = 0.15 + Math.sin(t * 3) * 0.04;
    renderer.render(scene, camera);
  });

  return {
    dispose() {
      renderer.setAnimationLoop(null);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      disposeTree(scene);
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    },
  };
}
