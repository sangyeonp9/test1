// 코드로 만든 팰리세이드 LX2(1세대, 2018–2021 페이스리프트 이전) 근사 모형.
// .glb 모델이 없을 때 대신 보여준다. 단위는 미터, 차 앞쪽이 +X, 오른쪽이 +Z, 바닥이 y=0.
//
// 주요 치수는 아래 SPEC 한 곳에서만 정하고, 나머지 형상은 모두 여기서 계산한다.
// 공개 제원으로 확인한 값과, 정측면 사진에서 잰 값을 구분해 적었다(출처와 측정 방법은 README).
import * as THREE from 'three';

export const PALISADE_LX2_SPEC = {
  // 공개 제원으로 확인한 값
  length: 4.980,        // 전장 (페이스리프트 이후 4.995)
  width: 1.975,         // 전폭 (사이드미러 제외)
  height: 1.750,        // 전고 (루프랙 포함)
  wheelbase: 2.900,     // 축거
  trackFront: 1.708,    // 윤거 전
  trackRear: 1.716,     // 윤거 후
  overhangRear: 1.135,  // 후방 오버행 (전방 945는 전장에서 계산)
  clearance: 0.203,     // 최저지상고
  tire: { width: 0.245, aspect: 0.50, rimInch: 20 }, // 245/50R20
  approachDeg: 18.5,    // 접근각
  departureDeg: 20.3,   // 이탈각

  // 정측면 사진에서 잰 값. 축거 2,900mm = 359px 로 환산(8.08mm/px).
  // 앞뒤 위치는 "앞 차축에서 뒤로 잰 거리(m)", 높이는 바닥에서 잰 값(m).
  // 사진 원근 때문에 차 앞뒤 끝은 짧아 보이므로, 옆면에 있는 요소만 쟀다.
  photo: {
    hoodFront: 1.034,                 // 보닛 앞끝 높이
    cowl: 1.185,                      // 앞유리 아래 옆면 숄더 높이 (창 아래 크롬선 바로 밑)
    beltFront: 1.188, beltRear: 1.212, // 창 아래선 높이 앞/뒤
    windowTop: 1.585,                 // 창 위선 높이
    roofTop: 1.713,                   // 루프 최고점 (루프랙 제외)
    aPillarBase: 0.549,               // 앞유리 아래끝(A필러 밑)
    aPillarTop: 1.172,                // 앞유리 위끝(A필러 위)
    bPillar: [1.600, 1.737],          // B필러 앞/뒤
    rearDoorWindowEnd: 2.505,         // 뒷문 유리 뒤끝
    cSlashTop: [2.666, 1.608],        // C필러 크롬 사선 위끝 [뒤로 거리, 높이]
    cSlashBottom: [2.990, 1.269],     // C필러 크롬 사선 아래끝
    quarterRearTop: 3.490,            // 쿼터 유리 뒤끝(위)
    quarterRearBottom: 3.740,         // 쿼터 유리 뒤끝(아래)
    frontDoorFront: 0.517,            // 앞문 앞 절개선
    rearDoorRear: 2.739,              // 뒷문 뒤 절개선
    handles: [[1.418, 1.030], [2.517, 1.050]], // 도어 손잡이 중심 [뒤로 거리, 높이]
    mirror: [0.768, 1.220],           // 사이드미러 중심 [뒤로 거리, 높이]
    archRadius: 0.4965,               // 휠 아치 반지름
    tailLamp: [0.700, 1.230],         // 테일램프 아래/위 높이
    // 위에서 본 앞뒤 모서리 라운드: 옆면 끝이 가운데보다 얼마나 뒤로(앞으로) 들어가는지(m).
    // 사진에서 차 끝 윤곽이 원근 보정 후에도 짧게 보이는 만큼으로 맞췄다. 뒤쪽은 [범퍼 높이, 루프 높이].
    planSweepFront: 0.12,
    planSweepRear: [0.20, 0.30],
  },
};

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

// 옆모습 윤곽선을 폭 방향으로 밀어낸다. 모서리 라운드(bevel)는 윤곽선 바깥으로 bs만큼,
// 폭 방향으로 bt만큼 더해지므로 전체 폭은 depth + 2*bt가 된다.
function extrude(shape, depth, bt, bs, seg) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: 48, steps: 1,
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


