import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildPrototypeCar } from './procedural-car.js';

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/';
const DEFAULT_MODEL = 'models/palisade-lx2.glb';

const $ = (s) => document.querySelector(s);
const viewport = $('#viewport');

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.prepend(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 500);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotateSpeed = 0.8;

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.02;
key.shadow.radius = 4;
scene.add(key, key.target);
scene.add(new THREE.HemisphereLight(0xffffff, 0x3b4552, 0.5));

// 바닥: 은은한 원형 반사광 + 그림자만 받는 평면
const floorTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, 'rgba(150,175,210,0.45)');
  gr.addColorStop(0.55, 'rgba(150,175,210,0.14)');
  gr.addColorStop(1, 'rgba(150,175,210,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false }));
floor.rotation.x = -Math.PI / 2;
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.35 }));
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0.001;
shadowPlane.receiveShadow = true;
scene.add(floor, shadowPlane);

/* ---------- loaders ---------- */
const draco = new DRACOLoader().setDecoderPath(THREE_CDN + 'libs/draco/gltf/');
const ktx2 = new KTX2Loader().setTranscoderPath(THREE_CDN + 'libs/basis/').detectSupport(renderer);
function makeLoader(manager) {
  return new GLTFLoader(manager).setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
}

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(msg, ms = 3500) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
function setLoading(on, frac, text) {
  $('#loading').hidden = !on;
  if (frac != null) $('#loadingBar').style.width = Math.round(frac * 100) + '%';
  if (text) $('#loadingText').textContent = text;
}

/* ---------- model state ---------- */
// current = { root, holder, name, yaw, size, entries:[{mat, original, slots, area, name}], paintIdx, mixer, actions }
let current = null;
const clock = new THREE.Clock();

function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
      m.dispose();
    }
  });
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
function surfaceArea(mesh, start, count) {
  const g = mesh.geometry, pos = g.attributes.position;
  if (!pos) return 0;
  const idx = g.index, total = idx ? idx.count : pos.count;
  const end = Math.min(total, start + count);
  const m = mesh.matrixWorld;
  // 아주 큰 메시는 샘플링해서 근사
  const step = (end - start) > 3e6 ? 3 * Math.ceil((end - start) / 3e6) : 3;
  let area = 0;
  for (let i = start; i + 2 < end; i += step) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    _a.fromBufferAttribute(pos, i0).applyMatrix4(m);
    _b.fromBufferAttribute(pos, i1).applyMatrix4(m);
    _c.fromBufferAttribute(pos, i2).applyMatrix4(m);
    area += _b.sub(_a).cross(_c.sub(_a)).length() * 0.5;
  }
  return area * (step / 3);
}

function collectMaterials(root) {
  root.updateMatrixWorld(true);
  const byMat = new Map();
  let tris = 0, meshes = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    o.castShadow = true; o.receiveShadow = true;
    const g = o.geometry;
    const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0);
    tris += n / 3;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m, i) => {
      let e = byMat.get(m);
      if (!e) { e = { mat: m, original: m, slots: [], area: 0, name: m.name || '' }; byMat.set(m, e); }
      e.slots.push({ mesh: o, index: Array.isArray(o.material) ? i : -1 });
      if (Array.isArray(o.material)) {
        for (const grp of g.groups) if (grp.materialIndex === i) e.area += surfaceArea(o, grp.start, grp.count);
      } else {
        e.area += surfaceArea(o, 0, Infinity);
      }
    });
  });
  const entries = [...byMat.values()].sort((a, b) => b.area - a.area);
  return { entries, tris: Math.round(tris), meshes };
}

const PAINT_NAME = /paint|body|car|exterior|shell|차체|도장/i;
const NOT_PAINT = /glass|window|windshield|tire|tyre|rubber|wheel|rim|interior|seat|light|lamp|chrome|plastic|black|grille|mirror|plate|brake|disc|caliper/i;
function guessPaint(entries) {
  const byName = entries.findIndex((e) => PAINT_NAME.test(e.name) && !NOT_PAINT.test(e.name));
  if (byName >= 0) return byName;
  const byArea = entries.findIndex((e) => !NOT_PAINT.test(e.name) && !e.mat.transparent && e.mat.isMeshStandardMaterial);
  return byArea >= 0 ? byArea : 0;
}

