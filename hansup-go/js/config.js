// 한숲GO 설정 파일
// 거점 위치, 출현 규칙, 가족 공유(Firebase) 설정을 여기서 바꿀 수 있습니다.

export const CONFIG = {
  gameName: '한숲GO',

  // 지도 시작 위치: 용인시 처인구 남사읍 한숲시티 일대
  home: { lat: 37.1575, lng: 127.1705, zoom: 16 },

  // 거점(아이템을 받는 곳)
  // ⚠ 남곡초와 5단지 외의 단지 좌표는 근사치입니다. 네이버/카카오 지도에서 정확한 위치를 확인해 고쳐 주세요.
  //   (게임 지도를 길게 누르면 그 지점의 좌표가 표시되어 복사할 수 있습니다.)
  stops: [
    // 남곡초: 한숲로 110 (2018년 이전한 현재 교사), Wikidata 좌표 기준
    { id: 'namgok', name: '남곡초등학교', lat: 37.1577, lng: 127.1747, special: true },
    { id: 'danji1', name: '한숲시티 1단지', lat: 37.1545, lng: 127.1660 },
    { id: 'danji2', name: '한숲시티 2단지', lat: 37.1530, lng: 127.1700 },
    { id: 'danji3', name: '한숲시티 3단지', lat: 37.1552, lng: 127.1748 },
    { id: 'danji4', name: '한숲시티 4단지', lat: 37.1603, lng: 127.1688 },
    { id: 'danji5', name: '한숲시티 5단지', lat: 37.15635, lng: 127.17055 },
    { id: 'danji6', name: '한숲시티 6단지', lat: 37.1612, lng: 127.1745 },
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
  stopCooldownMinutes: 5,

  // 가족 공유 도감 (Firebase)
  // README.md의 안내대로 Firebase 프로젝트를 만든 뒤 아래 값을 채우면
  // 가족끼리 도감과 순위를 함께 볼 수 있습니다. 비워 두면 혼자 하기 모드로 동작합니다.
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
};

export const firebaseEnabled = () => Boolean(CONFIG.firebase.apiKey && CONFIG.firebase.projectId);
