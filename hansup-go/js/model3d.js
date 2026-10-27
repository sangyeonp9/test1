// 도감 캐릭터 3D 모델 만들기 (three.js 기본 도형 조합)
// 모든 모델은 높이 약 1, 발바닥이 y=0, 얼굴이 +z(카메라 쪽)를 바라봅니다.
// userData에 애니메이션용 부품(눈, 날개, 꼬리)을 담아 돌려줍니다.

export function buildModel(THREE, sp) {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const SPH = new THREE.SphereGeometry(1, 32, 24);
  const HEMI = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const CIRCLE = new THREE.CircleGeometry(1, 40);
  const matCache = new Map();

  function mat(color, o = {}) {
    const key = JSON.stringify([color, o]);
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: o.rough ?? 0.55,
      metalness: o.metal ?? 0,
      emissive: o.glow ? new THREE.Color(color) : new THREE.Color(0x000000),
      emissiveIntensity: o.glow || 0,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      depthWrite: (o.opacity ?? 1) >= 1,
    });
    matCache.set(key, m);
    return m;
  }

  function add(parent, geo, color, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], o = {}) {
    const m = new THREE.Mesh(geo, mat(color, o));
    m.position.set(...pos);
    m.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
    m.rotation.set(...rot);
    parent.add(m);
    return m;
  }
  const ball = (p, c, pos, s, o, rot) => add(p, SPH, c, pos, s, rot, o);
  const cone = (p, c, pos, r, h, rot, o) => add(p, new THREE.ConeGeometry(r, h, 24), c, pos, 1, rot, o);
  const cyl = (p, c, pos, r1, r2, h, rot, o) => add(p, new THREE.CylinderGeometry(r1, r2, h, 16), c, pos, 1, rot, o);
  const torus = (p, c, pos, R, t, arc, rot, o) => add(p, new THREE.TorusGeometry(R, t, 12, 32, arc ?? Math.PI * 2), c, pos, 1, rot, o);
  const disc = (p, c, pos, s, rot, o) => add(p, CIRCLE, c, pos, s, rot, { double: true, ...o });
  function tube(p, c, pts, r, o) {
    const curve = new THREE.CatmullRomCurve3(pts.map(a => V(...a)));
    return add(p, new THREE.TubeGeometry(curve, 40, r, 12, false), c, [0, 0, 0], 1, [0, 0, 0], o);
  }

  // 타원체 몸통 위의 한 점과 그 점의 바깥 방향
  function surf(b, x, y, side = 1) {
    const u = Math.max(0, 1 - (x / b.rx) ** 2 - ((y - b.cy) / b.ry) ** 2);
    const z = b.cz + side * b.rz * Math.sqrt(u);
    const n = V(x / b.rx ** 2, (y - b.cy) / b.ry ** 2, (z - b.cz) / b.rz ** 2).normalize();
    return { p: V(x, y, z), n };
  }
  function placeOn(b, obj, x, y, out = 0, side = 1) {
    const { p, n } = surf(b, x, y, side);
    obj.position.copy(p.addScaledVector(n, out));
    obj.quaternion.setFromUnitVectors(V(0, 0, 1), n);
    return obj;
  }

  const eyes = [];
  const wings = [];
  const tails = [];

  // 얼굴: 눈, 볼터치, 입
  function face(parent, b, { ey, ex, es = 0.085, mouth = 'smile', blush = true, white = false, my }) {
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      if (white) {
        ball(g, '#ffffff', [0, 0, 0], [es * 1.15, es * 1.15, es * 0.7]);
        ball(g, '#2b2b33', [0, -es * 0.1, es * 0.55], [es * 0.62, es * 0.7, es * 0.35]);
        ball(g, '#ffffff', [es * 0.22, es * 0.18, es * 0.85], es * 0.2);
      } else {
        ball(g, '#2b2b33', [0, 0, 0], [es * 0.78, es, es * 0.5], { rough: 0.25 });
        ball(g, '#ffffff', [es * 0.3, es * 0.35, es * 0.42], es * 0.3, { glow: 0.4 });
        ball(g, '#ffffff', [-es * 0.25, -es * 0.35, es * 0.4], es * 0.13, { glow: 0.4 });
      }
      placeOn(b, g, sx * ex, ey, 0.005);
      parent.add(g);
      eyes.push(g);
      if (blush) {
        const bl = new THREE.Mesh(SPH, mat('#ff8fa3', { opacity: 0.6 }));
        bl.scale.set(es * 1.0, es * 0.55, es * 0.12);
        placeOn(b, bl, sx * (ex + es * 1.25), ey - es * 1.5, 0.004);
        parent.add(bl);
      }
    }
    const mY = my ?? ey - es * 1.9;
    if (mouth === 'smile') {
      const m = new THREE.Mesh(new THREE.TorusGeometry(es * 0.55, es * 0.12, 8, 20, Math.PI), mat('#2b2b33'));
      placeOn(b, m, 0, mY + es * 0.3, 0.004);
      m.rotateZ(Math.PI);
      parent.add(m);
    } else if (mouth === 'cat') {
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(es * 0.32, es * 0.1, 8, 16, Math.PI), mat('#2b2b33'));
        placeOn(b, m, sx * es * 0.32, mY + es * 0.2, 0.004);
        m.rotateZ(Math.PI);
        parent.add(m);
      }
    }
  }

  const root = new THREE.Group();
  const body = new THREE.Group(); // 숨쉬기 애니메이션 대상
  root.add(body);
  let flyer = false;
  let swimmer = false;

  // ---------- 몬스터 ----------
  function monster(s) {
    const shapes = {
      round: { cx: 0, cy: 0.44, cz: 0, rx: 0.5, ry: 0.42, rz: 0.44 },
      tall: { cx: 0, cy: 0.5, cz: 0, rx: 0.38, ry: 0.5, rz: 0.36 },
      drop: { cx: 0, cy: 0.38, cz: 0, rx: 0.46, ry: 0.38, rz: 0.42 },
      pear: { cx: 0, cy: 0.44, cz: 0, rx: 0.44, ry: 0.46, rz: 0.4 },
      cloud: { cx: 0, cy: 0.5, cz: 0, rx: 0.38, ry: 0.34, rz: 0.36 },
    };
    const b = shapes[s.shape];
    const glow = s.glow ? 0.5 : 0;
    if (s.shape === 'cloud') {
      for (const [x, y, r] of [[0, 0.5, 0.36], [-0.34, 0.36, 0.26], [0.34, 0.36, 0.26], [-0.16, 0.28, 0.27], [0.16, 0.28, 0.27]]) {
        ball(body, s.body, [x, y, 0], r, { rough: 0.9 });
      }
    } else if (s.shape === 'drop') {
      ball(body, s.body, [0, b.cy, 0], [b.rx, b.ry, b.rz], { glow: glow * 0.3 });
      cone(body, s.body, [0, b.cy + b.ry * 0.95, 0], b.rx * 0.62, 0.42, [0, 0, 0], { glow: glow * 0.3 });
    } else if (s.shape === 'pear') {
      ball(body, s.body, [0, b.cy, 0], [b.rx, b.ry, b.rz]);
      ball(body, s.body, [0, 0.26, 0], [b.rx * 1.08, 0.26, b.rz * 1.02]);
    } else {
      ball(body, s.body, [0, b.cy, 0], [b.rx, b.ry, b.rz], { glow: glow * 0.2 });
    }
    if (s.shape !== 'cloud') {
      ball(body, s.belly, [0, b.cy - b.ry * 0.38, b.rz * 0.5], [b.rx * 0.6, b.ry * 0.48, b.rz * 0.55], { glow });
      for (const sx of [-1, 1]) ball(body, s.accent, [sx * b.rx * 0.45, 0.05, b.rz * 0.35], [0.15, 0.07, 0.19]);
    }
    const top = b.cy + b.ry;
    switch (s.top) {
      case 'sprout':
        cyl(body, s.accent, [0, top + 0.1, 0], 0.025, 0.03, 0.22);
        ball(body, s.accent, [-0.1, top + 0.2, 0], [0.13, 0.04, 0.07], {}, [0, 0, 0.5]);
        ball(body, '#6cc04a', [0.12, top + 0.23, 0], [0.15, 0.045, 0.08], {}, [0, 0, -0.45]);
        break;
      case 'acorn':
        ball(body, '#b5763a', [0, top + 0.08, 0], [0.12, 0.13, 0.12]);
        add(body, HEMI, '#6e4523', [0, top + 0.1, 0], [0.135, 0.09, 0.135]);
        cyl(body, '#6e4523', [0, top + 0.21, 0], 0.015, 0.015, 0.06);
        break;
      case 'flame':
        cone(body, '#ffcf3f', [0, top + 0.12, 0], 0.13, 0.32, [0, 0, 0], { glow: 0.6 });
        cone(body, s.accent, [0, top + 0.08, 0.05], 0.07, 0.18, [0, 0, 0], { glow: 0.6 });
        break;
      case 'antenna':
        for (const sx of [-1, 1]) {
          tube(body, s.body, [[sx * 0.12, top - 0.05, 0], [sx * 0.2, top + 0.12, 0], [sx * 0.28, top + 0.22, 0]], 0.022);
          ball(body, s.accent, [sx * 0.28, top + 0.24, 0], 0.07, { glow: 0.9 });
        }
        break;
      case 'antenna2':
        tube(body, s.accent, [[0, top - 0.03, 0], [0.02, top + 0.12, 0], [0.1, top + 0.2, 0]], 0.02);
        ball(body, '#ffd23f', [0.11, top + 0.21, 0], 0.055, { glow: 0.5 });
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ball(body, '#ffffff', [Math.cos(a) * 0.1, top + 0.08 + Math.sin(a) * 0.1, 0.02], [0.07, 0.07, 0.03], {}, [0, 0, a]);
        }
        ball(body, '#ffd23f', [0, top + 0.08, 0.04], 0.055);
        break;
      case 'crown': {
        cyl(body, s.accent, [0, top + 0.02, 0], 0.2, 0.2, 0.1, [0, 0, 0], { metal: 0.6, rough: 0.3 });
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          cone(body, s.accent, [Math.sin(a) * 0.18, top + 0.12, Math.cos(a) * 0.18], 0.05, 0.14, [0, 0, 0], { metal: 0.6, rough: 0.3 });
        }
        ball(body, '#e8532b', [0, top + 0.03, 0.2], 0.035, { rough: 0.2 });
        break;
      }
      case 'mushroom': {
        add(body, HEMI, s.accent, [0, top - 0.1, 0], [0.5, 0.3, 0.46]);
        for (const [x, y, z, r] of [[-0.22, top + 0.02, 0.28, 0.06], [0.08, top + 0.13, 0.24, 0.07], [0.28, top - 0.02, 0.26, 0.05], [-0.05, top + 0.18, -0.1, 0.06]]) {
          ball(body, '#ffffff', [x, y, z], [r, r, r * 0.5]);
        }
        break;
      }
      case 'star': {
        cyl(body, s.body, [0.04, top + 0.06, 0], 0.018, 0.018, 0.16, [0, 0, -0.3]);
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.05 : 0.12;
          const a = Math.PI / 2 + (i * Math.PI) / 5;
          i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const g = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
        add(body, g, s.accent, [0.08, top + 0.2, -0.025], 1, [0, 0, 0], { glow: 0.7 });
        break;
      }
      case 'horn':
        cone(body, '#fff3c4', [0, top + 0.12, 0.05], 0.07, 0.3, [0.15, 0, 0]);
        torus(body, s.accent, [0, top + 0.06, 0.04], 0.055, 0.012, null, [Math.PI / 2 + 0.15, 0, 0]);
        break;
      case 'snow':
        for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
          add(body, new THREE.BoxGeometry(0.03, 0.26, 0.03), s.accent, [0, top + 0.1, 0], 1, [0, 0, a]);
        }
        ball(body, '#ffffff', [0, top + 0.1, 0.02], 0.04);
        break;
      case 'cat':
        for (const sx of [-1, 1]) {
          cone(body, s.body, [sx * 0.3, top - 0.02, 0], 0.15, 0.3, [0, 0, -sx * 0.35]);
          cone(body, '#ffb3c1', [sx * 0.29, top - 0.02, 0.06], 0.08, 0.18, [0, 0, -sx * 0.35]);
        }
        break;
      case 'bunny':
        for (const sx of [-1, 1]) {
          ball(body, s.body, [sx * 0.17, top + 0.25, 0], [0.09, 0.3, 0.07], {}, [0, 0, -sx * 0.2]);
          ball(body, s.accent, [sx * 0.17, top + 0.26, 0.05], [0.045, 0.22, 0.03], { opacity: 0.8 }, [0, 0, -sx * 0.2]);
        }
        break;
      case 'bear':
        for (const sx of [-1, 1]) {
          ball(body, s.accent, [sx * 0.3, top - 0.02, 0], [0.12, 0.12, 0.08]);
          ball(body, s.belly, [sx * 0.3, top - 0.02, 0.05], [0.06, 0.06, 0.04]);
        }
        break;
      default:
    }
    if (s.tail === 'squirrel') {
      const t = new THREE.Group();
      tube(t, s.accent, [[0, 0, 0], [0.16, 0.08, -0.08], [0.24, 0.35, -0.1], [0.14, 0.58, -0.06]], 0.11);
      ball(t, s.accent, [0.14, 0.6, -0.06], 0.12);
      t.position.set(0.3, 0.12, -0.2);
      body.add(t);
      tails.push({ obj: t, axis: 'z', amp: 0.18, speed: 3 });
    } else if (s.tail === 'stripe') {
      const t = new THREE.Group();
      tube(t, s.body, [[0, 0, 0], [0.18, 0.02, -0.06], [0.3, 0.2, -0.08], [0.32, 0.38, -0.06]], 0.07);
      for (const [x, y] of [[0.24, 0.08], [0.31, 0.22], [0.32, 0.34]]) torus(t, s.accent, [x, y, -0.07], 0.07, 0.025, null, [Math.PI / 2, 0, 0.6]);
      t.position.set(0.3, 0.12, -0.18);
      body.add(t);
      tails.push({ obj: t, axis: 'z', amp: 0.25, speed: 3.5 });
    }
    if (s.cape) {
      add(body, new THREE.CylinderGeometry(0.48, 0.58, 0.72, 24, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#c0392b', [0, 0.42, -0.02], 1, [0, 0, 0], { double: true });
    }
    const ey = b.cy + b.ry * 0.12;
    if (s.mask) {
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(SPH, mat(s.accent));
        m.scale.set(0.13, 0.1, 0.03);
        placeOn(b, m, sx * b.rx * 0.34, ey - 0.01, -0.005);
        m.rotateZ(sx * 0.35);
        body.add(m);
      }
    }
    face(body, b, { ey, ex: b.rx * 0.32, es: 0.085, mouth: s.top === 'cat' ? 'cat' : 'smile' });
    if (s.glasses) {
      for (const sx of [-1, 1]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 24), mat('#5b4636'));
        placeOn(b, r, sx * b.rx * 0.32, ey, 0.03);
        body.add(r);
      }
    }
    if (s.bell) {
      torus(body, '#e8532b', [0, b.cy - b.ry * 0.62, 0], b.rx * 0.78, 0.03, null, [Math.PI / 2, 0, 0]);
      ball(body, '#ffd23f', [0, b.cy - b.ry * 0.75, b.rz * 0.82], 0.07, { metal: 0.5, rough: 0.3 });
    }
  }

  // ---------- 곤충 ----------
  function legs(parent, color, y, spread, z = 0) {
    for (const sx of [-1, 1]) {
      for (const k of [-1, 0, 1]) {
        const l = cyl(parent, color, [sx * spread, y, z + k * 0.14], 0.015, 0.015, 0.26, [k * 0.3, 0, sx * 1.1]);
        l.position.x += sx * 0.08;
      }
    }
  }
  function antennae(parent, color, base, spread = 0.12, len = 0.22) {
    for (const sx of [-1, 1]) {
      tube(parent, color, [[sx * 0.04, base[1], base[2]], [sx * spread * 0.7, base[1] + len * 0.6, base[2] + 0.02], [sx * spread, base[1] + len, base[2]]], 0.014);
      ball(parent, color, [sx * spread, base[1] + len, base[2]], 0.035);
    }
  }
  function wing(parent, color, pos, scale, rot, o, side, axis = 'y', amp = 0.8, speed = 22) {
    const pivot = new THREE.Group();
    pivot.position.set(...pos);
    parent.add(pivot);
    const w = disc(pivot, color, [side * scale[0], scale[1] * 0.2, 0], [scale[0], scale[1], 1], rot, o);
    wings.push({ obj: pivot, axis, amp: amp * side, speed });
    return w;
  }

  function insect(s) {
    switch (s.draw) {
      case 'ladybug': {
        const b = { cx: 0, cy: 0.18, cz: -0.05, rx: 0.42, ry: 0.36, rz: 0.46 };
        add(body, HEMI, s.body, [0, 0.18, -0.05], [0.42, 0.36, 0.46], [0, 0, 0], { rough: 0.25 });
        add(body, new THREE.BoxGeometry(0.02, 0.02, 0.9), s.accent, [0, 0.535, -0.05]);
        for (const [x, y] of [[-0.18, 0.4], [0.18, 0.4], [-0.3, 0.26], [0.3, 0.26], [-0.12, 0.25], [0.12, 0.25]]) {
          const d = new THREE.Mesh(SPH, mat(s.accent));
          d.scale.set(0.07, 0.07, 0.02);
          placeOn(b, d, x, y, 0);
          body.add(d);
        }
        legs(body, s.accent, 0.12, 0.3, -0.05);
        const h = { cx: 0, cy: 0.28, cz: 0.4, rx: 0.2, ry: 0.17, rz: 0.15 };
        ball(body, s.belly, [0, 0.28, 0.4], [0.2, 0.17, 0.15]);
        antennae(body, s.accent, [0, 0.42, 0.42]);
        face(body, h, { ey: 0.31, ex: 0.08, es: 0.05, white: true, mouth: 'none', blush: false });
        break;
      }
      case 'butterfly': {
        flyer = true;
        cyl(body, '#5b4636', [0, 0.45, 0], 0.045, 0.035, 0.5);
        const h = { cx: 0, cy: 0.76, cz: 0, rx: 0.13, ry: 0.13, rz: 0.12 };
        ball(body, '#ffe9c2', [0, 0.76, 0], 0.13);
        antennae(body, '#5b4636', [0, 0.86, 0], 0.13, 0.2);
        face(body, h, { ey: 0.78, ex: 0.05, es: 0.035, mouth: 'smile' });
        for (const sx of [-1, 1]) {
          const pv = new THREE.Group();
          pv.position.set(0, 0.5, -0.02);
          body.add(pv);
          disc(pv, s.accent, [sx * 0.27, 0.16, -0.003], [0.28, 0.23, 1], [0, 0, sx * 0.4]);
          disc(pv, s.body, [sx * 0.27, 0.16, 0], [0.25, 0.2, 1], [0, 0, sx * 0.4]);
          disc(pv, s.belly, [sx * 0.33, 0.2, 0.003], [0.07, 0.07, 1], [0, 0, 0]);
          disc(pv, s.accent, [sx * 0.2, -0.13, -0.003], [0.17, 0.15, 1], [0, 0, -sx * 0.4]);
          disc(pv, s.body, [sx * 0.2, -0.13, 0], [0.15, 0.13, 1], [0, 0, -sx * 0.4]);
          wings.push({ obj: pv, axis: 'y', amp: 0.9 * sx, speed: 10 });
        }
        break;
      }
      case 'dragonfly': {
        flyer = true;
        const dg = new THREE.Group();
        dg.scale.setScalar(1.45);
        dg.rotation.y = 0.75;
        dg.position.y = -0.2;
        body.add(dg);
        const tail = new THREE.Group();
        cyl(tail, s.body, [0, 0, 0], 0.04, 0.03, 0.75, [Math.PI / 2, 0, 0]);
        for (const z of [-0.1, -0.22, -0.34]) torus(tail, s.accent, [0, 0, z], 0.04, 0.008);
        tail.position.set(0, 0.42, -0.42);
        dg.add(tail);
        ball(dg, s.accent, [0, 0.45, -0.02], [0.1, 0.1, 0.12]);
        const h = { cx: 0, cy: 0.55, cz: 0.1, rx: 0.17, ry: 0.13, rz: 0.12 };
        ball(dg, s.body, [0, 0.55, 0.1], [0.17, 0.13, 0.12]);
        face(dg, h, { ey: 0.57, ex: 0.08, es: 0.055, mouth: 'smile' });
        for (const sx of [-1, 1]) {
          for (const [z, len] of [[0.0, 0.42], [-0.12, 0.38]]) {
            const pv = new THREE.Group();
            pv.position.set(sx * 0.05, 0.5, z);
            dg.add(pv);
            disc(pv, '#d6efff', [sx * len, 0, 0], [len, 0.08, 1], [-Math.PI / 2, 0, 0], { opacity: 0.75 });
            wings.push({ obj: pv, axis: 'z', amp: 0.35 * sx, speed: 28 });
          }
        }
        break;
      }
      case 'beetle':
      case 'stag': {
        const b = { cx: 0, cy: 0.25, cz: -0.08, rx: 0.36, ry: 0.25, rz: 0.42 };
        ball(body, s.body, [0, 0.25, -0.08], [0.36, 0.25, 0.42], { rough: 0.2, metal: 0.2 });
        add(body, new THREE.BoxGeometry(0.015, 0.02, 0.8), s.accent, [0, 0.5, -0.08]);
        ball(body, '#ffffff', [-0.14, 0.42, 0.05], [0.07, 0.03, 0.1], { opacity: 0.35 });
        legs(body, s.accent, 0.1, 0.25, -0.05);
        const h = { cx: 0, cy: 0.3, cz: 0.36, rx: 0.19, ry: 0.15, rz: 0.13 };
        ball(body, s.belly, [0, 0.3, 0.36], [0.19, 0.15, 0.13], { rough: 0.3 });
        if (s.draw === 'beetle') {
          tube(body, s.accent, [[0, 0.4, 0.4], [0.02, 0.6, 0.46], [0.08, 0.82, 0.4], [0.16, 0.9, 0.32]], 0.04);
          cone(body, s.accent, [0.16, 0.92, 0.31], 0.035, 0.08, [0, 0, -1]);
        } else {
          for (const sx of [-1, 1]) {
            tube(body, s.accent, [[sx * 0.08, 0.36, 0.46], [sx * 0.2, 0.5, 0.56], [sx * 0.16, 0.7, 0.58], [sx * 0.04, 0.78, 0.52]], 0.03);
          }
        }
        face(body, h, { ey: 0.33, ex: 0.08, es: 0.05, white: true, mouth: 'none', blush: false });
        break;
      }
      case 'bee': {
        flyer = true;
        const b = { cx: 0, cy: 0.45, cz: 0, rx: 0.42, ry: 0.4, rz: 0.4 };
        ball(body, s.body, [0, 0.45, 0], [0.42, 0.4, 0.4]);
        for (const y of [0.3, 0.17]) {
          const r = Math.sqrt(1 - ((y - 0.45) / 0.4) ** 2);
          add(body, new THREE.CylinderGeometry(0.42 * r + 0.004, 0.42 * Math.sqrt(1 - ((y - 0.06 - 0.45) / 0.4) ** 2) + 0.004, 0.06, 32, 1, true), s.accent, [0, y - 0.03, 0], [1, 1, 0.95], [0, 0, 0], { double: true });
        }
        antennae(body, s.accent, [0, 0.8, 0.1], 0.14, 0.18);
        for (const sx of [-1, 1]) {
          const pv = new THREE.Group();
          pv.position.set(sx * 0.12, 0.78, -0.15);
          body.add(pv);
          disc(pv, '#ffffff', [sx * 0.18, 0.12, 0], [0.18, 0.26, 1], [0.3, 0, sx * 0.6], { opacity: 0.7 });
          wings.push({ obj: pv, axis: 'y', amp: 0.6 * sx, speed: 30 });
        }
        face(body, b, { ey: 0.52, ex: 0.15, es: 0.075 });
        break;
      }
      case 'cicada': {
        const b = { cx: 0, cy: 0.38, cz: 0, rx: 0.25, ry: 0.36, rz: 0.24 };
        ball(body, s.body, [0, 0.38, 0], [0.25, 0.36, 0.24]);
        for (const sx of [-1, 1]) {
          const pv = new THREE.Group();
          pv.position.set(sx * 0.05, 0.68, -0.18);
          body.add(pv);
          disc(pv, '#e8f6ff', [sx * 0.2, -0.3, 0], [0.18, 0.42, 1], [0.35, 0, sx * 0.35], { opacity: 0.5 });
          wings.push({ obj: pv, axis: 'y', amp: 0.12 * sx, speed: 8 });
        }
        const h = { cx: 0, cy: 0.7, cz: 0.05, rx: 0.3, ry: 0.15, rz: 0.17 };
        ball(body, s.belly, [0, 0.7, 0.05], [0.3, 0.15, 0.17]);
        for (const sx of [-1, 1]) {
          ball(body, s.accent, [sx * 0.29, 0.72, 0.06], 0.085, { rough: 0.2 });
          ball(body, '#ffffff', [sx * 0.3, 0.76, 0.13], 0.025, { glow: 0.4 });
        }
        face(body, h, { ey: 0.72, ex: 0.08, es: 0.04, blush: false });
        break;
      }
      case 'ant': {
        ball(body, s.body, [0, 0.2, -0.3], [0.22, 0.17, 0.24]);
        ball(body, s.body, [0, 0.24, -0.05], 0.12);
        legs(body, s.accent, 0.12, 0.12, -0.1);
        const h = { cx: 0, cy: 0.5, cz: 0.12, rx: 0.3, ry: 0.28, rz: 0.26 };
        ball(body, s.belly, [0, 0.5, 0.12], [0.3, 0.28, 0.26]);
        for (const sx of [-1, 1]) {
          tube(body, s.accent, [[sx * 0.1, 0.74, 0.15], [sx * 0.2, 0.92, 0.18], [sx * 0.34, 0.96, 0.22]], 0.017);
          ball(body, s.accent, [sx * 0.34, 0.96, 0.22], 0.035);
        }
        face(body, h, { ey: 0.54, ex: 0.1, es: 0.07 });
        break;
      }
      default:
    }
  }

  // ---------- 동물 ----------
  function animal(s) {
    switch (s.draw) {
      case 'cat':
      case 'dog': {
        const isCat = s.draw === 'cat';
        ball(body, s.body, [0, 0.24, -0.05], [0.32, 0.24, 0.3]);
        for (const sx of [-1, 1]) ball(body, s.belly, [sx * 0.14, 0.05, 0.2], [0.09, 0.06, 0.11]);
        const h = { cx: 0, cy: 0.66, cz: 0.05, rx: 0.4, ry: 0.33, rz: 0.34 };
        ball(body, s.body, [0, 0.66, 0.05], [0.4, 0.33, 0.34]);
        if (isCat) {
          for (const sx of [-1, 1]) {
            cone(body, s.body, [sx * 0.26, 0.98, 0.02], 0.13, 0.26, [0, 0, -sx * 0.3]);
            cone(body, '#ffb3c1', [sx * 0.25, 0.97, 0.07], 0.07, 0.16, [0, 0, -sx * 0.3]);
          }
          for (const x of [-0.07, 0, 0.07]) {
            const st = new THREE.Mesh(SPH, mat(s.accent));
            st.scale.set(0.022, 0.06, 0.02);
            placeOn(h, st, x, 0.9, 0);
            body.add(st);
          }
          const t = new THREE.Group();
          tube(t, s.body, [[0, 0, 0], [0.18, 0.05, -0.05], [0.3, 0.25, -0.05], [0.26, 0.48, 0]], 0.06);
          t.position.set(0.22, 0.12, -0.25);
          body.add(t);
          tails.push({ obj: t, axis: 'z', amp: 0.25, speed: 2.5 });
        } else {
          for (const sx of [-1, 1]) {
            const e = ball(body, s.accent, [sx * 0.4, 0.68, 0.04], [0.11, 0.24, 0.08], {}, [0, 0, sx * 0.3]);
            tails.push({ obj: e, axis: 'z', amp: 0.06 * sx, speed: 3 });
          }
          ball(body, s.accent, [0.18, 0.78, 0.3], [0.1, 0.09, 0.05], { opacity: 0.6 });
          const t = new THREE.Group();
          tube(t, s.body, [[0, 0, 0], [0.05, 0.12, -0.08], [0.08, 0.26, -0.1]], 0.05);
          t.position.set(0, 0.3, -0.3);
          body.add(t);
          tails.push({ obj: t, axis: 'z', amp: 0.6, speed: 9 });
          torus(body, '#e8532b', [0, 0.4, 0.02], 0.27, 0.035, null, [Math.PI / 2, 0, 0]);
          ball(body, '#ffd23f', [0, 0.36, 0.3], 0.05, { metal: 0.5, rough: 0.3 });
        }
        const muzzle = new THREE.Mesh(SPH, mat(s.belly));
        muzzle.scale.set(0.15, 0.1, 0.08);
        placeOn(h, muzzle, 0, 0.56, -0.03);
        body.add(muzzle);
        const nose = new THREE.Mesh(SPH, mat(isCat ? '#ff8fa3' : '#2b2b33', { rough: 0.2 }));
        nose.scale.set(isCat ? 0.03 : 0.055, isCat ? 0.025 : 0.04, 0.03);
        placeOn(h, nose, 0, 0.6, 0.045);
        body.add(nose);
        face(body, h, { ey: 0.7, ex: 0.15, es: 0.075, mouth: isCat ? 'cat' : 'smile', my: 0.53 });
        break;
      }
      case 'sparrow':
      case 'magpie':
      case 'duck': {
        const b = { cx: 0, cy: 0.42, cz: 0, rx: 0.42, ry: 0.4, rz: 0.4 };
        ball(body, s.body, [0, 0.42, 0], [0.42, 0.4, 0.4]);
        ball(body, s.belly, [0, 0.3, 0.2], [0.3, 0.26, 0.24]);
        for (const sx of [-1, 1]) {
          const wg = ball(body, s.draw === 'duck' ? '#ffd23f' : s.accent, [sx * 0.4, 0.4, -0.02], [0.08, 0.2, 0.2], {}, [0, 0, sx * 0.25]);
          wings.push({ obj: wg, axis: 'z', amp: 0.15 * sx, speed: 6 });
          if (s.draw !== 'duck') cyl(body, '#f2a13b', [sx * 0.1, 0.03, 0.05], 0.015, 0.015, 0.08);
        }
        if (s.draw === 'sparrow') add(body, HEMI, s.accent, [0, 0.5, -0.01], [0.43, 0.34, 0.41]);
        if (s.draw === 'magpie') {
          const t = new THREE.Group();
          add(t, new THREE.BoxGeometry(0.12, 0.02, 0.5), s.accent, [0, 0, -0.25], 1, [0, 0, 0], { metal: 0.3, rough: 0.3 });
          t.position.set(0, 0.25, -0.3);
          t.rotation.x = 0.5;
          body.add(t);
          tails.push({ obj: t, axis: 'x', amp: 0.12, speed: 3 });
        } else if (s.draw === 'sparrow') {
          const t = new THREE.Group();
          add(t, new THREE.BoxGeometry(0.16, 0.02, 0.2), s.accent, [0, 0, -0.1]);
          t.position.set(0, 0.3, -0.36);
          t.rotation.x = 0.4;
          body.add(t);
          tails.push({ obj: t, axis: 'x', amp: 0.2, speed: 5 });
        } else {
          for (const [x, rz] of [[-0.03, 0.4], [0.03, -0.4], [0, 0]]) {
            ball(body, '#ffd23f', [x * 3, 0.87, 0], [0.025, 0.08, 0.025], {}, [0, 0, rz]);
          }
          for (const sx of [-1, 1]) ball(body, s.accent, [sx * 0.15, 0.03, 0.12], [0.11, 0.03, 0.14]);
        }
        const beak = s.draw === 'duck'
          ? ball(body, s.accent, [0, 0.4, 0.42], [0.13, 0.05, 0.1])
          : cone(body, s.draw === 'magpie' ? '#444444' : '#f2a13b', [0, 0.42, 0.44], 0.06, 0.14, [Math.PI / 2, 0, 0]);
        beak.userData.beak = true;
        face(body, b, { ey: 0.54, ex: 0.15, es: 0.07, white: s.draw === 'magpie', mouth: 'none' });
        break;
      }
      case 'rabbit': {
        ball(body, s.body, [0, 0.24, -0.05], [0.3, 0.24, 0.28]);
        ball(body, '#ffffff', [0, 0.2, -0.34], 0.09);
        const h = { cx: 0, cy: 0.62, cz: 0.04, rx: 0.34, ry: 0.3, rz: 0.3 };
        ball(body, s.body, [0, 0.62, 0.04], [0.34, 0.3, 0.3]);
        for (const sx of [-1, 1]) {
          const ear = new THREE.Group();
          ball(ear, s.body, [0, 0.25, 0], [0.08, 0.27, 0.06]);
          ball(ear, s.accent, [0, 0.26, 0.04], [0.04, 0.2, 0.03]);
          ear.position.set(sx * 0.13, 0.82, 0);
          ear.rotation.z = -sx * 0.18;
          body.add(ear);
          tails.push({ obj: ear, axis: 'z', amp: 0.06 * sx, speed: 2 });
        }
        const nose = new THREE.Mesh(SPH, mat('#ff8fa3'));
        nose.scale.set(0.035, 0.025, 0.03);
        placeOn(h, nose, 0, 0.58, 0.02);
        body.add(nose);
        face(body, h, { ey: 0.66, ex: 0.13, es: 0.07, my: 0.53 });
        break;
      }
      case 'hedgehog': {
        const b = { cx: 0, cy: 0.3, cz: 0, rx: 0.4, ry: 0.3, rz: 0.42 };
        ball(body, s.body, [0, 0.3, 0], [0.4, 0.3, 0.42]);
        const spikeGeo = new THREE.ConeGeometry(0.045, 0.2, 8);
        for (let i = 0; i < 70; i++) {
          const u = Math.random();
          const v = Math.random();
          const th = u * Math.PI * 2;
          const ph = Math.acos(1 - v);
          const n = V(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
          if (n.z > 0.45 && n.y < 0.7) continue;
          const sp2 = new THREE.Mesh(spikeGeo, mat(s.accent));
          sp2.position.set(n.x * 0.4, 0.3 + n.y * 0.3, n.z * 0.42);
          sp2.quaternion.setFromUnitVectors(V(0, 1, 0), n);
          sp2.position.addScaledVector(n, 0.06);
          body.add(sp2);
        }
        const f = { cx: 0, cy: 0.26, cz: 0.22, rx: 0.26, ry: 0.2, rz: 0.22 };
        ball(body, s.belly, [0, 0.26, 0.22], [0.26, 0.2, 0.22]);
        const nose = new THREE.Mesh(SPH, mat('#2b2b33', { rough: 0.2 }));
        nose.scale.set(0.045, 0.04, 0.04);
        placeOn(f, nose, 0, 0.22, 0.02);
        body.add(nose);
        face(body, f, { ey: 0.31, ex: 0.09, es: 0.055, my: 0.16 });
        break;
      }
      case 'frog': {
        const b = { cx: 0, cy: 0.33, cz: 0, rx: 0.5, ry: 0.32, rz: 0.4 };
        ball(body, s.body, [0, 0.33, 0], [0.5, 0.32, 0.4]);
        ball(body, s.belly, [0, 0.22, 0.2], [0.34, 0.18, 0.22]);
        for (const sx of [-1, 1]) {
          ball(body, s.accent, [sx * 0.34, 0.05, 0.18], [0.16, 0.04, 0.14]);
          ball(body, s.body, [sx * 0.24, 0.62, 0.1], 0.14);
          const g = new THREE.Group();
          ball(g, '#ffffff', [0, 0, 0], [0.1, 0.1, 0.06]);
          ball(g, '#2b2b33', [0, 0, 0.04], [0.05, 0.06, 0.03]);
          ball(g, '#ffffff', [0.015, 0.025, 0.065], 0.015, { glow: 0.4 });
          g.position.set(sx * 0.24, 0.64, 0.2);
          body.add(g);
          eyes.push(g);
        }
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 24, Math.PI), mat('#2b2b33'));
        placeOn(b, m, 0, 0.36, 0.005);
        m.rotateZ(Math.PI);
        body.add(m);
        for (const sx of [-1, 1]) {
          const bl = new THREE.Mesh(SPH, mat('#ff8fa3', { opacity: 0.6 }));
          bl.scale.set(0.08, 0.045, 0.01);
          placeOn(b, bl, sx * 0.33, 0.36, 0.004);
          body.add(bl);
        }
        break;
      }
      default:
    }
  }

  // ---------- 물고기 ----------
  function fish(s) {
    if (s.draw === 'turtle') {
      add(body, HEMI, s.body, [0, 0.12, 0], [0.48, 0.36, 0.5], [0, 0, 0], { rough: 0.45 });
      torus(body, s.accent, [0, 0.13, 0], 0.48, 0.04, null, [Math.PI / 2, 0, 0]);
      const b = { cx: 0, cy: 0.12, cz: 0, rx: 0.48, ry: 0.36, rz: 0.5 };
      for (const [x, y] of [[0, 0.44], [-0.22, 0.3], [0.22, 0.3], [-0.12, 0.2], [0.12, 0.2]]) {
        const pl = new THREE.Mesh(SPH, mat(s.accent));
        pl.scale.set(0.11, 0.09, 0.02);
        placeOn(b, pl, x, y, 0);
        body.add(pl);
      }
      for (const [x, z] of [[-0.36, 0.25], [0.36, 0.25], [-0.36, -0.25], [0.36, -0.25]]) {
        const l = ball(body, s.belly, [x, 0.08, z], [0.11, 0.06, 0.13]);
        tails.push({ obj: l, axis: 'x', amp: 0.3 * Math.sign(x * z), speed: 3 });
      }
      const h = { cx: 0, cy: 0.2, cz: 0.55, rx: 0.17, ry: 0.15, rz: 0.15 };
      ball(body, s.belly, [0, 0.2, 0.55], [0.17, 0.15, 0.15]);
      face(body, h, { ey: 0.23, ex: 0.07, es: 0.045 });
      return;
    }
    swimmer = true;
    const metal = s.draw === 'gold' ? { metal: 0.6, rough: 0.25 } : { rough: 0.4 };
    const fishG = new THREE.Group(); // +x가 머리
    ball(fishG, s.body, [0, 0, 0], [0.5, 0.32, 0.22], metal);
    ball(fishG, s.belly, [0.05, -0.12, 0], [0.36, 0.16, 0.19]);
    const fin = new THREE.Shape();
    fin.moveTo(-0.15, 0); fin.quadraticCurveTo(0, 0.22, 0.15, 0); fin.lineTo(-0.15, 0);
    add(fishG, new THREE.ShapeGeometry(fin), s.accent, [-0.02, 0.28, 0], 1, [0, 0, 0], { double: true });
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0); tailShape.lineTo(-0.3, 0.24); tailShape.quadraticCurveTo(-0.22, 0, -0.3, -0.24); tailShape.lineTo(0, 0);
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.46, 0, 0);
    add(tailPivot, new THREE.ShapeGeometry(tailShape), s.accent, [0, 0, 0], 1, [0, 0, 0], { double: true });
    fishG.add(tailPivot);
    tails.push({ obj: tailPivot, axis: 'y', amp: 0.5, speed: 6 });
    for (const sz of [-1, 1]) {
      const pf = ball(fishG, s.accent, [0.12, -0.12, sz * 0.18], [0.12, 0.04, 0.08], {}, [sz * 0.5, 0, 0]);
      tails.push({ obj: pf, axis: 'x', amp: 0.4 * sz, speed: 5 });
    }
    if (s.draw === 'koi') {
      const b = { cx: 0, cy: 0, cz: 0, rx: 0.5, ry: 0.32, rz: 0.22 };
      for (const [x, y, side] of [[0.05, 0.18, 1], [-0.2, 0.05, 1], [0.05, 0.18, -1], [0.22, 0.1, -1]]) {
        const pch = new THREE.Mesh(SPH, mat(s.accent));
        pch.scale.set(0.13, 0.08, 0.02);
        placeOn(b, pch, x, y, 0, side);
        fishG.add(pch);
      }
      for (const sz of [-1, 1]) tube(fishG, s.accent, [[0.46, -0.08, sz * 0.05], [0.55, -0.16, sz * 0.1], [0.6, -0.2, sz * 0.12]], 0.008);
    }
    // 양쪽 눈
    for (const sz of [-1, 1]) {
      const g = new THREE.Group();
      ball(g, '#2b2b33', [0, 0, 0], [0.06, 0.07, 0.03], { rough: 0.25 });
      ball(g, '#ffffff', [0.02, 0.025, sz * 0.025], 0.02, { glow: 0.4 });
      g.position.set(0.3, 0.06, sz * 0.18);
      fishG.add(g);
      eyes.push(g);
      ball(fishG, '#ff8fa3', [0.3, -0.06, sz * 0.19], [0.05, 0.03, 0.01], { opacity: 0.6 });
    }
    fishG.position.y = 0.4;
    fishG.rotation.y = -0.6; // 3/4 정도 카메라 쪽으로
    body.add(fishG);
  }

  if (sp.kind === 'insect') insect(sp);
  else if (sp.kind === 'animal') animal(sp);
  else if (sp.kind === 'fish') fish(sp);
  else monster(sp);

  root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  root.userData = { eyes, wings, tails, flyer, swimmer, height: 1 };
  return root;
}
