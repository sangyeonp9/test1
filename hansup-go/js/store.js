// 플레이어 기록 저장
// - 내 기록은 항상 이 휴대폰(localStorage)에 저장됩니다.
// - Firebase가 설정되어 있으면 친구 코드 그룹으로 기록을 공유합니다.
//   공유되는 정보: 닉네임, 레벨, 잡은 몬스터 수 (위치 정보는 공유하지 않습니다)

import { CONFIG, firebaseEnabled } from './config.js';
import { RARITY, speciesById } from './monsters.js';

const KEY = 'hansupgo.v1';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2';

function uid() {
  return 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function defaultState() {
  return {
    id: uid(),
    name: '',
    color: '#3f8fd2',
    group: '',
    balls: CONFIG.startBalls,
    snacks: CONFIG.startSnacks,
    xp: 0,
    caught: {},        // speciesId -> { count, firstAt, bestSize }
    caughtSpawns: {},  // spawnId -> timestamp (같은 몬스터를 두 번 잡지 않도록)
    stopCooldowns: {}, // stopId -> timestamp
    specialDay: '',
    log: [],           // 최근 잡은 기록
    demo: false,
  };
}

export const store = {
  state: defaultState(),
  listeners: new Set(),

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.state = { ...defaultState(), ...JSON.parse(raw) };
    } catch { /* 저장소를 못 쓰는 환경이면 새로 시작 */ }
    this.prune();
    return this.state;
  },

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* 무시 */ }
    this.listeners.forEach(fn => fn(this.state));
    remote.schedulePush(this.state);
  },

  onChange(fn) { this.listeners.add(fn); },

  prune() {
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    for (const [k, t] of Object.entries(this.state.caughtSpawns)) {
      if (t < dayAgo) delete this.state.caughtSpawns[k];
    }
  },

  level() { return levelFromXp(this.state.xp); },

  speciesCount() { return Object.keys(this.state.caught).length; },

  totalCaught() {
    return Object.values(this.state.caught).reduce((n, c) => n + c.count, 0);
  },

  /** 잡기 성공 기록. 획득한 경험치를 돌려준다. */
  recordCatch(spawn) {
    const sp = speciesById[spawn.speciesId];
    const prev = this.state.caught[sp.id];
    const isNew = !prev;
    const gained = RARITY[sp.rarity].xp + (isNew ? 500 : 0);
    this.state.caught[sp.id] = {
      count: (prev?.count || 0) + 1,
      firstAt: prev?.firstAt || Date.now(),
      bestSize: Math.max(prev?.bestSize || 0, spawn.sizeCm),
    };
    this.state.caughtSpawns[spawn.id] = Date.now();
    this.state.xp += gained;
    this.state.log = [{ speciesId: sp.id, at: Date.now(), sizeCm: spawn.sizeCm }, ...this.state.log].slice(0, 30);
    this.save();
    remote.postFeed(this.state, sp.id, isNew);
    return { gained, isNew };
  },

  markFled(spawn) {
    this.state.caughtSpawns[spawn.id] = Date.now();
    this.save();
  },
};

export function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 400)) + 1;
}

export function xpForLevel(level) {
  return (level - 1) ** 2 * 400;
}

// ---------- 친구 공유 (Firebase Firestore) ----------

export const remote = {
  ready: false,
  error: '',
  uid: null,
  fs: null,
  db: null,
  pushTimer: null,
  unsubs: [],
  players: [],
  feed: [],
  listeners: new Set(),

  async init() {
    if (!firebaseEnabled()) return false;
    try {
      const [{ initializeApp }, fs, auth] = await Promise.all([
        import(`${FB}/firebase-app.js`),
        import(`${FB}/firebase-firestore.js`),
        import(`${FB}/firebase-auth.js`),
      ]);
      const app = initializeApp(CONFIG.firebase);
      const a = auth.getAuth(app);
      const cred = await auth.signInAnonymously(a);
      this.uid = cred.user.uid;
      this.fs = fs;
      this.db = fs.getFirestore(app);
      this.ready = true;
      return true;
    } catch (e) {
      console.warn('친구 공유 연결 실패', e);
      this.error = '친구 공유 서버에 연결하지 못했습니다. 인터넷 연결과 Firebase 설정을 확인해 주세요.';
      return false;
    }
  },

  onChange(fn) { this.listeners.add(fn); },
  emit() { this.listeners.forEach(fn => fn(this)); },

  watchGroup(group) {
    this.unsubs.forEach(u => u());
    this.unsubs = [];
    this.players = [];
    this.feed = [];
    if (!this.ready || !group) { this.emit(); return; }
    const { collection, onSnapshot, query, orderBy, limit } = this.fs;
    const base = ['groups', group];
    this.unsubs.push(onSnapshot(collection(this.db, ...base, 'players'), (snap) => {
      this.players = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      this.emit();
    }, (e) => { this.error = '친구 기록을 불러오지 못했습니다.'; console.warn(e); this.emit(); }));
    this.unsubs.push(onSnapshot(
      query(collection(this.db, ...base, 'feed'), orderBy('at', 'desc'), limit(25)),
      (snap) => { this.feed = snap.docs.map(d => d.data()); this.emit(); },
      (e) => console.warn(e)));
  },

  schedulePush(state) {
    if (!this.ready || !state.group || !state.name) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.push(state), 800);
  },

  async push(state) {
    const { doc, setDoc, serverTimestamp } = this.fs;
    const caught = Object.fromEntries(Object.entries(state.caught).map(([k, v]) => [k, v.count]));
    try {
      await setDoc(doc(this.db, 'groups', state.group, 'players', this.uid), {
        name: state.name.slice(0, 12),
        color: state.color,
        xp: state.xp,
        level: levelFromXp(state.xp),
        species: Object.keys(caught).length,
        total: Object.values(caught).reduce((a, b) => a + b, 0),
        caught,
        updatedAt: serverTimestamp(),
      });
    } catch (e) { console.warn('기록 공유 실패', e); }
  },

  async postFeed(state, speciesId, isNew) {
    if (!this.ready || !state.group || !state.name) return;
    const { collection, addDoc } = this.fs;
    try {
      await addDoc(collection(this.db, 'groups', state.group, 'feed'), {
        uid: this.uid, name: state.name.slice(0, 12), color: state.color,
        speciesId, isNew, at: Date.now(),
      });
    } catch (e) { console.warn(e); }
  },
};
