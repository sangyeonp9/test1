// 한숲GO 몬스터 도감 데이터와 그림(SVG) 생성기
// 모든 캐릭터는 이 게임을 위해 새로 만든 오리지널 캐릭터입니다.

export const RARITY = {
  common:    { label: '흔함',   color: '#7a8b6f', weight: 60, catchRate: 0.72, flee: 0.05, xp: 100 },
  uncommon:  { label: '보통',   color: '#3f8fd2', weight: 28, catchRate: 0.52, flee: 0.10, xp: 200 },
  rare:      { label: '희귀',   color: '#a45ee5', weight: 10, catchRate: 0.36, flee: 0.15, xp: 500 },
  legendary: { label: '전설',   color: '#e8a317', weight: 0,  catchRate: 0.22, flee: 0.20, xp: 2000 },
};

// habitat: any(어디서나) | night(밤에만) | day(낮에만) | school(남곡초 주변)
export const SPECIES = [
  {
    id: 'sumbbong', no: 1, name: '숲뭉치', type: '풀', rarity: 'common', habitat: 'any',
    desc: '한숲시티 화단 어디서나 볼 수 있다. 머리의 새싹을 쓰다듬으면 기분이 좋아진다.',
    shape: 'round', top: 'sprout', body: '#8fd16a', belly: '#d8f5c0', accent: '#4f9a3a', size: [18, 30],
  },
  {
    id: 'mulbangkong', no: 2, name: '물방울콩', type: '물', rarity: 'common', habitat: 'any',
    desc: '비 온 뒤 놀이터 웅덩이에 모여 산다. 통통 튀며 걷는다.',
    shape: 'drop', top: 'none', body: '#7cc7f2', belly: '#d9f1ff', accent: '#3a8fc9', size: [15, 25],
  },
  {
    id: 'gureumsom', no: 3, name: '구름솜', type: '바람', rarity: 'common', habitat: 'day',
    desc: '맑은 날 아파트 옥상 위를 둥실둥실 떠다닌다. 만지면 솜사탕처럼 폭신하다.',
    shape: 'cloud', top: 'none', body: '#f4f6ff', belly: '#ffffff', accent: '#a9b4e8', size: [25, 40],
  },
  {
    id: 'dotoriram', no: 4, name: '도토리람', type: '풀', rarity: 'common', habitat: 'any',
    desc: '볼에 도토리를 가득 넣고 다니는 다람쥐 몬스터. 단지 산책로 나무 위를 좋아한다.',
    shape: 'pear', top: 'acorn', tail: 'squirrel', body: '#c98a4b', belly: '#f3dcbc', accent: '#8a5428', size: [20, 32],
  },
  {
    id: 'bulssikkomi', no: 5, name: '불씨꼬미', type: '불', rarity: 'uncommon', habitat: 'any',
    desc: '머리 위 작은 불꽃이 기분에 따라 커졌다 작아졌다 한다. 겨울에 인기가 많다.',
    shape: 'round', top: 'flame', body: '#ff9a62', belly: '#ffe0c7', accent: '#e8532b', size: [20, 30],
  },
  {
    id: 'agoknoguri', no: 6, name: '아곡너구리', type: '땅', rarity: 'uncommon', habitat: 'any',
    desc: '아곡리 들판에서 내려온 장난꾸러기. 눈가의 무늬가 마스크처럼 보인다.',
    shape: 'pear', top: 'bear', mask: true, tail: 'stripe', body: '#9c8f86', belly: '#eee4da', accent: '#4c433e', size: [28, 42],
  },
  {
    id: 'banjjakbandi', no: 7, name: '반짝반디', type: '벌레', rarity: 'uncommon', habitat: 'night',
    desc: '밤이 되면 단지 산책로를 따라 노란 불빛을 깜빡인다. 밤에만 만날 수 있다.',
    shape: 'tall', top: 'antenna', glow: true, body: '#3c4a7a', belly: '#ffe46b', accent: '#ffd23f', size: [8, 14],
  },
  {
    id: 'dalbittokki', no: 8, name: '달빛토끼', type: '요정', rarity: 'rare', habitat: 'night',
    desc: '보름달이 뜨는 밤에 자주 보인다. 귀 끝이 달빛처럼 은은하게 빛난다.',
    shape: 'round', top: 'bunny', body: '#e9e4ff', belly: '#ffffff', accent: '#9d8cf0', size: [22, 34],
  },
  {
    id: 'chaekbeolmung', no: 9, name: '책벌레뭉', type: '에스퍼', rarity: 'uncommon', habitat: 'school',
    desc: '남곡초 도서관에 사는 몬스터. 동그란 안경을 쓰고 동화책 읽기를 좋아한다.',
    shape: 'tall', top: 'antenna2', glasses: true, body: '#9bd59a', belly: '#e6f7e2', accent: '#3e7d4c', size: [12, 20],
  },
  {
    id: 'jongsorinyang', no: 10, name: '종소리냥', type: '노말', rarity: 'rare', habitat: 'school',
    desc: '수업 종이 울리면 어디선가 나타나는 고양이. 목에 단 방울 소리가 맑다.',
    shape: 'round', top: 'cat', bell: true, body: '#ffd27a', belly: '#fff3d6', accent: '#d98f1c', size: [24, 34],
  },
  {
    id: 'kkotbyeori', no: 11, name: '꽃별이', type: '요정', rarity: 'rare', habitat: 'day',
    desc: '봄이면 한숲시티 벚꽃길에 나타난다. 지나간 자리에 꽃잎이 흩날린다.',
    shape: 'drop', top: 'flower', body: '#ffb7cf', belly: '#ffe8f0', accent: '#e86f9b', size: [14, 22],
  },
  {
    id: 'hansupwang', no: 12, name: '한숲왕', type: '전설', rarity: 'legendary', habitat: 'legend',
    desc: '한숲시티를 지키는 숲의 왕. 남곡초등학교 특별 거점에서 아주 드물게 모습을 드러낸다.',
    shape: 'pear', top: 'crown', cape: true, body: '#4fb08a', belly: '#d7f3e6', accent: '#e8a317', size: [60, 80],
  },
];

