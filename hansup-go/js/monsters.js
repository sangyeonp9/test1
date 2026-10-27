// 한숲GO 도감 데이터와 그림(SVG) 생성기
// 몬스터·곤충·동물·물고기 모두 이 게임을 위해 새로 만든 오리지널 캐릭터입니다.

export const RARITY = {
  common:    { label: '흔함', color: '#7a8b6f', weight: 60, catchRate: 0.72, flee: 0.05, xp: 100 },
  uncommon:  { label: '보통', color: '#3f8fd2', weight: 28, catchRate: 0.52, flee: 0.10, xp: 200 },
  rare:      { label: '희귀', color: '#a45ee5', weight: 10, catchRate: 0.36, flee: 0.15, xp: 500 },
  legendary: { label: '전설', color: '#e8a317', weight: 0,  catchRate: 0.22, flee: 0.20, xp: 2000 },
};

// 종류별 잡는 방법
export const KINDS = {
  monster: { label: '몬스터', method: 'ball',  how: '숲볼 던지기',          done: '잡았다',         feed: '잡았어요' },
  insect:  { label: '곤충',   method: 'net',   how: '잠자리채로 채집하기',   done: '채집했다',       feed: '채집했어요' },
  animal:  { label: '동물',   method: 'snack', how: '간식 주고 친구 되기',   done: '친구가 되었다',  feed: '친구가 되었어요' },
  fish:    { label: '물고기', method: 'fish',  how: '낚시하기',             done: '낚았다',         feed: '낚았어요' },
};