function setModel(root, name, clips = []) {
  if (current) {
    if (current.mixer) current.mixer.stopAllAction();
    scene.remove(current.holder);
    for (const e of current.entries) if (e.mat !== e.original) e.mat.dispose();
    disposeObject(current.holder);
  }
  const holder = new THREE.Group();
  holder.add(root);
  scene.add(holder);

  const { entries, tris, meshes } = collectMaterials(root);
  current = { root, holder, name, yaw: 0, entries, tris, meshes, paintIdx: guessPaint(entries), mixer: null, actions: [] };

  // 긴 방향을 X축(앞뒤)으로 맞춤
  const s0 = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  if (s0.z > s0.x * 1.15) current.yaw = Math.PI / 2;

  if (clips.length) {
    current.mixer = new THREE.AnimationMixer(root);
    current.actions = clips.map((c) => current.mixer.clipAction(c));
  }
  $('#animBtn').hidden = !clips.length;
  $('#animBtn').textContent = '애니메이션 재생';
  $('#animBtn').setAttribute('aria-pressed', 'false');

  $('#modelBadge').textContent = name;
  normalize(true);
  fillMaterialUI();
}

function normalize(refit) {
  const { holder } = current;
  holder.rotation.set(0, current.yaw, 0);
  holder.scale.setScalar(1);
  holder.position.set(0, 0, 0);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let s = 1;
  const len = parseFloat($('#lenInput').value);
  if ($('#fitToggle').checked && len > 0) s = len / Math.max(size.x, size.z, 1e-6);
  holder.scale.setScalar(s);
  holder.position.set(-center.x * s, -box.min.y * s, -center.z * s);
  current.size = size.multiplyScalar(s);
  fitScene(refit);
  renderStats();
}

/* ---------- camera fit + views ---------- */
const VIEWS = {
  '34': new THREE.Vector3(0.72, 0.30, 0.62),
  front: new THREE.Vector3(1, 0.12, 0),
  side: new THREE.Vector3(0, 0.08, 1),
  rear: new THREE.Vector3(-1, 0.15, 0),
  top: new THREE.Vector3(0.2, 1, 0.15),
};
let fitDistance = 10;
let tween = null;

function fitScene(moveCamera) {
  const size = current.size;
  const radius = Math.max(size.length() / 2, 0.01);
  const vf = THREE.MathUtils.degToRad(camera.fov);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  fitDistance = radius / Math.sin(Math.min(vf, hf) / 2) * 1.02;

  controls.target.set(0, size.y * 0.42, 0);
  controls.minDistance = radius * 0.5;
  controls.maxDistance = radius * 8;
  camera.near = radius / 50;
  camera.far = radius * 60;
  camera.updateProjectionMatrix();

  key.position.set(radius * 1.2, radius * 2.4, radius * 1.5);
  key.target.position.set(0, 0, 0);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -radius * 1.4; sc.right = sc.top = radius * 1.4;
  sc.near = radius * 0.5; sc.far = radius * 8;
  sc.updateProjectionMatrix();

  floor.scale.setScalar(radius * 4.5);
  shadowPlane.scale.setScalar(radius * 6);

  if (moveCamera) {
    camera.position.copy(controls.target).addScaledVector(VIEWS['34'].clone().normalize(), fitDistance);
    tween = null;
  }
  controls.update();
}

function goView(name) {
  const dir = VIEWS[name].clone().normalize();
  tween = {
    from: camera.position.clone(),
    to: controls.target.clone().addScaledVector(dir, fitDistance),
    t0: performance.now(),
    dur: 700,
  };
  setAutoRotate(false);
}

/* ---------- stats ---------- */
function renderStats() {
  const s = current.size;
  const mm = (v) => Math.round(v * 1000).toLocaleString('ko-KR') + ' mm';
  const rows = [
    ['전장', mm(Math.max(s.x, s.z))],
    ['전폭', mm(Math.min(s.x, s.z)) + ' (미러 포함)'],
    ['전고', mm(s.y)],
    ['메시', current.meshes.toLocaleString('ko-KR') + '개'],
    ['삼각형', current.tris.toLocaleString('ko-KR') + '개'],
    ['재질', current.entries.length + '종'],
  ];
  const dl = $('#stats');
  dl.replaceChildren(...rows.flatMap(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  }));
}

/* ---------- paint ---------- */
const PRESETS = [
  { n: '그레이', hex: '#6d7379', m: 0.7, r: 0.3 },
  { n: '화이트', hex: '#f1f1ec', m: 0.15, r: 0.28 },
  { n: '블랙', hex: '#0e0f11', m: 0.55, r: 0.2 },
  { n: '딥 그린', hex: '#1f3a30', m: 0.6, r: 0.28 },
  { n: '네이비', hex: '#17263f', m: 0.65, r: 0.25 },
  { n: '테라코타', hex: '#9a4a2e', m: 0.5, r: 0.3 },
  { n: '레드', hex: '#8f1218', m: 0.55, r: 0.25 },
];