// LX2 그릴: 아래로 갈수록 커지는 마름모 크롬 조각이 줄지어 떨어지는 "캐스케이딩" 패턴
function grilleTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#06070a'; g.fillRect(0, 0, c.width, c.height);
  const rows = 11;
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const h = 20 + t * 22, w = 34 + t * 26, gap = 10 + t * 6;
    const y = 18 + r * 44 + t * 6;
    const off = r % 2 ? (w + gap) / 2 : 0;
    for (let x = -w + off; x < c.width + w; x += w + gap) {
      const grd = g.createLinearGradient(0, y, 0, y + h);
      grd.addColorStop(0, '#f2f4f7'); grd.addColorStop(0.45, '#8d939b'); grd.addColorStop(1, '#2b2f35');
      g.fillStyle = grd;
      g.beginPath();                       // 아래로 뾰족한 마름모(방패) 조각
      g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w * 0.62, y + h); g.lineTo(x + w * 0.38, y + h);
      g.closePath(); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ShapeGeometry의 UV를 모양의 경계 상자 기준 0..1로 다시 맞춘다
function fitUV(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  }
  uv.needsUpdate = true;
  return geo;
}

export function buildPrototypeCar(spec = PALISADE_LX2_SPEC) {
  const S = spec, P = spec.photo;
  const named = (m, name) => { m.name = name; return m; };
  const paint = named(new THREE.MeshPhysicalMaterial({ color: 0x6d7379, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 }), 'Body_Paint');
  const glass = named(new THREE.MeshPhysicalMaterial({ color: 0x0b1117, metalness: 0.3, roughness: 0.03, clearcoat: 1, envMapIntensity: 1.8, side: THREE.DoubleSide }), 'Glass');
  const blackout = named(new THREE.MeshPhysicalMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.12, clearcoat: 1, side: THREE.DoubleSide }), 'Pillar_Blackout');
  const trim = named(new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.6, metalness: 0.1 }), 'Trim_Black');
  const gloss = named(new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.15, metalness: 0.4 }), 'Trim_Gloss');
  const well = named(new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 1 }), 'Wheel_Well');
  const chrome = named(new THREE.MeshStandardMaterial({ color: 0xd2d6db, roughness: 0.16, metalness: 1, side: THREE.DoubleSide }), 'Chrome');
  const satin = named(new THREE.MeshStandardMaterial({ color: 0xaeb3b9, roughness: 0.38, metalness: 0.9 }), 'Satin_Silver');
  const rubber = named(new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.88 }), 'Tire');
  const rimMat = named(new THREE.MeshStandardMaterial({ color: 0xc3c8ce, roughness: 0.22, metalness: 1 }), 'Rim');
  const rimDark = named(new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.35, metalness: 0.9 }), 'Rim_Dark');
  const discMat = named(new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5, metalness: 0.8 }), 'Brake_Disc');
  const drl = named(new THREE.MeshStandardMaterial({ color: 0x2a2c30, emissive: 0xffffff, emissiveIntensity: 1.8, roughness: 0.3 }), 'Lamp_DRL');
  const lens = named(new THREE.MeshStandardMaterial({ color: 0xdfe6ee, emissive: 0xcfe0ff, emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.6 }), 'Lamp_Projector');
  const tail = named(new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a14, emissiveIntensity: 1.4, roughness: 0.3 }), 'Lamp_Tail');
  const reflector = named(new THREE.MeshStandardMaterial({ color: 0x7a0b0b, emissive: 0x550000, emissiveIntensity: 0.5, roughness: 0.3 }), 'Reflector');
  const plateMat = named(new THREE.MeshStandardMaterial({ color: 0xe8ebee, roughness: 0.6 }), 'Plate');
  const grilleMat = named(new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.28, metalness: 0.7 }), 'Grille');

  const car = new THREE.Group();
  car.name = 'Palisade_LX2_Model';
  const box = (w, h, d, mat, x, y, z, parent = car, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (name) m.name = name; parent.add(m); return m;
  };
  // 옆면(z 평면)에 붙이는 납작한 다각형. pts는 [x, y] 목록
  const sidePoly = (pts, mat, z) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(poly(pts)), mat);
    m.position.z = z; car.add(m); return m;
  };

  /* ---------- 치수 계산 ---------- */
  const L2 = S.length / 2;
  const xF = L2 - (S.length - S.wheelbase - S.overhangRear); // 앞 차축 x
  const xR = xF - S.wheelbase;                                 // 뒤 차축 x
  const bx = (behind) => xF - behind;                          // 사진 측정값(앞 차축에서 뒤로) → x
  const tireR = (S.tire.rimInch * 0.0254 + 2 * S.tire.width * S.tire.aspect) / 2;
  const rimR = S.tire.rimInch * 0.0254 / 2;
  const WY = tireR;
  const archR = P.archRadius;

  // 아치 몰딩·클래딩이 12mm 튀어나오므로, 차체 옆면은 그만큼 안쪽에 두어 전체 폭이 제원과 같게 한다
  const bs = 0.05, bt = 0.10, sideIn = 0.012;
  const bodyDepth = S.width - 2 * bt - 2 * sideIn;
  const bodyHalf = S.width / 2 - sideIn;

  // 접근각/이탈각 선 위에 범퍼 아래 끝을 둔다
  const tanHalf = (deg) => Math.tan(deg * Math.PI / 360);
  const tan = (deg) => Math.tan(deg * Math.PI / 180);
  const fLip = 0.15, rLip = 0.15;
  const frontLipY = ((L2 - fLip) - xF - tireR * tanHalf(S.approachDeg)) * tan(S.approachDeg);
  const rearLipY = (xR - (-L2 + rLip) - tireR * tanHalf(S.departureDeg)) * tan(S.departureDeg);

  /* ---------- 하부 차체 ---------- */
  const fx = L2 - bs, rx = -L2 + bs;
  const xCowl = bx(P.aPillarBase);
  const shoulderRear = P.beltRear - 0.005;
  const body = new THREE.Shape();
  body.moveTo(-L2 + rLip, rearLipY + bs);
  body.lineTo(rx, 0.52);
  body.lineTo(rx + 0.005, shoulderRear - 0.03 - bs);
  body.lineTo(rx + 0.06, shoulderRear - bs);
  body.lineTo(xCowl, P.cowl - bs);                     // 숄더(벨트) → 카울
  body.lineTo(fx - 0.06, P.hoodFront - bs);            // 보닛
  body.lineTo(fx - 0.012, P.hoodFront - bs - 0.04);    // 보닛 앞끝 라운드
  body.lineTo(fx, 0.95);                                // 앞면 (그릴·램프가 붙는 평면)
  body.lineTo(fx, 0.46);
  body.lineTo(fx - 0.03, 0.36);
  body.lineTo(L2 - fLip, frontLipY + bs);               // 앞 범퍼 아래 끝 (접근각)
  body.lineTo(xF + archR + 0.02, S.clearance + bs + 0.08);
  body.lineTo(xF + archR, WY);
  body.absarc(xF, WY, archR, 0, Math.PI, false);        // 앞 휠 아치
  body.lineTo(xF - archR - 0.04, S.clearance + bs);
  body.lineTo(xR + archR + 0.04, S.clearance + bs);     // 사이드 실 (최저지상고)
  body.lineTo(xR + archR, WY);
  body.absarc(xR, WY, archR, 0, Math.PI, false);        // 뒤 휠 아치
  body.lineTo(xR - archR - 0.02, S.clearance + bs + 0.10);
  body.closePath();
  car.add(new THREE.Mesh(extrude(body, bodyDepth, bt, bs, 8), paint));

  // 옆면 숄더 높이(라운드 포함)와 창 아래선
  const shoulderY = (x) => P.cowl + (shoulderRear - P.cowl) * (xCowl - x) / (xCowl - (rx + 0.06));
  const beltY = (x) => P.beltFront + (P.beltRear - P.beltFront) * (bx(P.aPillarBase) - x) / (bx(P.aPillarBase) - bx(P.quarterRearBottom));

  /* ---------- 캐빈 ---------- */
  const cbs = 0.04, cbt = 0.16;
  const cabDepth = S.width - 0.16 - 2 * cbt;  // 위로 갈수록 좁아지는 텀블홈 (숄더 폭 약 70mm, 후면 사진 기준)
  const cabHalf = cabDepth / 2 + cbt;          // 옆유리 평면의 z
  const roofY = P.roofTop - cbs - 0.012;
  const wsBase = [xCowl + 0.05, P.cowl - 0.07];        // 앞유리 선 (사진의 A필러 선)
  const wsTop = [bx(P.aPillarTop), roofY];
  const rgBase = [-L2 + 0.075, P.beltRear - 0.11];
  const rgTop = [-L2 + 0.26, roofY];
  const cab = new THREE.Shape();
  cab.moveTo(wsBase[0], wsBase[1]);
  cab.lineTo(wsTop[0], wsTop[1]);
  cab.quadraticCurveTo(-0.6, roofY + 0.024, rgTop[0], rgTop[1]);
  cab.lineTo(rgBase[0], rgBase[1]);
  cab.closePath();
  car.add(new THREE.Mesh(extrude(cab, cabDepth, cbt, cbs, 6), paint));

  const lineX = (p0, p1, y) => p0[0] + (p1[0] - p0[0]) * (y - p0[1]) / (p1[1] - p0[1]);
  const wsX = (y) => lineX(wsBase, wsTop, y);
  const rgX = (y) => lineX(rgBase, rgTop, y);

  /* ---------- 옆 유리: 검은 필러 띠(B·C·D) 위에 유리 3장, 크롬 몰딩 ---------- */
  const top = P.windowTop;
  const aW = 0.075;                                  // A필러 폭
  const xA = (y) => wsX(y) - aW;                     // 창 앞선
  const qRT = [bx(P.quarterRearTop), top], qRB = [bx(P.quarterRearBottom), beltY(bx(P.quarterRearBottom))];
  const dlo = [[xA(beltY(xA(1.2))), beltY(xA(1.2))], [xA(top), top], qRT, qRB];
  const b0 = bx(P.bPillar[0]), b1 = bx(P.bPillar[1]), c0 = bx(P.rearDoorWindowEnd);
  const sT = [bx(P.cSlashTop[0]), P.cSlashTop[1]], sB = [bx(P.cSlashBottom[0]), P.cSlashBottom[1]];
  const slashX = (y) => lineX(sB, sT, y);
  const qRX = (y) => lineX(qRB, qRT, y);
  const inset = 0.012;
  const windows = [
    [[xA(beltY(b0)) - inset, beltY(b0) + inset], [xA(top) - inset, top - inset], [b0 - inset, top - inset], [b0 - inset, beltY(b0) + inset]],
    [[b1 + inset, beltY(b1) + inset], [b1 + inset, top - inset], [c0 + inset, top - inset], [c0 + inset, beltY(c0) + inset]],
    [[slashX(top) - 0.03, top - inset], [qRX(top) + inset, top - inset], [qRX(beltY(qRB[0])) + inset * 2, beltY(qRB[0]) + inset], [slashX(beltY(sB[0])) - 0.03, beltY(sB[0]) + inset]],
  ];
  for (const s of [1, -1]) {
    const z = s * cabHalf;
    sidePoly(dlo, blackout, z + s * 0.001);
    for (const p of windows) sidePoly(p, glass, z + s * 0.002);
    // 크롬: 창 아래선, 창 위선, D필러 뒤 내림선, C필러 사선
    const xs = dlo[0][0], xe = qRB[0];
    sidePoly([[xs, beltY(xs) - 0.016], [xe, beltY(xe) - 0.016], [xe, beltY(xe)], [xs, beltY(xs)]], chrome, z + s * 0.003);
    sidePoly([[xA(top), top], [qRT[0], top], [qRT[0] + 0.004, top + 0.016], [xA(top) + 0.012, top + 0.016]], chrome, z + s * 0.003);
    sidePoly([[qRT[0], top], [qRT[0] - 0.016, top + 0.012], [qRB[0] - 0.016, qRB[1]], [qRB[0], qRB[1]]], chrome, z + s * 0.003);
    sidePoly([[sT[0], top + 0.016], [sT[0] - 0.02, top + 0.016], [sB[0] - 0.02, sB[1]], [sB[0], sB[1]]], chrome, z + s * 0.003);
  }

  // 앞유리·뒷유리
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
  slantGlass([wsX(P.cowl + 0.01), P.cowl + 0.01], [wsX(roofY - 0.03), roofY - 0.03], 1, cabDepth - 0.08, cbs + 0.003);
  slantGlass([rgX(P.beltRear + 0.05), P.beltRear + 0.05], [rgX(roofY - 0.05), roofY - 0.05], -1, cabDepth - 0.10, cbs + 0.003);

  /* ---------- 루프랙, 스포일러 ---------- */
  const rail = S.height - P.roofTop;
  const railZ = cabDepth / 2 - 0.05;
  for (const s of [1, -1]) {
    box(wsTop[0] - rgTop[0] - 0.30, rail * 0.7, 0.045, satin, (wsTop[0] + rgTop[0]) / 2 - 0.05, S.height - rail * 0.35, s * railZ);
    for (const x of [rgTop[0] + 0.25, -0.62, wsTop[0] - 0.30]) box(0.07, rail, 0.045, trim, x, S.height - rail / 2 - 0.004, s * railZ);
  }
  box(0.24, 0.035, cabDepth, paint, rgTop[0] + 0.07, P.roofTop - 0.02, 0).rotation.z = 0.10;
  box(0.03, 0.022, 0.5, tail, rgTop[0] - 0.04, P.roofTop - 0.04, 0);

  /* ---------- 휠 하우스, 하부, 아치 몰딩 ---------- */
  for (const x of [xF, xR]) {
    box(archR * 2.1, archR * 1.25, (S.trackFront / 2 - S.tire.width / 2 - 0.03) * 2, well, x, WY + archR * 0.45, 0);
    for (const s of [1, -1]) {
      const a = new THREE.Mesh(new THREE.TorusGeometry(archR + 0.004, sideIn, 8, 56, Math.PI), trim);
      a.position.set(x, WY, s * bodyHalf); car.add(a);
      const liner = new THREE.Mesh(new THREE.CylinderGeometry(archR - bs - 0.006, archR - bs - 0.006, 0.14, 48, 1, true, Math.PI / 2, Math.PI), trim);
      liner.rotation.x = Math.PI / 2;
      liner.position.set(x, WY, s * (bodyHalf - 0.07)); car.add(liner);
    }
  }
  box(S.wheelbase - 2 * archR, 0.10, 1.30, well, (xF + xR) / 2, S.clearance + 0.05, 0);

  /* ---------- 측면: 도어 절개선, 손잡이, 실 몰딩, 미러 ---------- */
  for (const s of [1, -1]) {
    const z = s * (bodyHalf + 0.002);
    const cut = (x, y0, y1) => box(0.008, y1 - y0, 0.006, well, x, (y0 + y1) / 2, z);
    const xFD = bx(P.frontDoorFront), xB = (b0 + b1) / 2, xRD = bx(P.rearDoorRear);
    cut(xFD, S.clearance + 0.12, shoulderY(xFD) - 0.02);
    cut(xB, S.clearance + 0.12, shoulderY(xB) - 0.02);
    cut(xRD, WY + archR + 0.03, shoulderY(xRD) - 0.02);
    for (const [d, y] of P.handles) box(0.19, 0.03, 0.014, chrome, bx(d), y, s * (bodyHalf + 0.005));
    // 앞문 아래 깊게 파인 캐릭터 라인을 가는 그림자 선으로 표시
    box(xFD - xRD - 0.2, 0.006, 0.006, well, (xFD + xRD) / 2, 0.66, z);
    // 사이드 실: 검은 클래딩 + 크롬 라인
    const sl = S.wheelbase - 2 * archR - 0.10;
    box(sl, 0.12, 2 * sideIn, trim, (xF + xR) / 2, S.clearance + 0.11, s * bodyHalf);
    box(sl, 0.014, 0.014, chrome, (xF + xR) / 2, S.clearance + 0.18, s * (bodyHalf + 0.004));
    // 사이드미러 (전폭에 포함되지 않음)
    const mg = new THREE.Group(); mg.name = 'Mirror';
    mg.position.set(bx(P.mirror[0]), P.mirror[1], s * cabHalf); car.add(mg);
    box(0.08, 0.05, 0.08, gloss, 0.03, -0.05, s * 0.04, mg, 'Mirror_Arm');
    box(0.20, 0.15, 0.22, paint, 0, 0, s * 0.10, mg, 'Mirror_Cap');
    box(0.02, 0.13, 0.19, gloss, -0.09, 0, s * 0.10, mg, 'Mirror_Glass');
    box(0.02, 0.012, 0.15, drl, 0.09, -0.06, s * 0.12, mg, 'Mirror_Repeater');
  }

  /* ---------- 전면 (페이스리프트 이전 LX2) ---------- */
  // 육각형 캐스케이딩 그릴: 위가 좁고, 중간에서 가장 넓고, 아래 모서리가 깎인 형태
  const gTop = 0.945, gMid = 0.72, gBot = 0.565;
  const grillePts = [[-0.50, gTop], [0.50, gTop], [0.585, gMid], [0.46, gBot], [-0.46, gBot], [-0.585, gMid]];
  const grilleShape = poly(grillePts);
  const toFront = (mesh, x) => { mesh.rotation.y = Math.PI / 2; mesh.position.x = x; car.add(mesh); return mesh; };
  toFront(new THREE.Mesh(fitUV(new THREE.ShapeGeometry(grilleShape)), grilleMat), L2 + 0.001);
  // 굵은 크롬 테두리: 바깥 윤곽에서 안쪽 그릴 윤곽을 뺀 고리
  const ring = new THREE.Shape();
  const grow = 1.07;
  const outer = grillePts.map(([u, v]) => [u * grow, gMid + (v - gMid) * 1.12]);
  ring.moveTo(outer[0][0], outer[0][1]); outer.slice(1).forEach(([u, v]) => ring.lineTo(u, v)); ring.closePath();
  const hole = new THREE.Path(); hole.moveTo(grillePts[0][0], grillePts[0][1]);
  grillePts.slice(1).forEach(([u, v]) => hole.lineTo(u, v)); hole.closePath();
  ring.holes.push(hole);
  const ringGeo = new THREE.ExtrudeGeometry(ring, { depth: 0.014, bevelEnabled: false });
  toFront(new THREE.Mesh(ringGeo, chrome), L2 - 0.012);
  // 현대 로고 (그릴 위쪽 가운데)
  const logo = (x, y, sign) => {
    const lg = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 40), chrome);
    lg.scale.set(1, 0.58, 0.4); lg.rotation.y = sign * Math.PI / 2; lg.position.set(x, y, 0); car.add(lg);
    const h = box(0.01, 0.06, 0.016, chrome, x, y, 0); h.rotation.x = 0.55;
  };
  logo(L2 + 0.002, 0.865, 1);

  for (const s of [1, -1]) {
    // 보닛 끝의 가는 윗램프 (앞면 → 펜더 옆으로 이어짐)
    const up = box(0.02, 0.026, 0.30, drl, L2 - 0.012, 0.955, s * 0.72);
    up.rotation.x = s * 0.06;
    box(0.30, 0.024, 0.02, drl, L2 - 0.20, 0.945, s * (bodyHalf + 0.002));
    // 범퍼 모서리의 세로형 헤드램프: 검은 하우징, 위아래로 쌓인 프로젝터 3개, 안쪽 "[" 모양 DRL
    const hz = s * 0.79;
    box(0.03, 0.36, 0.16, gloss, L2 - 0.013, 0.69, hz);
    for (const y of [0.59, 0.69, 0.79]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 24), lens);
      p.rotation.z = Math.PI / 2; p.position.set(L2 - 0.009, y, hz + s * 0.01); car.add(p);
    }
    box(0.022, 0.38, 0.024, drl, L2 - 0.01, 0.69, s * 0.698);
    box(0.022, 0.024, 0.07, drl, L2 - 0.01, 0.868, s * 0.722);
    box(0.022, 0.024, 0.07, drl, L2 - 0.01, 0.512, s * 0.722);
  }
  // 번호판, 아래 공기흡입구, 넓은 은색 스키드 플레이트
  box(0.02, 0.11, 0.52, plateMat, L2 - 0.006, 0.488, 0);
  box(0.04, 0.08, 1.30, trim, L2 - 0.02, 0.40, 0);
  box(0.10, 0.06, 1.56, satin, L2 - 0.08, 0.32, 0);
  for (const s of [1, -1]) {
    const k = box(0.10, 0.12, 0.05, satin, L2 - 0.085, 0.37, s * 0.80); k.rotation.x = s * 0.4;
  }

  /* ---------- 후면 ---------- */
  for (const s of [1, -1]) {
    // 모서리 세로형 테일램프 + 바깥쪽 은색 테두리, 옆면으로 감싸는 부분
    const ty = (P.tailLamp[0] + P.tailLamp[1]) / 2, th = P.tailLamp[1] - P.tailLamp[0];
    // 뒷면 윗모서리가 둥글게 넘어가므로 램프 위끝은 그 직전(약 1.16m)에서 멈춘다
    box(0.035, 0.40, 0.12, tail, -L2 + 0.018, 0.96, s * 0.80);
    box(0.03, 0.40, 0.02, satin, -L2 + 0.016, 0.96, s * 0.868);
    box(0.20, 0.32, 0.02, tail, -L2 + 0.13, ty + th * 0.02, s * (bodyHalf + 0.002));
    // 범퍼 아래 반사등
    box(0.02, 0.04, 0.12, reflector, -L2 + 0.006, rearLipY + 0.14, s * 0.78);
  }
  // 번호판, PALISADE 레터링, 로고
  box(0.02, 0.15, 0.52, plateMat, -L2 + 0.010, 0.92, 0);
  for (let i = 0; i < 8; i++) box(0.008, 0.022, 0.06, chrome, -L2 + 0.003, 1.07, (i - 3.5) * 0.11);
  logo(-L2 + 0.006, 1.10, -1);
  // 아래 범퍼: 검은 띠, 은색 스키드, 머플러 팁 2개
  box(0.05, 0.14, S.width - 0.30, trim, -L2 + 0.025, rearLipY + 0.12, 0);
  box(0.02, 0.05, 1.30, satin, -L2 + 0.008, rearLipY + 0.08, 0);
  for (const z of [0.47, 0.58]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.10, 24, 1, true), chrome);
    ex.rotation.z = Math.PI / 2; ex.position.set(-L2 + 0.05, rearLipY + 0.05, z); car.add(ex);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.034, 24), well);
    inner.rotation.y = -Math.PI / 2; inner.position.set(-L2 + 0.04, rearLipY + 0.05, z); car.add(inner);
  }

  /* ---------- 휠 (245/50R20, 10스포크) ---------- */
  const sw = S.tire.width / 2, side = S.tire.width * S.tire.aspect;
  const tireProfile = [
    [rimR + 0.004, -sw * 0.92], [rimR + side * 0.45, -sw], [tireR - side * 0.12, -sw * 0.92], [tireR, -sw * 0.55],
    [tireR + 0.001, 0], [tireR, sw * 0.55], [tireR - side * 0.12, sw * 0.92], [rimR + side * 0.45, sw], [rimR + 0.004, sw * 0.92],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const tireGeo = new THREE.LatheGeometry(tireProfile, 72); tireGeo.rotateX(Math.PI / 2);
  const wheel = (x, s, track) => {
    const w = new THREE.Group(); w.name = 'Wheel';
    w.position.set(x, WY, s * track / 2);
    if (s < 0) w.rotation.y = Math.PI;
    car.add(w);
    w.add(new THREE.Mesh(tireGeo, rubber));
    const face = sw * 0.85;
    const back = new THREE.Mesh(new THREE.CylinderGeometry(rimR, rimR, 0.02, 48), well);
    back.rotation.x = Math.PI / 2; back.position.z = face - 0.10; w.add(back);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.82, rimR * 0.82, 0.03, 48), discMat);
    disc.rotation.x = Math.PI / 2; disc.position.z = face - 0.075; w.add(disc);
    box(0.10, 0.17, 0.06, trim, -rimR * 0.65, rimR * 0.3, face - 0.05, w);
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(i / 2) / 5 * Math.PI * 2 + (i % 2 ? 0.13 : -0.13);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(rimR * 0.86, 0.032, 0.03), i % 2 ? rimMat : rimDark);
      sp.position.set(Math.cos(a) * rimR * 0.52, Math.sin(a) * rimR * 0.52, face - 0.012); sp.rotation.z = a; w.add(sp);
    }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR - 0.006, 0.013, 10, 72), rimMat);
    lip.position.z = face - 0.005; w.add(lip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.04, 32), gloss);
    hub.rotation.x = Math.PI / 2; hub.position.z = face - 0.005; w.add(hub);
  };
  for (const s of [1, -1]) { wheel(xF, s, S.trackFront); wheel(xR, s, S.trackRear); }

  /* ---------- 위에서 본 앞뒤 모서리 라운드 ---------- */
  // 압출로 만든 차체는 위에서 보면 모서리가 네모나다. 실차는 앞뒤 모서리가 크게 둥글어서,
  // 오버행 구간의 정점을 옆면에 가까울수록(|z|가 클수록) 안쪽으로 당긴다.
  // 가운데(z=0)는 움직이지 않으므로 전장은 그대로다. 휠과 미러는 건드리지 않는다.
  const hw = S.width / 2;
  const fStart = xF + archR + 0.02, rStart = xR - archR - 0.02;
  const fSpan = L2 - fStart, rSpan = rStart + L2;
  const sweepFront = P.planSweepFront;
  const sweepRear = (y) => P.planSweepRear[0] + (P.planSweepRear[1] - P.planSweepRear[0]) * Math.min(Math.max((y - 1.0) / 0.7, 0), 1);
  // 변위 d(x,z)와 편미분 [d, ∂d/∂x, ∂d/∂z]
  const sweep = (x, y, z) => {
    const a = Math.min(Math.abs(z) / hw, 1);
    const G = Math.pow(a, 2.2), Gz = a < 1 ? 2.2 * Math.pow(a, 1.2) / hw * Math.sign(z) : 0;
    if (x > fStart) {
      const t = Math.min((x - fStart) / fSpan, 1), T = Math.pow(t, 1.6), Tx = t < 1 ? 1.6 * Math.pow(t, 0.6) / fSpan : 0;
      return [-sweepFront * T * G, -sweepFront * Tx * G, -sweepFront * T * Gz];
    }
    if (x < rStart) {
      const A = sweepRear(y);
      const t = Math.min((rStart - x) / rSpan, 1), T = Math.pow(t, 1.6), Tx = t < 1 ? -1.6 * Math.pow(t, 0.6) / rSpan : 0;
      return [A * T * G, A * Tx * G, A * T * Gz];
    }
    return [0, 0, 0];
  };
  car.updateMatrixWorld(true);
  for (const m of [...car.children]) {
    if (!m.isMesh) continue;              // 휠·미러 그룹은 제외
    const g = m.geometry;
    g.applyMatrix4(m.matrix);             // 위치·회전을 정점에 굽고, 메시 변환은 초기화
    m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
    const pos = g.attributes.position, nor = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const [d, dx, dz] = sweep(x, y, z);
      if (!d && !dx && !dz) continue;
      pos.setX(i, x + d);
      if (nor) {                          // 법선은 변형의 역전치 행렬로 바꾼다
        const nx = nor.getX(i), k = 1 / (1 + dx);
        const v = new THREE.Vector3(nx * k, nor.getY(i), nor.getZ(i) - nx * dz * k).normalize();
        nor.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true; if (nor) nor.needsUpdate = true;
    g.computeBoundingBox(); g.computeBoundingSphere();
  }

  car.userData.spec = S;
  car.userData.axles = { front: xF, rear: xR, tireRadius: tireR };
  return car;
}