// habitat 태그
//   any 어디서나 · day 낮에만 · night 밤에만 · school 남곡초 주변 · park 공원에 많음
//   water 물빛공원 연못에서만 · legend 야생에는 안 나옴(특별 거점 전용)
export const SPECIES = [
  // ---------- 몬스터 ----------
  { id: 'sumbbong', no: 1, kind: 'monster', name: '숲뭉치', type: '풀', rarity: 'common', habitat: ['any'],
    desc: '한숲시티 화단 어디서나 볼 수 있다. 머리의 새싹을 쓰다듬으면 기분이 좋아진다.',
    shape: 'round', top: 'sprout', body: '#8fd16a', belly: '#d8f5c0', accent: '#4f9a3a', size: [18, 30] },
  { id: 'mulbangkong', no: 2, kind: 'monster', name: '물방울콩', type: '물', rarity: 'common', habitat: ['any'],
    desc: '비 온 뒤 놀이터 웅덩이에 모여 산다. 통통 튀며 걷는다.',
    shape: 'drop', top: 'none', body: '#7cc7f2', belly: '#d9f1ff', accent: '#3a8fc9', size: [15, 25] },
  { id: 'gureumsom', no: 3, kind: 'monster', name: '구름솜', type: '바람', rarity: 'common', habitat: ['day'],
    desc: '맑은 날 아파트 옥상 위를 둥실둥실 떠다닌다. 만지면 솜사탕처럼 폭신하다.',
    shape: 'cloud', top: 'none', body: '#f4f6ff', belly: '#ffffff', accent: '#a9b4e8', size: [25, 40] },
  { id: 'dotoriram', no: 4, kind: 'monster', name: '도토리람', type: '풀', rarity: 'common', habitat: ['park'],
    desc: '볼에 도토리를 가득 넣고 다니는 다람쥐 몬스터. 산내음공원 나무 위를 좋아한다.',
    shape: 'pear', top: 'acorn', tail: 'squirrel', body: '#c98a4b', belly: '#f3dcbc', accent: '#8a5428', size: [20, 32] },
  { id: 'bulssikkomi', no: 5, kind: 'monster', name: '불씨꼬미', type: '불', rarity: 'uncommon', habitat: ['any'],
    desc: '머리 위 작은 불꽃이 기분에 따라 커졌다 작아졌다 한다. 겨울에 인기가 많다.',
    shape: 'round', top: 'flame', body: '#ff9a62', belly: '#ffe0c7', accent: '#e8532b', size: [20, 30] },
  { id: 'agoknoguri', no: 6, kind: 'monster', name: '아곡너구리', type: '땅', rarity: 'uncommon', habitat: ['any'],
    desc: '아곡리 들판에서 내려온 장난꾸러기. 눈가의 무늬가 마스크처럼 보인다.',
    shape: 'pear', top: 'bear', mask: true, tail: 'stripe', body: '#9c8f86', belly: '#eee4da', accent: '#4c433e', size: [28, 42] },
  { id: 'banjjakbandi', no: 7, kind: 'monster', name: '반짝반디', type: '빛', rarity: 'uncommon', habitat: ['night'],
    desc: '밤이 되면 단지 산책로를 따라 노란 불빛을 깜빡인다. 밤에만 만날 수 있다.',
    shape: 'tall', top: 'antenna', glow: true, body: '#3c4a7a', belly: '#ffe46b', accent: '#ffd23f', size: [8, 14] },
  { id: 'dalbittokki', no: 8, kind: 'monster', name: '달빛토끼', type: '요정', rarity: 'rare', habitat: ['night'],
    desc: '보름달이 뜨는 밤에 자주 보인다. 귀 끝이 달빛처럼 은은하게 빛난다.',
    shape: 'round', top: 'bunny', body: '#e9e4ff', belly: '#ffffff', accent: '#9d8cf0', size: [22, 34] },
  { id: 'chaekbeolmung', no: 9, kind: 'monster', name: '책벌레뭉', type: '에스퍼', rarity: 'uncommon', habitat: ['school'],
    desc: '남곡초 도서관에 사는 몬스터. 동그란 안경을 쓰고 동화책 읽기를 좋아한다.',
    shape: 'tall', top: 'antenna2', glasses: true, body: '#9bd59a', belly: '#e6f7e2', accent: '#3e7d4c', size: [12, 20] },
  { id: 'jongsorinyang', no: 10, kind: 'monster', name: '종소리냥', type: '노말', rarity: 'rare', habitat: ['school'],
    desc: '수업 종이 울리면 어디선가 나타나는 고양이. 목에 단 방울 소리가 맑다.',
    shape: 'round', top: 'cat', bell: true, body: '#ffd27a', belly: '#fff3d6', accent: '#d98f1c', size: [24, 34] },
  { id: 'kkotbyeori', no: 11, kind: 'monster', name: '꽃별이', type: '요정', rarity: 'rare', habitat: ['day', 'park'],
    desc: '봄이면 한숲시티 벚꽃길과 햇빛공원에 나타난다. 지나간 자리에 꽃잎이 흩날린다.',
    shape: 'drop', top: 'flower', body: '#ffb7cf', belly: '#ffe8f0', accent: '#e86f9b', size: [14, 22] },
  { id: 'hansupwang', no: 12, kind: 'monster', name: '한숲왕', type: '전설', rarity: 'legendary', habitat: ['legend'],
    desc: '한숲시티를 지키는 숲의 왕. 남곡초등학교 특별 거점에서 아주 드물게 모습을 드러낸다.',
    shape: 'pear', top: 'crown', cape: true, body: '#4fb08a', belly: '#d7f3e6', accent: '#e8a317', size: [60, 80] },
  { id: 'beoseokkongi', no: 13, kind: 'monster', name: '버섯콩이', type: '풀', rarity: 'uncommon', habitat: ['park'],
    desc: '비 온 다음 날 공원 그늘에 퐁 하고 솟아난다. 모자의 점무늬는 하나하나 모양이 다르다.',
    shape: 'round', top: 'mushroom', body: '#f3e3c8', belly: '#fff6e6', accent: '#d9433a', size: [10, 18] },
  { id: 'byeolttongi', no: 14, kind: 'monster', name: '별똥이', type: '요정', rarity: 'rare', habitat: ['night'],
    desc: '별똥별이 떨어진 밤에 나타나는 몬스터. 소원을 들어준다는 소문이 있다.',
    shape: 'drop', top: 'star', glow: true, body: '#6b6fd8', belly: '#c9cbff', accent: '#ffd23f', size: [12, 20] },
  { id: 'ppulppuri', no: 15, kind: 'monster', name: '뿔뿔이', type: '땅', rarity: 'uncommon', habitat: ['any'],
    desc: '이마의 작은 뿔로 흙을 파서 보물을 찾는다. 놀이터 모래밭에서 자주 보인다.',
    shape: 'pear', top: 'horn', body: '#8fc9b8', belly: '#e3f6ef', accent: '#3f8f78', size: [22, 34] },
  { id: 'eoreumbangul', no: 16, kind: 'monster', name: '얼음방울', type: '얼음', rarity: 'uncommon', habitat: ['any'],
    desc: '몸이 늘 시원해서 여름에 안고 있으면 기분이 좋다. 화나면 입김으로 눈꽃을 만든다.',
    shape: 'drop', top: 'snow', body: '#bfe6ff', belly: '#f0faff', accent: '#5aa7d6', size: [14, 24] },

  // ---------- 곤충 ----------
  { id: 'mudangbyeori', no: 17, kind: 'insect', name: '무당별이', type: '딱정벌레', rarity: 'common', habitat: ['park'],
    desc: '빨간 등에 까만 점이 일곱 개. 화단의 진딧물을 먹어 주는 고마운 친구다.',
    draw: 'ladybug', body: '#e8433a', belly: '#2f2f3a', accent: '#2b2b33', size: [0.6, 1] },
  { id: 'noranapuri', no: 18, kind: 'insect', name: '노랑나풀이', type: '나비', rarity: 'common', habitat: ['day', 'park'],
    desc: '햇빛공원 꽃밭을 팔랑팔랑 날아다닌다. 날개의 무늬가 웃는 얼굴처럼 보인다.',
    draw: 'butterfly', body: '#ffd23f', belly: '#fff3c4', accent: '#e8892b', size: [4, 7] },
  { id: 'gochujamdori', no: 19, kind: 'insect', name: '고추잠돌이', type: '잠자리', rarity: 'uncommon', habitat: ['day', 'park'],
    desc: '가을 하늘 아래 빙글빙글 맴도는 빨간 잠자리. 손가락을 돌리면 어지러워한다.',
    draw: 'dragonfly', body: '#e8532b', belly: '#ffd6c4', accent: '#b5381c', size: [4, 6] },
  { id: 'janggubbul', no: 20, kind: 'insect', name: '장수뿔돌이', type: '딱정벌레', rarity: 'rare', habitat: ['night', 'park'],
    desc: '여름밤 산내음공원 참나무에 나타나는 힘센 곤충. 뿔로 나뭇가지를 들어 올린다.',
    draw: 'beetle', body: '#6b3f22', belly: '#a0673f', accent: '#3d2414', size: [4, 8] },
  { id: 'jipgewang', no: 21, kind: 'insect', name: '집게왕', type: '딱정벌레', rarity: 'rare', habitat: ['night', 'park'],
    desc: '커다란 집게를 가진 사슴벌레. 무섭게 생겼지만 사실 수줍음이 많다.',
    draw: 'stag', body: '#4a2d1c', belly: '#7a4e32', accent: '#2a1a10', size: [3, 7] },
  { id: 'ggulbeori', no: 22, kind: 'insect', name: '꿀벌이', type: '벌', rarity: 'common', habitat: ['day'],
    desc: '꽃가루를 잔뜩 묻히고 윙윙 날아다닌다. 먼저 건드리지 않으면 쏘지 않는다.',
    draw: 'bee', body: '#ffd23f', belly: '#fff3c4', accent: '#2b2b33', size: [1, 1.6] },
  { id: 'maemmaemi', no: 23, kind: 'insect', name: '맴맴이', type: '매미', rarity: 'uncommon', habitat: ['day'],
    desc: '여름 아침마다 단지 나무에서 맴맴 노래한다. 노래 대회에 나가는 게 꿈이다.',
    draw: 'cicada', body: '#7a9a5a', belly: '#c8dcae', accent: '#4a5e36', size: [3, 5] },
  { id: 'gaemidaejang', no: 24, kind: 'insect', name: '개미대장', type: '개미', rarity: 'common', habitat: ['any'],
    desc: '놀이터 땅속 개미 마을의 대장. 과자 부스러기를 발견하면 친구들을 부른다.',
    draw: 'ant', body: '#8a3b2a', belly: '#b85a44', accent: '#5a2418', size: [0.5, 1.2] },

  // ---------- 동물 ----------
  { id: 'chijeunyang', no: 25, kind: 'animal', name: '치즈냥', type: '고양이', rarity: 'common', habitat: ['any'],
    desc: '단지 화단에서 낮잠 자는 노란 고양이. 간식을 주면 꼬리를 세우고 다가온다.',
    draw: 'cat', body: '#ffb45c', belly: '#fff1dc', accent: '#e0882b', size: [30, 45] },
  { id: 'sanchaekmeong', no: 26, kind: 'animal', name: '산책멍멍이', type: '강아지', rarity: 'common', habitat: ['day'],
    desc: '아침저녁으로 산책로를 달리는 강아지. 공을 던져 주면 끝까지 쫓아간다.',
    draw: 'dog', body: '#f3d9b1', belly: '#fff8ee', accent: '#a8754a', size: [25, 50] },
  { id: 'jjaekchamsae', no: 27, kind: 'animal', name: '짹짹참새', type: '새', rarity: 'common', habitat: ['day'],
    desc: '전깃줄에 줄지어 앉아 수다를 떤다. 빵 부스러기를 아주 좋아한다.',
    draw: 'sparrow', body: '#b07a4f', belly: '#f6e7d0', accent: '#6b4428', size: [12, 16] },
  { id: 'kkachikkak', no: 28, kind: 'animal', name: '까치깍', type: '새', rarity: 'uncommon', habitat: ['any'],
    desc: '반가운 소식을 전해 준다는 까치. 반짝이는 물건을 모으는 취미가 있다.',
    draw: 'magpie', body: '#2b2b33', belly: '#ffffff', accent: '#3f6fd2', size: [40, 50] },
  { id: 'kkwakkwagi', no: 29, kind: 'animal', name: '꽥꽥이', type: '오리', rarity: 'uncommon', habitat: ['water'],
    desc: '물빛공원 연못을 줄지어 헤엄치는 아기 오리. 엄마 오리를 졸졸 따라다닌다.',
    draw: 'duck', body: '#ffe066', belly: '#fff6c4', accent: '#ff9f43', size: [12, 20] },
  { id: 'kkangchongtokki', no: 30, kind: 'animal', name: '깡총토끼', type: '토끼', rarity: 'uncommon', habitat: ['park'],
    desc: '공원 풀밭에서 깡총깡총 뛰어노는 토끼. 당근보다 클로버를 더 좋아한다.',
    draw: 'rabbit', body: '#f4f1ee', belly: '#ffffff', accent: '#ffb3c1', size: [25, 40] },
  { id: 'goseumbbung', no: 31, kind: 'animal', name: '고슴뭉', type: '고슴도치', rarity: 'rare', habitat: ['night', 'park'],
    desc: '밤에만 나와 공원 낙엽 사이를 뒤적인다. 놀라면 밤송이처럼 동그랗게 몸을 만다.',
    draw: 'hedgehog', body: '#8a6a4f', belly: '#f6e2c6', accent: '#5a4330', size: [15, 25] },
  { id: 'gaeguldori', no: 32, kind: 'animal', name: '개굴돌이', type: '개구리', rarity: 'common', habitat: ['water'],
    desc: '비 오는 날 연못가에서 개굴개굴 합창한다. 뒷다리로 엄청 멀리 뛴다.',
    draw: 'frog', body: '#7cc95a', belly: '#d7f3c4', accent: '#3f8a2e', size: [5, 10] },

  // ---------- 물고기 ----------
  { id: 'mulbitbungeo', no: 33, kind: 'fish', name: '물빛붕어', type: '붕어', rarity: 'common', habitat: ['water'],
    desc: '한숲물빛공원 연못에서 가장 흔한 물고기. 빵가루를 던지면 우르르 몰려온다.',
    draw: 'fish', body: '#9fb7c9', belly: '#e6eef4', accent: '#5f7f97', size: [10, 25] },
  { id: 'bidaningeo', no: 34, kind: 'fish', name: '비단잉어', type: '잉어', rarity: 'uncommon', habitat: ['water'],
    desc: '하얀 몸에 주황 무늬가 비단처럼 고운 잉어. 연못의 인기 스타다.',
    draw: 'koi', body: '#fdfaf5', belly: '#ffffff', accent: '#f07a2b', size: [30, 60] },
  { id: 'eonggeumgeobuk', no: 35, kind: 'fish', name: '엉금거북', type: '거북', rarity: 'rare', habitat: ['water'],
    desc: '연못 바위 위에서 햇볕을 쬐는 느긋한 거북. 사실 헤엄은 엄청 빠르다.',
    draw: 'turtle', body: '#6fae5a', belly: '#d9ecb8', accent: '#3f7a32', size: [15, 30] },
  { id: 'hwanggeumingeo', no: 36, kind: 'fish', name: '황금잉어', type: '잉어', rarity: 'rare', habitat: ['water'],
    desc: '연못 깊은 곳에 산다는 전설의 금빛 잉어. 낚으면 좋은 일이 생긴다고 한다.',
    draw: 'gold', body: '#f5c542', belly: '#fff2c2', accent: '#d9930f', size: [40, 70] },
];

