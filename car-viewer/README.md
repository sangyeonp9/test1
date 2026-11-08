# Car Viewer (자동차 3D 뷰어)

`.glb` / `.gltf` 자동차 모델을 브라우저에서 불러와 사실적으로 렌더링하는 정적 웹 앱입니다.
빌드 과정 없이 그대로 GitHub Pages에 배포됩니다 (`/car-viewer/`).

## 기능

- **모델 불러오기**: 파일 열기, 드래그 앤 드롭, URL 입력, 주소의 `?model=` 파라미터
  - `.gltf`는 `.bin`과 텍스처 파일을 함께 선택하거나 끌어다 놓으면 됩니다.
  - Draco, Meshopt, KTX2로 압축된 모델도 읽습니다.
- **실제 크기로 맞춤**: 가장 긴 수평 길이를 입력한 전장(기본 4.98 m, 팰리세이드 LX2)에 맞추고, 바닥에 세웁니다.
- **방향 맞추기**: 90° 회전과 앞뒤 바꾸기로 차 앞이 `정면` 시점에 오도록 맞춥니다.
- **도장 바꾸기**: 차체 재질을 이름과 면적으로 자동 추정하고, 클리어코트 도장으로 색을 바꿉니다. 원래 재질로 되돌릴 수 있습니다.
- **조명**: 스튜디오 환경광(RoomEnvironment), 그림자, 노출과 반사광 조절
- **애니메이션**: 모델에 애니메이션(문 열림 등)이 있으면 재생 버튼이 나타납니다.
- **PNG 저장**: 현재 화면을 투명 배경 PNG로 저장합니다.
- 모델이 없으면 코드로 만든 팰리세이드 LX2 근사 모형(`procedural-car.js`)을 보여 줍니다. 아래 제원으로 만들었고, 모델 정보 칸에 제원과 실측값을 나란히 보여 줍니다.

## 내장 근사 모형의 치수

LX2는 1세대 팰리세이드(2018–2024) 코드명입니다. 2025년에 나온 2세대 "디 올 뉴 팰리세이드"는 LX3이고 치수가 다릅니다(전장 5,060 mm, 축거 2,970 mm).
모형은 LX2 **페이스리프트 이전(2018–2021)** 외관 기준입니다. 육각형 캐스케이딩 그릴, 범퍼 모서리의 세로형 3구 헤드램프와 "[" 모양 DRL, 보닛 끝의 가는 윗램프가 이 시기 디자인입니다.
치수는 `procedural-car.js`의 `PALISADE_LX2_SPEC` 한 곳에서 정합니다.

| 항목 | 제원 | 모형 실측 | 근거 |
|---|---|---|---|
| 전장 | 4,980 mm | 4,988 mm | 공개 제원 (페이스리프트 이후 4,995) |
| 전폭 (미러 제외) | 1,975 mm | 1,975 mm | 공개 제원 |
| 전고 (루프랙 포함) | 1,750 mm | 1,750 mm | 공개 제원 |
| 축거 | 2,900 mm | 2,900 mm | 공개 제원 |
| 윤거 전 / 후 | 1,708 / 1,716 mm | 1,708 / 1,716 mm | 현대자동차 공식 제원 |
| 후방 오버행 | 1,135 mm | 1,136 mm | 호주 시장 제원 (1,130–1,136) |
| 전방 오버행 | 945 mm | 952 mm | 전장 − 축거 − 후방 오버행 (conceptcarz 945와 일치) |
| 최저지상고 | 203 mm | 203 mm | 공개 제원 (201–203) |
| 타이어 | 245/50R20 (지름 753 mm) | 지름 755 mm | 공개 제원 (18인치는 245/60R18) |
| 접근각 / 이탈각 | 18.5° / 20.3° | 범퍼 아래 끝을 이 각도 선 위에 배치 | 현대자동차 호주 공식 제원표 |

### 사진에서 잰 외형

공개 제원에 없는 외형은 정측면 사진 한 장에서 쟀습니다(`PALISADE_LX2_SPEC.photo`).

