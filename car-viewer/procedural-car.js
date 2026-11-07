// 코드로 만든 팰리세이드 LX2(1세대, 2022 페이스리프트) 근사 모형.
// .glb 모델이 없을 때 대신 보여준다. 단위는 미터, 차 앞쪽이 +X, 오른쪽이 +Z, 바닥이 y=0.
//
// 주요 치수는 아래 SPEC 한 곳에서만 정하고, 나머지 형상은 모두 여기서 계산한다.
// 공개 제원(출처는 README 참고)으로 확인한 값과, 사진 비율로 추정한 값을 구분해 적었다.
import * as THREE from 'three';

export const PALISADE_LX2_SPEC = {
  // 공개 제원으로 확인한 값
  length: 4.995,        // 전장 (페이스리프트 이전 4.980)
  width: 1.975,         // 전폭 (사이드미러 제외)
  height: 1.750,        // 전고 (루프랙 포함)
  wheelbase: 2.900,     // 축거
  trackFront: 1.708,    // 윤거 전
  trackRear: 1.716,     // 윤거 후
  overhangRear: 1.135,  // 후방 오버행
  clearance: 0.203,     // 최저지상고
  tire: { width: 0.245, aspect: 0.50, rimInch: 20 }, // 245/50R20
  approachDeg: 18.5,    // 접근각
  departureDeg: 20.3,   // 이탈각
  // 사진 비율로 추정한 값
  hoodFront: 1.040,     // 보닛 앞끝 높이
  cowl: 1.170,          // 와이퍼 카울(앞유리 아래) 높이
  beltRear: 1.220,      // 뒤쪽 벨트라인 높이
  roofRail: 0.050,      // 루프랙 높이
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

// LX2 페이스리프트의 큰 그릴: 가로로 엇갈린 사각 블록 패턴
function grilleTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#08090b'; g.fillRect(0, 0, c.width, c.height);
  const bw = 46, bh = 26, gap = 8;
  for (let row = 0, y = gap; y < c.height; row++, y += bh + gap) {
    for (let x = gap + (row % 2 ? (bw + gap) / 2 : 0) - (bw + gap); x < c.width; x += bw + gap) {
      const grd = g.createLinearGradient(0, y, 0, y + bh);
      grd.addColorStop(0, '#5d636b'); grd.addColorStop(0.5, '#2a2e34'); grd.addColorStop(1, '#16181c');
      g.fillStyle = grd; g.fillRect(x, y, bw, bh);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildPrototypeCar(spec = PALISADE_LX2_SPEC) {
  const S = spec;
  const named = (m, name) => { m.name = name; return m; };
  const paint = named(new THREE.MeshPhysicalMaterial({ color: 0x6d7379, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 }), 'Body_Paint');
  const glass = named(new THREE.MeshPhysicalMaterial({ color: 0x0a1016, metalness: 0.2, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6, side: THREE.DoubleSide }), 'Glass');
  const trim = named(new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.6, metalness: 0.1 }), 'Trim_Black');
  const gloss = named(new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.15, metalness: 0.4 }), 'Trim_Gloss');
  const well = named(new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 1 }), 'Wheel_Well');
  const chrome = named(new THREE.MeshStandardMaterial({ color: 0xd2d6db, roughness: 0.16, metalness: 1 }), 'Chrome');
  const rubber = named(new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.88 }), 'Tire');
  const rimMat = named(new THREE.MeshStandardMaterial({ color: 0xb4bac1, roughness: 0.25, metalness: 1 }), 'Rim');
  const rimDark = named(new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.35, metalness: 0.9 }), 'Rim_Dark');
  const discMat = named(new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5, metalness: 0.8 }), 'Brake_Disc');
  const drl = named(new THREE.MeshStandardMaterial({ color: 0x2a2c30, emissive: 0xffffff, emissiveIntensity: 1.8, roughness: 0.3 }), 'Lamp_DRL');
  const lens = named(new THREE.MeshStandardMaterial({ color: 0xdfe6ee, emissive: 0xcfe0ff, emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.6 }), 'Lamp_Projector');
  const tail = named(new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a14, emissiveIntensity: 1.4, roughness: 0.3 }), 'Lamp_Tail');
  const plateMat = named(new THREE.MeshStandardMaterial({ color: 0xe8ebee, roughness: 0.6 }), 'Plate');
  const grilleMat = named(new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.3, metalness: 0.6 }), 'Grille');

  const car = new THREE.Group();
  car.name = 'Palisade_LX2_Model';
  const box = (w, h, d, mat, x, y, z, parent = car, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (name) m.name = name; parent.add(m); return m;
  };

  /* ---------- 치수 계산 ---------- */
  const L2 = S.length / 2;
  const xF = L2 - (S.length - S.wheelbase - S.overhangRear); // 앞 차축 x
  const xR = xF - S.wheelbase;                                 // 뒤 차축 x
  const tireR = (S.tire.rimInch * 0.0254 + 2 * S.tire.width * S.tire.aspect) / 2;
  const rimR = S.tire.rimInch * 0.0254 / 2;
  const WY = tireR;          // 바퀴 중심 높이 (바닥에 닿음)
  const archR = tireR + 0.085; // 휠 아치 반지름 (옆면에서 보이는 값)

  // 하부 차체: 라운드 크기
  // 아치 몰딩·클래딩이 12mm 튀어나오므로, 차체 옆면은 그만큼 안쪽에 두어 전체 폭이 제원과 같게 한다
  const bs = 0.05, bt = 0.10, sideIn = 0.012;
  const bodyDepth = S.width - 2 * bt - 2 * sideIn;

  // 접근각/이탈각 선 위에 범퍼 아래 끝을 둔다
  const tanHalf = (deg) => Math.tan(deg * Math.PI / 360);
  const tan = (deg) => Math.tan(deg * Math.PI / 180);
  const fLip = 0.15, rLip = 0.15; // 범퍼 아래 끝이 차 끝에서 안쪽으로 들어간 거리
  const frontLipY = ((L2 - fLip) - xF - tireR * tanHalf(S.approachDeg)) * tan(S.approachDeg);
  const rearLipY = (xR - (-L2 + rLip) - tireR * tanHalf(S.departureDeg)) * tan(S.departureDeg);

  /* ---------- 하부 차체 ---------- */
  // 윤곽선 좌표에 bs를 더하거나 빼서, 라운드가 붙은 최종 외곽이 SPEC 값과 같게 한다.
  const fx = L2 - bs, rx = -L2 + bs;
  const body = new THREE.Shape();
  body.moveTo(-L2 + rLip, rearLipY + bs);
  body.lineTo(rx, 0.52);
  body.lineTo(rx + 0.005, S.beltRear - 0.02 - bs);
  body.lineTo(rx + 0.06, S.beltRear - bs);
  body.lineTo(xF - 0.34, S.cowl - bs);               // 벨트라인 → 카울
  body.lineTo(fx - 0.09, S.hoodFront - bs + 0.01);   // 보닛
  body.lineTo(fx - 0.025, S.hoodFront - bs - 0.015); // 보닛 앞끝 라운드
  body.lineTo(fx, 0.90);                              // 앞 범퍼 면 (그릴이 붙는 평면)
  body.lineTo(fx, 0.62);
  body.lineTo(fx - 0.005, 0.46);
  body.lineTo(L2 - fLip, frontLipY + bs);             // 앞 범퍼 아래 끝 (접근각)
  body.lineTo(xF + archR + 0.02, S.clearance + bs + 0.08);
  body.lineTo(xF + archR, WY);
  body.absarc(xF, WY, archR, 0, Math.PI, false);      // 앞 휠 아치
  body.lineTo(xF - archR - 0.04, S.clearance + bs);
  body.lineTo(xR + archR + 0.04, S.clearance + bs);   // 사이드 실 (최저지상고)
  body.lineTo(xR + archR, WY);
  body.absarc(xR, WY, archR, 0, Math.PI, false);      // 뒤 휠 아치
  body.lineTo(xR - archR - 0.02, S.clearance + bs + 0.10);
  body.closePath();
  car.add(new THREE.Mesh(extrude(body, bodyDepth, bt, bs, 8), paint));

  /* ---------- 캐빈 ---------- */
  const cbs = 0.04, cbt = 0.16;
  const cabDepth = S.width - 0.26 - 2 * cbt;  // 위로 갈수록 좁아지는 텀블홈
  const cabHalf = cabDepth / 2 + cbt;          // 옆유리 평면의 z
  const roofTop = S.height - S.roofRail;       // 루프 최고점(라운드 포함)
  const roofY = roofTop - cbs - 0.012;         // 윤곽선 기준 루프 앞뒤 끝 높이
  const wsBase = [xF - 0.34 + 0.06, S.cowl - 0.09];  // 앞유리 아래 (차체 안쪽으로 겹침)
  const wsTop = [xF - 1.12, roofY];                   // 앞유리 위
  const rgBase = [-L2 + 0.075, S.beltRear - 0.12];    // 뒷유리 아래
  const rgTop = [-L2 + 0.26, roofY];                  // 뒷유리 위
  const cab = new THREE.Shape();
  cab.moveTo(wsBase[0], wsBase[1]);
  cab.lineTo(wsTop[0], wsTop[1]);
  cab.quadraticCurveTo(-0.6, roofY + 0.024, rgTop[0], rgTop[1]);
  cab.lineTo(rgBase[0], rgBase[1]);
  cab.closePath();
  car.add(new THREE.Mesh(extrude(cab, cabDepth, cbt, cbs, 6), paint));

  // 앞유리·뒷유리 선 위의 x를 y로 구한다
  const lineX = (p0, p1, y) => p0[0] + (p1[0] - p0[0]) * (y - p0[1]) / (p1[1] - p0[1]);
  const wsX = (y) => lineX(wsBase, wsTop, y);
  const rgX = (y) => lineX(rgBase, rgTop, y);
  const beltY = (x) => (S.cowl + 0.02) + (S.beltRear + 0.02 - S.cowl - 0.02) * ((xF - 0.34) - x) / ((xF - 0.34) - (rx + 0.06));

  // 옆유리 3장 (B·C필러는 차체색, D필러 쪽 쿼터 유리는 LX2 특유의 뒤가 좁아지는 형태)
  const top = roofY - 0.05, bP = [-0.20, -0.28], cP = [-1.26, -1.35];
  const winFront = [[wsX(beltY(0.9)) - 0.15, beltY(0.9)], [wsX(top) - 0.13, top], [bP[0], top + 0.004], [bP[0], beltY(bP[0])]];
  const winRear = [[bP[1], beltY(bP[1])], [bP[1], top + 0.004], [cP[0], top + 0.006], [cP[0], beltY(cP[0])]];
  const qBottom = beltY(cP[1]);
  const winQuarter = [[cP[1], qBottom], [cP[1], top + 0.006], [rgX(top) + 0.30, top - 0.01], [rgX(qBottom + 0.05) + 0.17, qBottom + 0.05]];
  for (const s of [1, -1]) {
    for (const p of [winFront, winRear, winQuarter]) {
      const m = new THREE.Mesh(new THREE.ShapeGeometry(poly(p)), glass);
      m.position.z = s * (cabHalf + 0.002); car.add(m);
    }
    // 창 아래·위 크롬 몰딩
    const x0 = winFront[0][0], x1 = winQuarter[3][0];
    const belt = new THREE.Mesh(new THREE.ShapeGeometry(poly([[x0, beltY(x0) - 0.018], [x1, beltY(x1) + 0.032], [x1, beltY(x1) + 0.05], [x0, beltY(x0)]])), chrome);
    belt.position.z = s * (cabHalf + 0.004); car.add(belt);
    const t0 = winFront[1][0], t1 = winQuarter[2][0];
    const upper = new THREE.Mesh(new THREE.ShapeGeometry(poly([[t0, top + 0.01], [t1, top], [t1 - 0.02, top + 0.018], [t0, top + 0.028]])), chrome);
    upper.position.z = s * (cabHalf + 0.004); car.add(upper);
  }

  // 앞유리·뒷유리: 기울어진 면 위에 평면을 맞춰 붙임
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
  slantGlass([wsX(S.cowl + 0.0), S.cowl + 0.0], [wsX(roofY - 0.03), roofY - 0.03], 1, cabDepth - 0.08, cbs + 0.003);
  slantGlass([rgX(S.beltRear + 0.06), S.beltRear + 0.06], [rgX(roofY - 0.05), roofY - 0.05], -1, cabDepth - 0.16, cbs + 0.003);

  /* ---------- 루프랙, 스포일러 ---------- */
  const railY = S.height - 0.0175, railZ = cabDepth / 2 - 0.05;
  for (const s of [1, -1]) {
    box(wsTop[0] - rgTop[0] - 0.30, 0.035, 0.045, chrome, (wsTop[0] + rgTop[0]) / 2 - 0.05, railY, s * railZ);
    for (const x of [rgTop[0] + 0.25, -0.62, wsTop[0] - 0.30]) box(0.06, S.roofRail, 0.045, trim, x, S.height - S.roofRail / 2 - 0.005, s * railZ);
  }
  box(0.22, 0.035, cabDepth, paint, rgTop[0] + 0.06, roofTop - 0.02, 0).rotation.z = 0.10;
  box(0.03, 0.022, 0.5, tail, rgTop[0] - 0.04, roofTop - 0.04, 0);

  /* ---------- 휠 하우스, 하부, 아치 몰딩 ---------- */
  const bodyHalf = S.width / 2 - sideIn; // 차체 옆면의 z
  for (const x of [xF, xR]) {
    box(archR * 2.1, archR * 1.25, (S.trackFront / 2 - S.tire.width / 2 - 0.03) * 2, well, x, WY + archR * 0.45, 0);
    for (const s of [1, -1]) {
      const a = new THREE.Mesh(new THREE.TorusGeometry(archR + 0.004, sideIn, 8, 56, Math.PI), trim);
      a.position.set(x, WY, s * bodyHalf); car.add(a);
      // 아치 안쪽 라이너: 둥근 차체 모서리가 아치 안에서 보이지 않게 가린다
      const liner = new THREE.Mesh(new THREE.CylinderGeometry(archR - bs - 0.006, archR - bs - 0.006, 0.14, 48, 1, true, Math.PI / 2, Math.PI), trim);
      liner.rotation.x = Math.PI / 2;
      liner.position.set(x, WY, s * (bodyHalf - 0.07)); car.add(liner);
    }
  }
  box(S.wheelbase - 2 * archR, 0.10, 1.30, well, (xF + xR) / 2, S.clearance + 0.05, 0);

  /* ---------- 측면 디테일 ---------- */
  for (const s of [1, -1]) {
    const z = s * (bodyHalf + 0.002);
    const cut = (x, y0, y1) => box(0.008, y1 - y0, 0.006, well, x, (y0 + y1) / 2, z);
    cut(xF - archR - 0.02, S.clearance + 0.10, beltY(xF - archR) - 0.01);  // 앞문 앞
    cut((bP[0] + bP[1]) / 2, S.clearance + 0.10, beltY(bP[0]) - 0.01);    // 앞문/뒷문
    cut((cP[0] + cP[1]) / 2, WY + archR + 0.02, beltY(cP[0]) - 0.01);      // 뒷문 뒤
    for (const x of [0.05, (bP[1] + cP[0]) / 2 + 0.2]) box(0.20, 0.028, 0.014, chrome, x, beltY(x) - 0.13, s * (bodyHalf + 0.005));
    // 사이드 실 클래딩과 크롬 라인
    const sl = S.wheelbase - 2 * archR - 0.10;
    box(sl, 0.12, 2 * sideIn, trim, (xF + xR) / 2, S.clearance + 0.11, s * bodyHalf);
    box(sl, 0.014, 0.014, chrome, (xF + xR) / 2, S.clearance + 0.18, s * (bodyHalf + 0.004));
    // 사이드미러 (전폭에 포함되지 않음)
    const mg = new THREE.Group(); mg.name = 'Mirror'; mg.position.set(wsX(beltY(0.9)) - 0.12, beltY(0.9) + 0.06, s * cabHalf); car.add(mg);
    box(0.06, 0.05, 0.12, trim, 0, -0.03, s * 0.06, mg, 'Mirror_Arm');
    box(0.17, 0.13, 0.22, paint, 0.01, 0, s * 0.15, mg, 'Mirror_Cap');
    box(0.02, 0.11, 0.19, gloss, -0.075, 0, s * 0.15, mg, 'Mirror_Glass');
    box(0.02, 0.012, 0.15, drl, 0.03, -0.065, s * 0.17, mg, 'Mirror_Repeater');
  }

  /* ---------- 전면: 큰 그릴, 그릴 옆 세로 DRL, 모서리 헤드램프 ---------- */
  const gx = L2 + 0.0005;
  const gW = 1.24, gY0 = 0.47, gY1 = 0.90;
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(gW, gY1 - gY0), grilleMat);
  grille.rotation.y = Math.PI / 2; grille.position.set(gx, (gY0 + gY1) / 2, 0); car.add(grille);
  box(0.02, 0.022, gW + 0.04, chrome, gx - 0.008, gY1 - 0.011, 0);
  box(0.02, 0.022, gW - 0.10, chrome, gx - 0.008, gY0 + 0.011, 0);
  for (const s of [1, -1]) {
    box(0.02, gY1 - gY0, 0.022, chrome, gx - 0.008, (gY0 + gY1) / 2, s * (gW / 2 + 0.011));
    // 그릴 바깥으로 위에서 아래로 이어지는 분할형 DRL
    for (let i = 0; i < 5; i++) {
      const y = gY1 - 0.04 - i * 0.085;
      box(0.022, 0.06, 0.03, drl, gx - 0.010, y, s * (gW / 2 + 0.045));
    }
    // 헤드램프: 검은 하우징과 프로젝터 2개
    const hz = s * (gW / 2 + 0.20);
    box(0.03, 0.15, 0.25, gloss, gx - 0.013, 0.80, hz);
    for (const dz of [-0.06, 0.06]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24), lens);
      p.rotation.z = Math.PI / 2; p.position.set(gx - 0.009, 0.80, hz + dz); car.add(p);
    }
    box(0.02, 0.012, 0.22, drl, gx - 0.009, 0.885, hz);
    // 범퍼 모서리 공기흡입구
    box(0.02, 0.12, 0.22, trim, gx - 0.011, 0.53, s * (gW / 2 + 0.16));
  }
  box(0.03, 0.06, 0.95, chrome, L2 - 0.085, frontLipY + 0.07, 0); // 스키드 플레이트

  /* ---------- 후면 ---------- */
  const tx = -L2 + 0.018;
  for (const s of [1, -1]) {
    box(0.035, 0.42, 0.12, tail, tx, S.beltRear - 0.23, s * (bodyHalf - 0.16));
    box(0.03, 0.12, 0.30, tail, tx, S.beltRear - 0.09, s * (bodyHalf - 0.27));
  }
  box(0.02, 0.025, 1.10, chrome, -L2 + 0.010, S.beltRear - 0.25, 0);
  box(0.02, 0.15, 0.52, plateMat, -L2 + 0.010, 0.72, 0);
  box(0.05, 0.14, S.width - 0.30, trim, -L2 + 0.025, rearLipY + 0.12, 0);
  box(0.03, 0.04, 0.95, chrome, -L2 + 0.10, rearLipY + 0.04, 0);

  /* ---------- 휠 (245/50R20) ---------- */
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
    // 5쌍 10스포크
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(i / 2) / 5 * Math.PI * 2 + (i % 2 ? 0.11 : -0.11);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(rimR * 0.86, 0.034, 0.03), i % 2 ? rimMat : rimDark);
      sp.position.set(Math.cos(a) * rimR * 0.52, Math.sin(a) * rimR * 0.52, face - 0.012); sp.rotation.z = a; w.add(sp);
    }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR - 0.006, 0.013, 10, 72), rimMat);
    lip.position.z = face - 0.005; w.add(lip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.04, 32), gloss);
    hub.rotation.x = Math.PI / 2; hub.position.z = face - 0.005; w.add(hub);
  };
  for (const s of [1, -1]) { wheel(xF, s, S.trackFront); wheel(xR, s, S.trackRear); }

  car.userData.spec = S;
  car.userData.axles = { front: xF, rear: xR, tireRadius: tireR };
  return car;
}