export const speciesById = Object.fromEntries(SPECIES.map(s => [s.id, s]));

// ---------- 공통 얼굴 부품 ----------

function eyes(x1, x2, y, k = 1) {
  const e = (x) => `<ellipse cx="${x}" cy="${y}" rx="${5.5 * k}" ry="${7 * k}" fill="#2b2b33"/>
    <circle cx="${x + 1.8 * k}" cy="${y - 2.6 * k}" r="${2.2 * k}" fill="#fff"/>
    <circle cx="${x - 1.5 * k}" cy="${y + 2.5 * k}" r="${1 * k}" fill="#fff"/>`;
  return e(x1) + e(x2);
}
function blush(x1, x2, y, k = 1) {
  return `<ellipse cx="${x1}" cy="${y}" rx="${6 * k}" ry="${3.5 * k}" fill="#ff8fa3" opacity=".55"/>
          <ellipse cx="${x2}" cy="${y}" rx="${6 * k}" ry="${3.5 * k}" fill="#ff8fa3" opacity=".55"/>`;
}
function smile(cx, cy, w = 5, color = '#2b2b33') {
  return `<path d="M${cx - w} ${cy} Q${cx} ${cy + w} ${cx + w} ${cy}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}
function catMouth(cx, cy) {
  return `<path d="M${cx - 6} ${cy} Q${cx - 3} ${cy + 4} ${cx} ${cy} Q${cx + 3} ${cy + 4} ${cx + 6} ${cy}" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}