function fillMaterialUI() {
  const sel = $('#matSelect');
  const total = current.entries.reduce((a, e) => a + e.area, 0) || 1;
  sel.replaceChildren(...current.entries.map((e, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${e.name || `(이름 없는 재질 ${i + 1})`} · ${(e.area / total * 100).toFixed(1)}%`;
    return o;
  }));
  sel.value = String(current.paintIdx);
  markSwatch(-1);
}

function setSlots(entry, mat) {
  for (const { mesh, index } of entry.slots) {
    if (index < 0) mesh.material = mat; else mesh.material[index] = mat;
  }
  entry.mat = mat;
}

// 지정 재질을 클리어코트가 있는 도장 재질로 바꾼다 (원본은 보관)
function paintMaterial(entry) {
  if (entry.mat !== entry.original) return entry.mat;
  const src = entry.original;
  const m = new THREE.MeshPhysicalMaterial();
  if (src.isMeshStandardMaterial) {
    THREE.MeshStandardMaterial.prototype.copy.call(m, src);
    m.defines = { STANDARD: '', PHYSICAL: '' };
  }
  m.map = null;
  m.clearcoat = 1;
  m.clearcoatRoughness = 0.04;
  m.transparent = false;
  m.opacity = 1;
  m.name = (src.name || 'paint') + ' (도장)';
  setSlots(entry, m);
  return m;
}

function applyPaint(hex, preset) {
  const entry = current.entries[current.paintIdx];
  if (!entry) return;
  if (flash) endFlash();
  const m = paintMaterial(entry);
  m.color.set(hex);
  if (preset) { m.metalness = preset.m; m.roughness = preset.r; }
  else if (entry.original.isMeshStandardMaterial) { /* 직접 고른 색은 질감 유지 */ }
  m.needsUpdate = true;
}

function restorePaint() {
  const entry = current.entries[current.paintIdx];
  if (!entry || entry.mat === entry.original) return;
  const painted = entry.mat;
  setSlots(entry, entry.original);
  painted.dispose();
  markSwatch(-1);
}

function markSwatch(i) {
  document.querySelectorAll('.swatch').forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
}

// 선택한 재질이 어디인지 잠깐 빛나게 표시
let flash = null;
function flashMaterial(entry) {
  const m = entry.mat;
  if (!m.emissive) return;
  if (flash) endFlash();
  flash = { m, color: m.emissive.clone(), intensity: m.emissiveIntensity, t0: performance.now() };
}
function endFlash() {
  flash.m.emissive.copy(flash.color);
  flash.m.emissiveIntensity = flash.intensity;
  flash = null;
}
const ACCENT = new THREE.Color('#5d9fff');

const sw = $('#swatches');
PRESETS.forEach((p, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'swatch'; b.style.background = p.hex;
  b.title = p.n; b.setAttribute('aria-label', p.n); b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => { applyPaint(p.hex, p); markSwatch(i); $('#colorInput').value = p.hex; });
  sw.append(b);
});
$('#colorInput').addEventListener('input', (e) => { applyPaint(e.target.value, null); markSwatch(-1); });
$('#restoreBtn').addEventListener('click', restorePaint);
$('#matSelect').addEventListener('change', (e) => {
  current.paintIdx = Number(e.target.value);
  markSwatch(-1);
  flashMaterial(current.entries[current.paintIdx]);
});

/* ---------- loading ---------- */
async function loadModel(url, name, manager) {
  setLoading(true, 0, `${name} 불러오는 중…`);
  try {
    const gltf = await makeLoader(manager).loadAsync(url, (e) => {
      if (e.total) setLoading(true, e.loaded / e.total, `${name} 불러오는 중… ${(e.loaded / 1048576).toFixed(1)} MB`);
    });
    setModel(gltf.scene, name, gltf.animations || []);
    toast(`${name} 불러왔습니다.`);
    return true;
  } catch (err) {
    console.error(err);
    toast(`불러오지 못했습니다: ${err && err.message ? err.message : err}`, 6000);
    return false;
  } finally {
    setLoading(false);
  }
}

function loadFiles(fileList) {
  const files = [...fileList];
  const main = files.find((f) => /\.(glb|gltf)$/i.test(f.name));
  if (!main) { toast('.glb 또는 .gltf 파일을 선택하세요.'); return; }
  const urls = new Map(files.map((f) => [f.name, URL.createObjectURL(f)]));
  const manager = new THREE.LoadingManager();
  // .gltf가 참조하는 .bin, 텍스처를 함께 선택한 파일에서 찾는다
  manager.setURLModifier((u) => {
    const base = decodeURIComponent(u.split(/[\\/]/).pop().split('?')[0]);
    return urls.get(base) || u;
  });
  loadModel(urls.get(main.name), main.name, manager).finally(() => urls.forEach((u) => URL.revokeObjectURL(u)));
}

function showPrototype() {
  setModel(buildPrototypeCar(), 'Palisade LX2 프로토타입', []);
}

$('#fileInput').addEventListener('change', (e) => { if (e.target.files.length) loadFiles(e.target.files); e.target.value = ''; });
$('#protoBtn').addEventListener('click', () => { $('#lenInput').value = '5.06'; showPrototype(); });
$('#urlForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = $('#urlInput').value.trim();
  if (u) loadModel(u, u.split('/').pop() || u);
});

// 드래그 앤 드롭
let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('#dropOverlay').hidden = false; });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropOverlay').hidden = true; });
window.addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; $('#dropOverlay').hidden = true;
  if (e.dataTransfer && e.dataTransfer.files.length) loadFiles(e.dataTransfer.files);
});

/* ---------- size / orientation / view controls ---------- */
$('#fitToggle').addEventListener('change', () => normalize(true));
$('#lenInput').addEventListener('change', () => normalize(true));
$('#rotL').addEventListener('click', () => { current.yaw += Math.PI / 2; normalize(false); });
$('#rotR').addEventListener('click', () => { current.yaw -= Math.PI / 2; normalize(false); });
$('#flip').addEventListener('click', () => { current.yaw += Math.PI; normalize(false); });

document.querySelectorAll('#views .btn').forEach((b) => b.addEventListener('click', () => goView(b.dataset.view)));

function setAutoRotate(v) { controls.autoRotate = v; $('#autoRotate').checked = v; }
$('#autoRotate').checked = controls.autoRotate;
$('#autoRotate').addEventListener('change', (e) => setAutoRotate(e.target.checked));
controls.addEventListener('start', () => { tween = null; });

$('#animBtn').addEventListener('click', (e) => {
  const playing = e.currentTarget.getAttribute('aria-pressed') === 'true';
  current.actions.forEach((a) => (playing ? a.stop() : a.reset().play()));
  e.currentTarget.setAttribute('aria-pressed', String(!playing));
  e.currentTarget.textContent = playing ? '애니메이션 재생' : '애니메이션 정지';
});

$('#exposure').addEventListener('input', (e) => { renderer.toneMappingExposure = Number(e.target.value); });
$('#envInt').addEventListener('input', (e) => { scene.environmentIntensity = Number(e.target.value); });

$('#shotBtn').addEventListener('click', () => {
  renderer.render(scene, camera);
  renderer.domElement.toBlob((blob) => {
    if (!blob) { toast('이미지를 만들지 못했습니다.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (current.name.replace(/\.[^.]+$/, '') || 'car') + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
});

/* ---------- resize + loop ---------- */
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (current) fitScene(false);
}
new ResizeObserver(resize).observe(viewport);

renderer.setAnimationLoop((now) => {
  const dt = clock.getDelta();
  if (tween) {
    const t = Math.min(1, (now - tween.t0) / tween.dur);
    const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(tween.from, tween.to, k);
    if (t >= 1) tween = null;
  }
  if (flash) {
    const t = (now - flash.t0) / 900;
    if (t >= 1) endFlash();
    else { flash.m.emissive.copy(ACCENT); flash.m.emissiveIntensity = Math.sin(t * Math.PI) * 0.9; }
  }
  if (current && current.mixer) current.mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
});

/* ---------- start ---------- */
async function start() {
  resize();
  const param = new URLSearchParams(location.search).get('model');
  if (param) {
    $('#urlInput').value = param;
    if (await loadModel(param, param.split('/').pop())) return;
  } else {
    try {
      const r = await fetch(DEFAULT_MODEL, { method: 'HEAD' });
      if (r.ok) { $('#urlInput').value = DEFAULT_MODEL; if (await loadModel(DEFAULT_MODEL, 'palisade-lx2.glb')) return; }
    } catch (e) { /* 기본 모델 없음 */ }
  }
  showPrototype();
}
start();