export const speciesById = Object.fromEntries(SPECIES.map(s => [s.id, s]));

// ---------- SVG 그림 생성 ----------

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

// 머리 장식 (몸 뒤에 그리는 것과 앞에 그리는 것을 나눔)
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
    default:
      return '';
  }
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

function face(s) {
  const eyeY = s.shape === 'cloud' ? 66 : 66;
  let out = '';
  if (s.mask) {
    out += `<path d="M30 64 Q46 52 60 62 Q74 52 90 64 Q84 76 72 72 Q60 66 48 72 Q36 76 30 64Z" fill="${s.accent}" opacity=".85"/>`;
  }
  out += `<ellipse cx="47" cy="${eyeY}" rx="5.5" ry="7" fill="#2b2b33"/><ellipse cx="73" cy="${eyeY}" rx="5.5" ry="7" fill="#2b2b33"/>
          <circle cx="48.8" cy="${eyeY - 2.6}" r="2.2" fill="#fff"/><circle cx="74.8" cy="${eyeY - 2.6}" r="2.2" fill="#fff"/>
          <circle cx="45.5" cy="${eyeY + 2.5}" r="1" fill="#fff"/><circle cx="71.5" cy="${eyeY + 2.5}" r="1" fill="#fff"/>`;
  if (s.glasses) {
    out += `<g fill="none" stroke="#5b4636" stroke-width="2.5"><circle cx="47" cy="${eyeY}" r="10"/><circle cx="73" cy="${eyeY}" r="10"/><path d="M57 ${eyeY} h6"/></g>`;
  }
  out += `<ellipse cx="37" cy="78" rx="6" ry="3.5" fill="#ff8fa3" opacity=".55"/><ellipse cx="83" cy="78" rx="6" ry="3.5" fill="#ff8fa3" opacity=".55"/>`;
  if (s.top === 'cat') {
    out += `<path d="M54 76 Q57 80 60 76 Q63 80 66 76" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else {
    out += `<path d="M55 77 Q60 82 65 77" stroke="#2b2b33" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  if (s.bell) {
    out += `<path d="M42 92 Q60 100 78 92" stroke="#e8532b" stroke-width="4" fill="none"/>
            <circle cx="60" cy="99" r="6" fill="#ffd23f" stroke="#b77c08" stroke-width="1.5"/><path d="M57 100 h6" stroke="#b77c08" stroke-width="1.5"/>`;
  }
  return out;
}

function feet(s) {
  if (s.shape === 'cloud') return '';
  return `<ellipse cx="45" cy="105" rx="9" ry="5" fill="${s.accent}"/><ellipse cx="75" cy="105" rx="9" ry="5" fill="${s.accent}"/>`;
}

/**
 * 몬스터 SVG 문자열을 만든다.
 * @param {object|string} sp 종 데이터 또는 id
 * @param {{silhouette?: boolean, size?: number}} opts
 */
export function monsterSVG(sp, opts = {}) {
  const s = typeof sp === 'string' ? speciesById[sp] : sp;
  const size = opts.size || 120;
  const glow = s.glow && !opts.silhouette
    ? `<circle cx="60" cy="96" r="30" fill="${s.accent}" opacity=".25"/>` : '';
  const inner = `${glow}${tail(s)}${topBack(s)}${BODY[s.shape](s)}${BELLY[s.shape](s)}${feet(s)}${topFront(s)}${face(s)}`;
  const content = opts.silhouette
    ? `<g filter="url(#sil)">${inner}</g>` : inner;
  const defs = opts.silhouette
    ? `<defs><filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.38  0 0 0 0 0.42  0 0 0 1 0"/></filter></defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${opts.silhouette ? '미발견 몬스터' : s.name}">${defs}<ellipse cx="60" cy="110" rx="34" ry="6" fill="#000" opacity=".12"/>${content}</svg>`;
}