function legs6(color, cy = 78) {
  return `<g stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M32 ${cy - 14} l-11 -7 M29 ${cy} l-13 0 M32 ${cy + 14} l-11 8 M88 ${cy - 14} l11 -7 M91 ${cy} l13 0 M88 ${cy + 14} l11 8"/></g>`;
}
function antennae(color, y = 34, spread = 20) {
  return `<path d="M54 ${y} Q${60 - spread * 0.7} ${y - 14} ${60 - spread} ${y - 16} M66 ${y} Q${60 + spread * 0.7} ${y - 14} ${60 + spread} ${y - 16}"
    stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="${60 - spread}" cy="${y - 16}" r="3.5" fill="${color}"/><circle cx="${60 + spread}" cy="${y - 16}" r="3.5" fill="${color}"/>`;
}
function whiteEyes(x1, x2, y, r = 6) {
  const e = (x) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 0.8}" cy="${y + 0.8}" r="${r * 0.55}" fill="#2b2b33"/>
    <circle cx="${x + 2}" cy="${y - 1.4}" r="${r * 0.22}" fill="#fff"/>`;
  return e(x1) + e(x2);
}

// ---------- 몬스터 ----------

const BODY = {
  round: (s) => `<ellipse cx="60" cy="72" rx="38" ry="33" fill="${s.body}"/>`,
  tall: (s) => `<rect x="31" y="34" width="58" height="72" rx="29" fill="${s.body}"/>`,
  drop: (s) => `<path d="M60 22 C78 46 98 60 98 78 A38 30 0 0 1 22 78 C22 60 42 46 60 22Z" fill="${s.body}"/>`,
  pear: (s) => `<path d="M60 32 C82 32 88 52 92 72 C97 98 80 106 60 106 C40 106 23 98 28 72 C32 52 38 32 60 32Z" fill="${s.body}"/>`,
  cloud: (s) => `<g fill="${s.body}" stroke="${s.accent}" stroke-width="2"><circle cx="38" cy="74" r="20"/><circle cx="60" cy="62" r="26"/><circle cx="83" cy="74" r="20"/><rect x="34" y="70" width="52" height="28" rx="14"/></g><g fill="${s.body}"><circle cx="38" cy="74" r="18"/><circle cx="60" cy="62" r="24"/><circle cx="83" cy="74" r="18"/><rect x="36" y="72" width="48" height="24" rx="12"/></g>`,
};

const BELLY = {
  round: (s) => `<ellipse cx="60" cy="86" rx="22" ry="16" fill="${s.belly}"/>`,
  tall: (s) => `<ellipse cx="60" cy="88" rx="18" ry="15" fill="${s.belly}"/>`,
  drop: (s) => `<ellipse cx="60" cy="88" rx="20" ry="12" fill="${s.belly}"/>`,
  pear: (s) => `<ellipse cx="60" cy="88" rx="22" ry="16" fill="${s.belly}"/>`,
  cloud: () => '',
};

function topBack(s) {
  switch (s.top) {
    case 'cat':
      return `<path d="M32 58 L30 22 L56 44Z" fill="${s.body}"/><path d="M88 58 L90 22 L64 44Z" fill="${s.body}"/>
              <path d="M36 50 L35 31 L49 43Z" fill="#ffb3c1"/><path d="M84 50 L85 31 L71 43Z" fill="#ffb3c1"/>`;
    case 'bunny':
      return `<ellipse cx="44" cy="26" rx="9" ry="26" transform="rotate(-12 44 26)" fill="${s.body}"/>
              <ellipse cx="76" cy="26" rx="9" ry="26" transform="rotate(12 76 26)" fill="${s.body}"/>
              <ellipse cx="44" cy="22" rx="4.5" ry="18" transform="rotate(-12 44 22)" fill="${s.accent}" opacity=".55"/>
              <ellipse cx="76" cy="22" rx="4.5" ry="18" transform="rotate(12 76 22)" fill="${s.accent}" opacity=".55"/>`;
    case 'bear':
      return `<circle cx="38" cy="40" r="11" fill="${s.accent}"/><circle cx="82" cy="40" r="11" fill="${s.accent}"/>
              <circle cx="38" cy="40" r="5" fill="${s.belly}"/><circle cx="82" cy="40" r="5" fill="${s.belly}"/>`;
    case 'star':
      return `<path d="M60 40 Q60 26 66 18" stroke="${s.body}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function starPath(cx, cy, r1, r2) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

function topFront(s) {
  switch (s.top) {
    case 'sprout':
      return `<path d="M60 42 Q60 30 60 24" stroke="${s.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M60 28 C50 16 38 22 40 28 C46 32 54 32 60 28Z" fill="${s.accent}"/>
              <path d="M60 26 C70 12 84 18 82 25 C76 30 66 30 60 26Z" fill="#6cc04a"/>`;
    case 'acorn':
      return `<ellipse cx="60" cy="30" rx="10" ry="11" fill="#b5763a"/>
              <path d="M48 28 Q60 14 72 28 Q60 24 48 28Z" fill="#6e4523"/><rect x="58.5" y="15" width="3" height="6" rx="1.5" fill="#6e4523"/>`;
    case 'flame':
      return `<path d="M60 14 C70 26 74 32 70 42 C68 48 52 48 50 42 C46 32 52 30 56 22 C57 28 60 30 60 14Z" fill="#ffcf3f"/>
              <path d="M60 26 C65 33 66 38 63 43 C61 46 57 46 56 43 C54 38 57 34 60 26Z" fill="${s.accent}"/>`;
    case 'antenna':
      return `<path d="M50 38 Q44 22 38 18" stroke="${s.body}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M70 38 Q76 22 82 18" stroke="${s.body}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="38" cy="17" r="5" fill="${s.accent}"/><circle cx="82" cy="17" r="5" fill="${s.accent}"/>`;
    case 'antenna2':
      return `<path d="M60 36 Q60 24 66 18" stroke="${s.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="67" cy="17" r="4.5" fill="#ffd23f"/>`;
    case 'flower':
      return `<g transform="translate(60 30)">${[0, 72, 144, 216, 288].map(r =>
                `<ellipse cx="0" cy="-8" rx="6" ry="8" transform="rotate(${r})" fill="#fff"/>`).join('')}
              <circle r="5" fill="#ffd23f"/></g>`;
    case 'crown':
      return `<path d="M42 38 L44 18 L52 28 L60 14 L68 28 L76 18 L78 38Z" fill="${s.accent}" stroke="#b77c08" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="60" cy="30" r="3.5" fill="#e8532b"/><circle cx="48" cy="33" r="2.5" fill="#3f8fd2"/><circle cx="72" cy="33" r="2.5" fill="#3f8fd2"/>`;
    case 'mushroom':
      return `<path d="M20 56 C20 22 100 22 100 56 C86 50 34 50 20 56Z" fill="${s.accent}"/>
              <circle cx="40" cy="40" r="6" fill="#fff"/><circle cx="62" cy="32" r="7" fill="#fff"/><circle cx="82" cy="44" r="5" fill="#fff"/>`;
    case 'star':
      return `<path d="${starPath(67, 15, 10, 4.5)}" fill="${s.accent}" stroke="#d99a08" stroke-width="1.5" stroke-linejoin="round"/>`;
    case 'horn':
      return `<path d="M54 40 L60 12 L66 40Z" fill="#fff3c4" stroke="${s.accent}" stroke-width="2" stroke-linejoin="round"/>
              <path d="M56.5 30 h7 M57.5 22 h5" stroke="${s.accent}" stroke-width="1.5"/>`;
    case 'snow':
      return `<g stroke="${s.accent}" stroke-width="3" stroke-linecap="round" transform="translate(60 22)">
                ${[0, 60, 120].map(r => `<path d="M0 -11 V11 M-4 -7 L0 -11 L4 -7 M-4 7 L0 11 L4 7" transform="rotate(${r})"/>`).join('')}
              </g><circle cx="60" cy="22" r="3" fill="#fff"/>`;
    default:
      return '';
  }
}

