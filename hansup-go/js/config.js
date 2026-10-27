// 한숲GO 설정 파일
// 거점 위치, 출현 규칙, 친구 공유(Firebase) 설정을 여기서 바꿀 수 있습니다.

export const CONFIG = {
  gameName: '한숲GO',

  // 지도 시작 위치: 용인시 처인구 남사읍 한숲시티 일대
  home: { lat: 37.1570, lng: 127.1722, zoom: 16 },

  // 거점(아이템을 받는 곳)
  // 네이버 지도(한숲시티) 화면의 단지 표시 위치를 기준으로 맞춘 좌표입니다.
  // 4단지는 지도 화면 밖이라 주소로 추정한 값이니, 실제와 다르면 고쳐 주세요.
  //   (게임 지도를 길게 누르면 그 지점의 좌표가 표시되어 복사할 수 있습니다.)
  stops: [
    // 남곡초: 한숲로 110 (2018년 이전한 현재 교사)
    { id: 'namgok', name: '남곡초등학교', lat: 37.1577, lng: 127.1747, special: true },
    { id: 'danji1', name: '한숲시티 1단지 (파크카운티)', lat: 37.15503, lng: 127.16706 },
    { id: 'danji2', name: '한숲시티 2단지', lat: 37.16105, lng: 127.17398 },
    { id: 'danji3', name: '한숲시티 3단지', lat: 37.15946, lng: 127.17310 },
    { id: 'danji4', name: '한숲시티 4단지', lat: 37.15891, lng: 127.17511 }, // 추정 (한숲로 124)
    { id: 'danji5', name: '한숲시티 5단지', lat: 37.15635, lng: 127.17055 },
    { id: 'danji6', name: '한숲시티 6단지', lat: 37.15458, lng: 127.17407 },
  ],

  // 특별 구역: 물고기·오리·개구리는 연못에서만, 곤충은 공원에 많이 나옵니다.
  zones: [
    { id: 'pond', name: '한숲물빛공원', type: 'water', lat: 37.15470, lng: 127.16979, radius: 90 },
    { id: 'sannae', name: '한숲산내음공원', type: 'park', lat: 37.15822, lng: 127.17086, radius: 110 },
    { id: 'haetbit', name: '한숲햇빛공원', type: 'park', lat: 37.15619, lng: 127.17497, radius: 100 },
  ],

  // 거리 규칙 (미터)
  visibleRadius: 250,   // 이 거리 안의 몬스터가 지도에 보임
  catchRadius: 45,      // 이 거리 안에 들어가야 잡을 수 있음
  stopRadius: 45,       // 거점 아이템을 받을 수 있는 거리
  schoolZone: 180,      // 남곡초 주변 이 거리 안에서는 학교 몬스터가 잘 나옴

  // 출현 규칙
  spawnSlotMinutes: 15, // 몬스터가 바뀌는 주기
  spawnChance: 0.3,     // 한 칸(약 80m)에 몬스터가 나올 확률
  cellLat: 0.0007,
  cellLng: 0.0009,
  nightStart: 19,       // 밤 몬스터가 나오는 시간
  nightEnd: 6,

  // 아이템
  startBalls: 20,
  stopBalls: 5,
  specialStopBalls: 10,
  startSnacks: 15,      // 동물과 친구가 될 때 쓰는 간식
  stopSnacks: 3,
  specialStopSnacks: 5,
  netSwings: 5,         // 곤충 한 마리에 잠자리채를 휘두를 수 있는 횟수
  stopCooldownMinutes: 5,

  // 친구 공유 도감 (Firebase)
  // 같은 친구 코드를 쓰는 사람끼리 도감과 순위를 함께 봅니다. 값을 비우면 혼자 하기 모드로 동작합니다.
  // apiKey는 비밀번호가 아니라 앱을 구분하는 공개 값이고, 데이터는 firestore.rules로 보호됩니다.
  firebase: {
    apiKey: 'AIzaSyB1GSOrEil8UhTuSBAAcu0lYAk8wDoALJs',
    authDomain: 'hansup-go.firebaseapp.com',
    projectId: 'hansup-go',
    appId: '1:939735711607:web:e5fb12a0b32917601ceb72',
  },
};

export const firebaseEnabled = () => Boolean(CONFIG.firebase.apiKey && CONFIG.firebase.projectId);
