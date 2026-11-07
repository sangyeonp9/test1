// 코드로 만든 펠리세이드 LX2 근사 모형. .glb 모델이 없을 때 대신 보여준다.
// 단위는 미터, 차 앞쪽이 +X, 오른쪽이 +Z.
import * as THREE from 'three';

// ExtrudeGeometry는 면이 각져 보이므로 꺾임 각도 기준으로 법선을 다시 부드럽게 만든다.
function crease(geo, deg) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.attributes.position, n = pos.count;
  const fn = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const cb = new THREE.Vector3(), ab = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    cb.subVectors(c, b); ab.subVectors(a, b); cb.cross(ab);
    const L = cb.length(); if (L > 0) cb.divideScalar(L);
    for (let k = 0; k < 3; k++) { fn[(i + k) * 3] = cb.x; fn[(i + k) * 3 + 1] = cb.y; fn[(i + k) * 3 + 2] = cb.z; }
  }
  const groups = new Map(), q = (v) => Math.round(v * 2000);
  for (let i = 0; i < n; i++) {
    const key = q(pos.getX(i)) + '_' + q(pos.getY(i)) + '_' + q(pos.getZ(i));
    let l = groups.get(key); if (!l) { l = []; groups.set(key, l); } l.push(i);
  }
  const cos = Math.cos(deg * Math.PI / 180), out = new Float32Array(n * 3);
  for (const l of groups.values()) for (const i of l) {
    let x = 0, y = 0, z = 0;
    for (const j of l) {
      if (fn[i * 3] * fn[j * 3] + fn[i * 3 + 1] * fn[j * 3 + 1] + fn[i * 3 + 2] * fn[j * 3 + 2] >= cos) {
        x += fn[j * 3]; y += fn[j * 3 + 1]; z += fn[j * 3 + 2];
      }
    }
    const L = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / L; out[i * 3 + 1] = y / L; out[i * 3 + 2] = z / L;
  }
  g.setAttribute('normal', new THREE.Float32BufferAttribute(out, 3));
  return g;
}

function extrude(shape, depth, bt, bs, seg) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: 40, steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  return crease(g, 48);
}