function tail(s) {
  if (s.tail === 'squirrel') {
    return `<path d="M86 96 C112 94 116 64 104 50 C96 40 84 46 90 56 C100 66 94 82 82 86Z" fill="${s.accent}"/>
            <path d="M90 90 C106 86 108 66 100 56" stroke="${s.belly}" stroke-width="3" fill="none" opacity=".6"/>`;
  }
  if (s.tail === 'stripe') {
    return `<path d="M84 96 Q110 96 108 70" stroke="${s.body}" stroke-width="14" fill="none" stroke-linecap="round"/>
            <path d="M100 92 l8 -4 M104 84 l8 -2 M106 76 l7 0" stroke="${s.accent}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (s.cape) {
    return `<path d="M30 60 C20 80 18 100 26 110 L94 110 C102 100 100 80 90 60Z" fill="#c0392b" opacity=".9"/>`;
  }
  return '';
}

function monsterFace(s) {
  let out = '';
  if (s.mask) {
    out += `<path d="M30 64 Q46 52 60 62 Q74 52 90 64 Q84 76 72 72 Q60 66 48 72 Q36 76 30 64Z" fill="${s.accent}" opacity=".85"/>`;
  }
  out += eyes(47, 73, 66);
  if (s.glasses) {
    out += `<g fill="none" stroke="#5b4636" stroke-width="2.5"><circle cx="47" cy="66" r="10"/><circle cx="73" cy="66" r="10"/><path d="M57 66 h6"/></g>`;
  }
  out += blush(37, 83, 78);
  out += s.top === 'cat' ? catMouth(60, 76) : smile(60, 77);
  if (s.bell) {
    out += `<path d="M42 92 Q60 100 78 92" stroke="#e8532b" stroke-width="4" fill="none"/>
            <circle cx="60" cy="99" r="6" fill="#ffd23f" stroke="#b77c08" stroke-width="1.5"/><path d="M57 100 h6" stroke="#b77c08" stroke-width="1.5"/>`;
  }
  return out;
}

function drawMonster(s, silhouette) {
  const glow = s.glow && !silhouette ? `<circle cx="60" cy="96" r="30" fill="${s.accent}" opacity=".25"/>` : '';
  const feet = s.shape === 'cloud' ? ''
    : `<ellipse cx="45" cy="105" rx="9" ry="5" fill="${s.accent}"/><ellipse cx="75" cy="105" rx="9" ry="5" fill="${s.accent}"/>`;
  return `${glow}${tail(s)}${topBack(s)}${BODY[s.shape](s)}${BELLY[s.shape](s)}${feet}${topFront(s)}${monsterFace(s)}`;
}

// ---------- 곤충 ----------

const INSECT = {
  ladybug: (s) => `${legs6(s.accent)}${antennae(s.accent, 38, 18)}
    <ellipse cx="60" cy="80" rx="34" ry="28" fill="${s.body}"/>
    <path d="M60 54 V107" stroke="${s.accent}" stroke-width="2.5"/>
    <g fill="${s.accent}"><circle cx="44" cy="72" r="6"/><circle cx="76" cy="72" r="6"/><circle cx="40" cy="92" r="5"/><circle cx="80" cy="92" r="5"/><circle cx="50" cy="100" r="3.5"/><circle cx="70" cy="100" r="3.5"/></g>
    <ellipse cx="46" cy="66" rx="7" ry="4" fill="#fff" opacity=".35"/>
    <ellipse cx="60" cy="50" rx="21" ry="16" fill="${s.belly}"/>
    ${whiteEyes(52, 68, 48, 5.5)}${blush(44, 76, 56, 0.6)}${smile(60, 54, 4, '#fff')}`,

  butterfly: (s) => `
    <ellipse cx="34" cy="50" rx="25" ry="20" transform="rotate(-25 34 50)" fill="${s.body}" stroke="${s.accent}" stroke-width="3"/>
    <ellipse cx="86" cy="50" rx="25" ry="20" transform="rotate(25 86 50)" fill="${s.body}" stroke="${s.accent}" stroke-width="3"/>
    <ellipse cx="40" cy="82" rx="16" ry="14" transform="rotate(25 40 82)" fill="${s.body}" stroke="${s.accent}" stroke-width="3"/>
    <ellipse cx="80" cy="82" rx="16" ry="14" transform="rotate(-25 80 82)" fill="${s.body}" stroke="${s.accent}" stroke-width="3"/>
    <circle cx="30" cy="48" r="7" fill="${s.belly}"/><circle cx="90" cy="48" r="7" fill="${s.belly}"/>
    <circle cx="40" cy="84" r="4" fill="${s.accent}"/><circle cx="80" cy="84" r="4" fill="${s.accent}"/>
    <rect x="54" y="48" width="12" height="50" rx="6" fill="#5b4636"/>
    <path d="M55 30 Q48 14 40 15 M65 30 Q72 14 80 15" stroke="#5b4636" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="15" r="3" fill="#5b4636"/><circle cx="80" cy="15" r="3" fill="#5b4636"/>
    <circle cx="60" cy="40" r="15" fill="#ffe9c2"/>
    ${eyes(54, 66, 39, 0.6)}${blush(50, 70, 45, 0.45)}${smile(60, 44, 3)}`,

  dragonfly: (s) => `
    <g fill="#e8f6ff" stroke="#9cc9e8" stroke-width="1.5" opacity=".9">
      <ellipse cx="32" cy="50" rx="28" ry="7" transform="rotate(-12 32 50)"/><ellipse cx="88" cy="50" rx="28" ry="7" transform="rotate(12 88 50)"/>
      <ellipse cx="34" cy="62" rx="26" ry="6" transform="rotate(12 34 62)"/><ellipse cx="86" cy="62" rx="26" ry="6" transform="rotate(-12 86 62)"/>
    </g>
    <rect x="55" y="60" width="10" height="48" rx="5" fill="${s.body}"/>
    <path d="M55 72 h10 M55 82 h10 M55 92 h10" stroke="${s.accent}" stroke-width="2"/>
    <ellipse cx="60" cy="58" rx="11" ry="11" fill="${s.accent}"/>
    <ellipse cx="60" cy="38" rx="20" ry="15" fill="${s.body}"/>
    ${eyes(50, 70, 36, 1.05)}${blush(44, 76, 46, 0.55)}${smile(60, 45, 3.5)}`,

  beetle: (s) => `${legs6(s.accent, 82)}
    <ellipse cx="60" cy="82" rx="32" ry="27" fill="${s.body}"/>
    <path d="M60 58 V108" stroke="${s.accent}" stroke-width="2.5"/>
    <ellipse cx="47" cy="72" rx="8" ry="5" fill="#fff" opacity=".25"/>
    <path d="M58 48 C57 32 60 18 72 8 C71 20 69 32 66 48Z" fill="${s.accent}"/>
    <path d="M70 18 l7 -3" stroke="${s.accent}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="60" cy="54" rx="19" ry="13" fill="${s.belly}"/>
    ${whiteEyes(52, 68, 54, 5)}${smile(60, 60, 3.5, '#fff')}`,

  stag: (s) => `${legs6(s.accent, 82)}
    <ellipse cx="60" cy="82" rx="30" ry="27" fill="${s.body}"/>
    <path d="M60 58 V108" stroke="${s.accent}" stroke-width="2.5"/>
    <ellipse cx="48" cy="72" rx="7" ry="5" fill="#fff" opacity=".22"/>
    <path d="M50 46 C36 36 32 22 40 12 C42 22 46 30 55 40Z M70 46 C84 36 88 22 80 12 C78 22 74 30 65 40Z" fill="${s.accent}"/>
    <path d="M41 24 l-6 2 M79 24 l6 2" stroke="${s.accent}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="60" cy="52" rx="20" ry="13" fill="${s.belly}"/>
    ${whiteEyes(52, 68, 52, 5)}${smile(60, 58, 3.5, '#fff')}`,

  bee: (s) => `
    <ellipse cx="40" cy="40" rx="14" ry="20" transform="rotate(-30 40 40)" fill="#fff" stroke="#bcd8ea" stroke-width="2" opacity=".9"/>
    <ellipse cx="80" cy="40" rx="14" ry="20" transform="rotate(30 80 40)" fill="#fff" stroke="#bcd8ea" stroke-width="2" opacity=".9"/>
    ${antennae(s.accent, 44, 16)}
    <clipPath id="clip-bee"><ellipse cx="60" cy="74" rx="34" ry="31"/></clipPath>
    <ellipse cx="60" cy="74" rx="34" ry="31" fill="${s.body}"/>
    <g clip-path="url(#clip-bee)" fill="${s.accent}"><rect x="20" y="84" width="80" height="8"/><rect x="20" y="98" width="80" height="8"/></g>
    ${eyes(48, 72, 66, 0.9)}${blush(39, 81, 76, 0.8)}${smile(60, 75, 4)}`,

  cicada: (s) => `
    <path d="M60 48 L18 104 Q40 108 60 96Z" fill="#e8f6ff" stroke="#9cc9e8" stroke-width="1.5" opacity=".85"/>
    <path d="M60 48 L102 104 Q80 108 60 96Z" fill="#e8f6ff" stroke="#9cc9e8" stroke-width="1.5" opacity=".85"/>
    <path d="M40 80 L60 60 M80 80 L60 60" stroke="#9cc9e8" stroke-width="1.2"/>
    <ellipse cx="60" cy="76" rx="18" ry="28" fill="${s.body}"/>
    <path d="M48 76 h24 M50 86 h20" stroke="${s.accent}" stroke-width="2"/>
    <ellipse cx="60" cy="48" rx="24" ry="14" fill="${s.belly}"/>
    <circle cx="38" cy="46" r="8" fill="${s.accent}"/><circle cx="82" cy="46" r="8" fill="${s.accent}"/>
    <circle cx="40" cy="44" r="2.5" fill="#fff"/><circle cx="84" cy="44" r="2.5" fill="#fff"/>
    ${eyes(52, 68, 48, 0.55)}${smile(60, 53, 3)}`,

  ant: (s) => `
    <g stroke="${s.accent}" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M52 84 l-16 -4 M52 88 l-16 8 M54 92 l-10 14 M68 84 l16 -4 M68 88 l16 8 M66 92 l10 14"/></g>
    <ellipse cx="60" cy="100" rx="17" ry="10" fill="${s.body}"/>
    <circle cx="60" cy="86" r="8" fill="${s.body}"/>
    <path d="M48 36 L42 22 L32 18 M72 36 L78 22 L88 18" stroke="${s.accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="18" r="3.5" fill="${s.accent}"/><circle cx="88" cy="18" r="3.5" fill="${s.accent}"/>
    <circle cx="60" cy="56" r="26" fill="${s.belly}"/>
    ${eyes(50, 70, 54, 0.9)}${blush(41, 79, 64, 0.7)}${smile(60, 63, 4)}`,
};

// ---------- 동물 ----------

const ANIMAL = {
  cat: (s) => `
    <path d="M84 100 C108 98 112 72 100 64" stroke="${s.body}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M104 74 l7 -2 M106 84 l7 1" stroke="${s.accent}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="60" cy="98" rx="26" ry="12" fill="${s.body}"/>
    <path d="M28 54 L26 20 L54 38Z M92 54 L94 20 L66 38Z" fill="${s.body}"/>
    <path d="M32 46 L31 28 L46 38Z M88 46 L89 28 L74 38Z" fill="#ffb3c1"/>
    <ellipse cx="60" cy="62" rx="38" ry="31" fill="${s.body}"/>
    <path d="M52 34 l2 8 M60 32 v9 M68 34 l-2 8" stroke="${s.accent}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="60" cy="76" rx="15" ry="10" fill="${s.belly}"/>
    ${eyes(45, 75, 62, 0.95)}
    <path d="M57 70 h6 l-3 3Z" fill="#ff8fa3"/>${catMouth(60, 74)}
    <g stroke="${s.accent}" stroke-width="1.5" opacity=".6"><path d="M28 70 h12 M28 76 l12 -2 M92 70 h-12 M92 76 l-12 -2"/></g>
    ${blush(36, 84, 72, 0.8)}
    <ellipse cx="48" cy="106" rx="8" ry="5" fill="${s.belly}"/><ellipse cx="72" cy="106" rx="8" ry="5" fill="${s.belly}"/>`,

  dog: (s) => `
    <ellipse cx="60" cy="98" rx="26" ry="12" fill="${s.body}"/>
    <ellipse cx="60" cy="62" rx="36" ry="32" fill="${s.body}"/>
    <ellipse cx="74" cy="56" rx="11" ry="10" fill="${s.accent}" opacity=".45"/>
    <ellipse cx="27" cy="62" rx="11" ry="23" transform="rotate(18 27 62)" fill="${s.accent}"/>
    <ellipse cx="93" cy="62" rx="11" ry="23" transform="rotate(-18 93 62)" fill="${s.accent}"/>
    <ellipse cx="60" cy="77" rx="17" ry="12" fill="${s.belly}"/>
    ${eyes(46, 74, 58, 0.9)}
    <ellipse cx="60" cy="71" rx="6.5" ry="5" fill="#2b2b33"/><circle cx="58" cy="69.5" r="1.6" fill="#fff"/>
    <path d="M54 78 Q60 83 66 78" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M57 80 q3 9 6 0Z" fill="#ff8fa3"/>
    ${blush(36, 84, 72, 0.8)}
    <path d="M40 90 Q60 98 80 90" stroke="#e8532b" stroke-width="5" fill="none"/><circle cx="60" cy="97" r="4.5" fill="#ffd23f"/>`,

  sparrow: (s) => `
    <path d="M86 84 L104 90 L100 80Z" fill="${s.accent}"/>
    <ellipse cx="60" cy="72" rx="36" ry="32" fill="${s.body}"/>
    <ellipse cx="28" cy="78" rx="8" ry="15" transform="rotate(20 28 78)" fill="${s.accent}"/>
    <ellipse cx="92" cy="78" rx="8" ry="15" transform="rotate(-20 92 78)" fill="${s.accent}"/>
    <ellipse cx="60" cy="86" rx="24" ry="17" fill="${s.belly}"/>
    <path d="M27 62 C30 36 90 36 93 62 C80 50 40 50 27 62Z" fill="${s.accent}"/>
    <ellipse cx="38" cy="70" rx="7" ry="5" fill="#fff" opacity=".8"/><ellipse cx="82" cy="70" rx="7" ry="5" fill="#fff" opacity=".8"/>
    ${eyes(46, 74, 62, 0.8)}
    <path d="M54 70 L66 70 L60 78Z" fill="#f2a13b"/>
    ${blush(40, 80, 76, 0.7)}
    <path d="M50 104 v6 M70 104 v6 M47 110 h6 M67 110 h6" stroke="#f2a13b" stroke-width="2.5" stroke-linecap="round"/>`,

  magpie: (s) => `
    <path d="M80 90 L112 106 L108 96 L84 80Z" fill="${s.accent}"/>
    <ellipse cx="60" cy="72" rx="34" ry="32" fill="${s.body}"/>
    <ellipse cx="28" cy="80" rx="9" ry="17" transform="rotate(18 28 80)" fill="${s.accent}"/>
    <ellipse cx="92" cy="80" rx="9" ry="17" transform="rotate(-18 92 80)" fill="${s.accent}"/>
    <ellipse cx="29" cy="74" rx="4" ry="7" transform="rotate(18 29 74)" fill="#fff"/><ellipse cx="91" cy="74" rx="4" ry="7" transform="rotate(-18 91 74)" fill="#fff"/>
    <ellipse cx="60" cy="88" rx="20" ry="16" fill="${s.belly}"/>
    ${whiteEyes(47, 73, 60, 7)}
    <path d="M55 68 L65 68 L60 76Z" fill="#444"/>
    ${blush(40, 80, 74, 0.7)}
    <path d="M50 104 v6 M70 104 v6" stroke="#444" stroke-width="2.5" stroke-linecap="round"/>`,

  duck: (s) => `
    <ellipse cx="60" cy="74" rx="36" ry="32" fill="${s.body}"/>
    <ellipse cx="27" cy="80" rx="8" ry="13" transform="rotate(25 27 80)" fill="#ffd23f"/>
    <ellipse cx="93" cy="80" rx="8" ry="13" transform="rotate(-25 93 80)" fill="#ffd23f"/>
    <ellipse cx="60" cy="88" rx="22" ry="14" fill="${s.belly}"/>
    <path d="M56 42 Q54 30 60 28 M60 42 Q62 30 68 31 M58 42 Q50 34 50 38" stroke="#ffd23f" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${eyes(46, 74, 64, 0.85)}
    <ellipse cx="60" cy="76" rx="13" ry="6" fill="${s.accent}"/><path d="M48 76 h24" stroke="#d9771f" stroke-width="1.5"/>
    ${blush(36, 84, 76, 0.7)}
    <ellipse cx="46" cy="106" rx="9" ry="4" fill="${s.accent}"/><ellipse cx="74" cy="106" rx="9" ry="4" fill="${s.accent}"/>`,

  rabbit: (s) => `
    <ellipse cx="45" cy="28" rx="9" ry="26" transform="rotate(-10 45 28)" fill="${s.body}" stroke="#e2dcd6" stroke-width="2"/>
    <ellipse cx="75" cy="28" rx="9" ry="26" transform="rotate(10 75 28)" fill="${s.body}" stroke="#e2dcd6" stroke-width="2"/>
    <ellipse cx="45" cy="26" rx="4.5" ry="18" transform="rotate(-10 45 26)" fill="${s.accent}"/>
    <ellipse cx="75" cy="26" rx="4.5" ry="18" transform="rotate(10 75 26)" fill="${s.accent}"/>
    <ellipse cx="60" cy="98" rx="26" ry="12" fill="${s.body}" stroke="#e2dcd6" stroke-width="2"/>
    <ellipse cx="60" cy="68" rx="34" ry="29" fill="${s.body}" stroke="#e2dcd6" stroke-width="2"/>
    ${eyes(47, 73, 64, 0.9)}
    <ellipse cx="60" cy="74" rx="4" ry="3" fill="#ff8fa3"/>
    <path d="M60 77 v4 M56 82 Q60 86 64 82" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="57.5" y="82" width="5" height="5" rx="1" fill="#fff" stroke="#ccc" stroke-width="1"/>
    ${blush(38, 82, 76, 0.8)}`,

  hedgehog: (s) => {
    let spikes = 'M16 86 ';
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const r = i % 2 ? 44 : 34;
      spikes += `L${(60 + r * Math.cos(a)).toFixed(1)} ${(80 + r * Math.sin(a) * 0.95).toFixed(1)} `;
    }
    spikes += 'L104 86 Z';
    return `<path d="${spikes}" fill="${s.accent}"/>
      <ellipse cx="60" cy="82" rx="38" ry="28" fill="${s.body}"/>
      <ellipse cx="60" cy="86" rx="28" ry="22" fill="${s.belly}"/>
      ${eyes(49, 71, 80, 0.8)}
      <circle cx="60" cy="90" r="4" fill="#2b2b33"/>${smile(60, 95, 3)}
      ${blush(42, 78, 92, 0.7)}
      <ellipse cx="46" cy="108" rx="7" ry="4" fill="${s.accent}"/><ellipse cx="74" cy="108" rx="7" ry="4" fill="${s.accent}"/>`;
  },

  frog: (s) => `
    <ellipse cx="34" cy="104" rx="14" ry="6" fill="${s.accent}"/><ellipse cx="86" cy="104" rx="14" ry="6" fill="${s.accent}"/>
    <circle cx="38" cy="48" r="14" fill="${s.body}"/><circle cx="82" cy="48" r="14" fill="${s.body}"/>
    <ellipse cx="60" cy="76" rx="42" ry="29" fill="${s.body}"/>
    <ellipse cx="60" cy="90" rx="26" ry="13" fill="${s.belly}"/>
    ${whiteEyes(38, 82, 46, 9)}
    <path d="M40 76 Q60 92 80 76" stroke="#2b2b33" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${blush(30, 90, 72, 0.9)}`,
};

// ---------- 물고기 ----------

function fishBody(s, extra = '') {
  return `<path d="M84 70 L108 50 L103 70 L108 90Z" fill="${s.accent}"/>
    <path d="M46 50 Q62 32 76 50Z" fill="${s.accent}"/>
    <path d="M56 88 Q62 100 70 88Z" fill="${s.accent}"/>
    <ellipse cx="60" cy="70" rx="33" ry="22" fill="${s.body}"/>
    <ellipse cx="56" cy="78" rx="21" ry="9" fill="${s.belly}"/>
    ${extra}
    <path d="M66 60 q5 6 0 12 M76 59 q5 8 0 16" stroke="${s.accent}" stroke-width="2" fill="none" opacity=".45"/>
    <ellipse cx="42" cy="64" rx="5.5" ry="6.5" fill="#2b2b33"/><circle cx="43.8" cy="61.6" r="2.1" fill="#fff"/><circle cx="40.6" cy="66.4" r="1" fill="#fff"/>
    <ellipse cx="45" cy="75" rx="5" ry="3" fill="#ff8fa3" opacity=".55"/>
    <path d="M28 71 q3 3 6 0" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

const FISH = {
  fish: (s) => fishBody(s),
  koi: (s) => fishBody(s, `<ellipse cx="68" cy="62" rx="11" ry="7" fill="${s.accent}"/><ellipse cx="50" cy="56" rx="7" ry="5" fill="${s.accent}"/>
    <ellipse cx="78" cy="76" rx="6" ry="4" fill="${s.accent}"/>
    <path d="M29 74 q-6 6 -10 4" stroke="${s.accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  gold: (s) => `${fishBody(s)}
    <path d="${starPath(22, 40, 7, 2.5)}" fill="#fff6c4"/><path d="${starPath(96, 36, 5, 2)}" fill="#fff6c4"/>
    <path d="${starPath(100, 100, 6, 2.2)}" fill="#fff6c4"/>`,
  turtle: (s) => `
    <ellipse cx="30" cy="100" rx="11" ry="6" fill="${s.belly}"/><ellipse cx="90" cy="100" rx="11" ry="6" fill="${s.belly}"/>
    <path d="M18 88 C18 44 102 44 102 88Z" fill="${s.body}"/>
    <path d="M60 52 L48 64 L52 80 L68 80 L72 64Z" fill="none" stroke="${s.accent}" stroke-width="2.5"/>
    <path d="M48 64 L30 66 M72 64 L90 66 M52 80 L40 88 M68 80 L80 88 M60 52 V46" stroke="${s.accent}" stroke-width="2.5"/>
    <rect x="16" y="84" width="88" height="8" rx="4" fill="${s.accent}"/>
    <ellipse cx="60" cy="96" rx="19" ry="14" fill="${s.belly}"/>
    ${eyes(52, 68, 94, 0.6)}${blush(46, 74, 101, 0.5)}${smile(60, 101, 3)}`,
};

// ---------- 그리기 ----------

function inner(s, silhouette) {
  if (s.kind === 'insect') return INSECT[s.draw](s);
  if (s.kind === 'animal') return ANIMAL[s.draw](s);
  if (s.kind === 'fish') return FISH[s.draw](s);
  return drawMonster(s, silhouette);
}

/**
 * 도감 캐릭터 SVG 문자열을 만든다.
 * @param {object|string} sp 종 데이터 또는 id
 * @param {{silhouette?: boolean, size?: number}} opts
 */
export function monsterSVG(sp, opts = {}) {
  const s = typeof sp === 'string' ? speciesById[sp] : sp;
  const size = opts.size || 120;
  const body = inner(s, opts.silhouette);
  const content = opts.silhouette ? `<g filter="url(#sil)">${body}</g>` : body;
  const defs = opts.silhouette
    ? `<defs><filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.38  0 0 0 0 0.42  0 0 0 1 0"/></filter></defs>` : '';
  const shadow = s.kind === 'fish' && s.draw !== 'turtle' ? '' : `<ellipse cx="60" cy="110" rx="34" ry="6" fill="#000" opacity=".12"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${opts.silhouette ? '미발견' : s.name}">${defs}${shadow}${content}</svg>`;
}

/** 받침 유무에 따라 조사를 고른다. josa('숲뭉치', '을', '를') → '숲뭉치를' */
export function josa(word, withBatchim, without) {
  const c = word.charCodeAt(word.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return word + (has ? withBatchim : without);
}

const HABITAT_TEXT = {
  any: '한숲시티 어디서나', day: '낮(6~19시)', night: '밤(19~6시)', school: '남곡초 주변',
  park: '공원(산내음·햇빛공원)에 많음', water: '한숲물빛공원 연못', legend: '남곡초 특별 거점 (아주 드묾)',
};
export function habitatText(sp) {
  return sp.habitat.map(h => HABITAT_TEXT[h]).join(' · ');
}