- **축척:** 사진 속 두 바퀴 중심 사이 359 px를 축거 2,900 mm로 놓아 8.08 mm/px로 환산했습니다. 같은 축척으로 잰 타이어 반지름(380 mm, 제원 376)과 휠 반지름(258 mm, 20인치 254)이 맞아서 축척을 확인했습니다.
- **원근:** 사진에서 차 앞뒤 끝은 실제보다 짧아 보입니다(앞 오버행 832 mm, 뒤 945 mm로 측정됨). 범퍼 가운데가 바퀴보다 1 m쯤 카메라에서 멀기 때문입니다. 계산하면 카메라는 약 21.5 m 떨어져 있었습니다. 그래서 옆면 평면에 있는 요소만 쟀습니다.
  - 높이: 보닛, 숄더, 창 아래·위, 루프
  - 앞뒤 위치: A·B·C필러, C필러 크롬 사선, 문 절개선, 손잡이, 미러, 휠 아치
- **위에서 본 라운드:** 압출한 차체는 위에서 보면 모서리가 네모납니다. 그래서 오버행 구간을 옆으로 갈수록 안으로 당겨 앞뒤 모서리를 둥글렸습니다(가운데는 그대로라 전장 유지).
- **검증:** 같은 카메라 조건(21.5 m, 8.08 mm/px)으로 모형을 렌더링해 사진 위에 겹쳤습니다. 바퀴, 휠 아치, 보닛선, A필러 기울기, 루프, 창 아래선과 앞뒤 끝 윤곽이 사진과 겹치는 것을 확인했습니다.

남은 한계도 있습니다. 차체가 박스와 압출 조합이라 도어 아래의 깊은 캐릭터 라인, 펜더의 볼륨, 보닛 가운데의 볼록함은 표현하지 못합니다. 그릴과 램프 모양은 정면·후면 사진을 보고 비슷하게 그렸고, 치수를 잰 것은 아닙니다.

치수 출처:
- [위키백과 Hyundai Palisade](https://en.wikipedia.org/wiki/Hyundai_Palisade)
- [헤이딜러 LX2·LX3 크기 비교](https://www.heydealer.com/blog/new-palisade-size-comparison-5-cars)
- [다나와 팰리세이드(LX2) F/L 제원](https://auto.danawa.com/auto/?Lineup=49755&Model=4190&Tab=spec&Work=model&pcUse=y)
- [현대자동차 팰리세이드 제원](https://www.hyundai.com/kr/ko/vehicles/palisade/18lc/specifications.html)
- [현대자동차 호주 Palisade 2021 제원표 (PDF)](https://www.hyundai.com/content/dam/hyundai/au/en/models/palisade/docs/Hyundai_Palisade_Specifications_2021.pdf)
- [carsales 2020 Palisade](https://www.carsales.com.au/research/hyundai/palisade/2020/highlander/327f8ba7-fd67-48cc-993a-fa4dc9896bef/), [conceptcarz 2023 Palisade](https://www.conceptcarz.com/s32677/hyundai-palisade.aspx)
- [CarsGuide 2023 Palisade](https://www.carsguide.com.au/hyundai/palisade/car-dimensions/2023)

## 로컬에서 실행

ES 모듈과 파일 로딩 때문에 `file://`로는 열리지 않습니다. 로컬 서버로 여세요.

```bash
python3 -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000/car-viewer/` 를 엽니다.

## 기본 모델 넣기

`car-viewer/models/palisade-lx2.glb` 파일이 있으면 시작할 때 자동으로 불러옵니다.
다른 파일은 `?model=` 파라미터로 지정할 수 있습니다.

```
/car-viewer/?model=models/my-car.glb
```

모델 파일은 저장소에 포함되어 있지 않습니다. Sketchfab 같은 사이트에서 받을 때는 라이선스(상업 이용, 재배포 허용 여부)를 확인하세요.
GitHub는 100 MB가 넘는 파일을 받지 않으므로, 큰 모델은 [gltf-transform](https://gltf-transform.dev/)으로 압축하는 것이 좋습니다.

```bash
npx @gltf-transform/cli optimize input.glb models/palisade-lx2.glb --compress draco --texture-compress webp
```

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구성, three.js import map (jsDelivr, `three@0.170.0` 고정) |
| `main.js` | 렌더러, 모델 로딩, 크기 맞춤, 도장, 시점, 저장 |
| `procedural-car.js` | 모델이 없을 때 쓰는 코드 생성 근사 모형과 LX2 치수표(`PALISADE_LX2_SPEC`) |
| `style.css` | 화면 스타일 |
| `models/` | 기본 모델을 넣는 폴더 |