function poly(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

function grilleTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, 512, 160);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 6; y < 160; y += 14) for (let x = 6; x < 512; x += 14) {
    const v = rnd();
    g.fillStyle = v > 0.86 ? '#5a6068' : v > 0.5 ? '#2a2e33' : '#1b1d21';
    g.fillRect(x, y, 9, 9);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildPrototypeCar() {
  const named = (m, name) => { m.name = name; return m; };
  const paint = named(new THREE.MeshPhysicalMaterial({ color: 0x6d7379, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 }), 'Body_Paint');
  const glass = named(new THREE.MeshPhysicalMaterial({ color: 0x0a1016, metalness: 0.2, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6, side: THREE.DoubleSide }), 'Glass');
  const trim = named(new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.55, metalness: 0.2 }), 'Trim_Black');
  const gloss = named(new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.15, metalness: 0.4 }), 'Trim_Gloss');
  const well = named(new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 1 }), 'Wheel_Well');
  const silver = named(new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.22, metalness: 1 }), 'Chrome');
  const rubber = named(new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.88 }), 'Tire');
  const rimMat = named(new THREE.MeshStandardMaterial({ color: 0xa7adb4, roughness: 0.28, metalness: 1 }), 'Rim');
  const discMat = named(new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5, metalness: 0.8 }), 'Brake_Disc');
  const drl = named(new THREE.MeshStandardMaterial({ color: 0x2a2c30, emissive: 0xffffff, emissiveIntensity: 1.8, roughness: 0.3 }), 'Lamp_DRL');
  const tail = named(new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a14, emissiveIntensity: 1.4, roughness: 0.3 }), 'Lamp_Tail');
  const plateMat = named(new THREE.MeshStandardMaterial({ color: 0xe8ebee, roughness: 0.6 }), 'Plate');
  const grilleMat = named(new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.35, metalness: 0.5 }), 'Grille');

  const car = new THREE.Group();
  car.name = 'Palisade_LX2_Prototype';
  const box = (w, h, d, mat, x, y, z, parent = car) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); parent.add(m); return m;
  };

  const XF = 1.485, XR = -1.485, WY = 0.40, R = 0.52;

  // 하부 차체: 옆모습 윤곽선을 폭 방향으로 밀어냄 (휠 아치는 윤곽선에서 잘라냄)
  const body = new THREE.Shape();
  body.moveTo(-2.44, 0.42);
  body.lineTo(XR - R - 0.03, 0.40);
  body.absarc(XR, WY, R, Math.PI, 0, true);
  body.lineTo(XR + R + 0.05, 0.32);
  body.lineTo(XF - R - 0.05, 0.32);
  body.lineTo(XF - R, WY);
  body.absarc(XF, WY, R, Math.PI, 0, true);
  body.lineTo(2.40, 0.40);
  body.lineTo(2.465, 0.55);
  body.lineTo(2.47, 0.88);
  body.lineTo(2.40, 1.02);
  body.lineTo(1.00, 1.10);
  body.lineTo(-2.35, 1.16);
  body.lineTo(-2.45, 1.12);
  body.lineTo(-2.47, 0.70);
  body.closePath();
  car.add(new THREE.Mesh(extrude(body, 1.74, 0.12, 0.07, 8), paint));

  // 캐빈
  const cab = new THREE.Shape();
  cab.moveTo(1.05, 1.05);
  cab.lineTo(0.62, 1.72);
  cab.quadraticCurveTo(-0.8, 1.76, -2.22, 1.72);
  cab.lineTo(-2.26, 1.64);
  cab.lineTo(-2.34, 1.05);
  cab.closePath();
  car.add(new THREE.Mesh(extrude(cab, 1.40, 0.14, 0.04, 6), paint));

  // 옆 유리
  const windows = [
    [[0.82, 1.22], [0.54, 1.66], [-0.30, 1.67], [-0.30, 1.22]],
    [[-0.38, 1.22], [-0.38, 1.67], [-1.33, 1.67], [-1.33, 1.22]],
    [[-1.42, 1.22], [-1.42, 1.67], [-2.12, 1.66], [-2.18, 1.22]],
  ];
  for (const s of [1, -1]) for (const p of windows) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(poly(p)), glass);
    m.position.z = s * 0.843; car.add(m);
  }

  // 앞·뒤 유리: 기울어진 면 위에 평면을 맞춰 붙임
  const slantGlass = (p0, p1, sign, width, off) => {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy);
    const t = new THREE.Vector3(dx / L, dy / L, 0);
    const n = new THREE.Vector3(t.y * sign, -t.x * sign, 0);
    const xa = new THREE.Vector3(0, 0, -sign);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, L), glass);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, t, n));
    m.position.set((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0).addScaledVector(n, off);
    car.add(m);
  };
  slantGlass([0.992, 1.14], [0.645, 1.68], 1, 1.30, 0.043);
  slantGlass([-2.320, 1.20], [-2.259, 1.65], -1, 1.28, 0.043);

  // 루프랙, 스포일러
  for (const s of [1, -1]) {
    box(2.6, 0.03, 0.045, silver, -0.82, 1.80, s * 0.64);
    for (const x of [-2.0, -0.82, 0.36]) box(0.05, 0.05, 0.045, trim, x, 1.775, s * 0.64);
  }
  box(0.24, 0.035, 1.32, paint, -2.25, 1.755, 0).rotation.z = 0.12;
  box(0.03, 0.025, 0.5, tail, -2.37, 1.735, 0);

  // 휠 하우스, 하부, 아치 몰딩
  for (const x of [XF, XR]) {
    box(1.12, 0.62, 1.30, well, x, 0.66, 0);
    for (const s of [1, -1]) {
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.525, 0.024, 8, 48, Math.PI), trim);
      a.position.set(x, WY, s * 0.992); car.add(a);
    }
  }
  box(4.7, 0.10, 1.30, well, 0, 0.30, 0);

  // 측면 디테일
  for (const s of [1, -1]) {
    for (const x of [0.95, -0.34, -1.375]) box(0.008, 0.78, 0.006, well, x, 0.79, s * 0.993);
    for (const x of [-0.05, -1.05]) box(0.20, 0.028, 0.012, silver, x, 1.04, s * 0.996);
    box(2.0, 0.10, 0.025, trim, 0, 0.44, s * 0.992);
    box(2.0, 0.012, 0.012, silver, 0, 0.50, s * 0.998);
    const mg = new THREE.Group(); mg.position.set(0.80, 1.24, s * 0.95); car.add(mg);
    box(0.05, 0.04, 0.16, trim, 0, -0.03, -s * 0.06, mg);
    box(0.15, 0.12, 0.22, paint, 0.01, 0, s * 0.06, mg);
    box(0.02, 0.10, 0.19, gloss, -0.066, 0, s * 0.06, mg);
  }

  // 전면
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.30), grilleMat);
  grille.rotation.y = Math.PI / 2; grille.position.set(2.546, 0.75, 0); car.add(grille);
  box(0.012, 0.012, 1.08, silver, 2.548, 0.905, 0);
  for (const s of [1, -1]) {
    box(0.03, 0.32, 0.22, gloss, 2.54, 0.76, s * 0.80);
    for (const z of [0.72, 0.80, 0.88]) box(0.02, 0.28, 0.022, drl, 2.556, 0.76, s * z);
    box(0.03, 0.16, 0.26, gloss, 2.53, 0.50, s * 0.76);
    box(0.02, 0.03, 0.18, drl, 2.545, 0.53, s * 0.76);
  }
  box(0.04, 0.10, 1.10, trim, 2.53, 0.49, 0);
  box(0.03, 0.05, 1.0, silver, 2.49, 0.40, 0);

  // 후면
  for (const s of [1, -1]) box(0.035, 0.58, 0.12, tail, -2.553, 0.82, s * 0.80);
  box(0.025, 0.028, 1.46, tail, -2.552, 1.00, 0);
  box(0.02, 0.14, 0.46, plateMat, -2.548, 0.64, 0);
  box(0.05, 0.14, 1.55, trim, -2.52, 0.49, 0);
  box(0.03, 0.04, 1.0, silver, -2.50, 0.40, 0);

  // 휠
  const tireProfile = [[0.285, -0.135], [0.34, -0.142], [0.383, -0.125], [0.40, -0.07], [0.402, 0], [0.40, 0.07], [0.383, 0.125], [0.34, 0.142], [0.285, 0.135]]
    .map((p) => new THREE.Vector2(p[0], p[1]));
  const tireGeo = new THREE.LatheGeometry(tireProfile, 72); tireGeo.rotateX(Math.PI / 2);
  const wheel = (x, s) => {
    const w = new THREE.Group(); w.position.set(x, WY, s * 0.835);
    if (s < 0) w.rotation.y = Math.PI;
    car.add(w);
    w.add(new THREE.Mesh(tireGeo, rubber));
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.02, 40), well);
    back.rotation.x = Math.PI / 2; back.position.z = 0.02; w.add(back);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.03, 40), discMat);
    disc.rotation.x = Math.PI / 2; disc.position.z = 0.05; w.add(disc);
    box(0.10, 0.17, 0.06, trim, -0.17, 0.08, 0.07, w);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + (i % 2 ? 0.07 : -0.07);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.03, 0.03), rimMat);
      sp.position.set(Math.cos(a) * 0.165, Math.sin(a) * 0.165, 0.115); sp.rotation.z = a; w.add(sp);
    }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.283, 0.014, 10, 64), rimMat);
    lip.position.z = 0.125; w.add(lip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 32), gloss);
    hub.rotation.x = Math.PI / 2; hub.position.z = 0.125; w.add(hub);
  };
  for (const x of [XF, XR]) for (const s of [1, -1]) wheel(x, s);

  return car;
}
