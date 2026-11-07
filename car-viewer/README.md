# Car Viewer (자동차 3D 뷰어)

`.glb` / `.gltf` 자동차 모델을 브라우저에서 불러와 사실적으로 렌더링하는 정적 웹 앱입니다.
빌드 과정 없이 그대로 GitHub Pages에 배포됩니다 (`/car-viewer/`).

## 기능

- **모델 불러오기**: 파일 열기, 드래그 앤 드롭, URL 입력, 주소의 `?model=` 파라미터
  - `.gltf`는 `.bin`과 텍스처 파일을 함께 선택하거나 끌어다 놓으면 됩니다.
  - Draco, Meshopt, KTX2로 압축된 모델도 읽습니다.
- **실제 크기로 맞춤**: 가장 긴 수평 길이를 입력한 전장(기본 4.995 m, 팰리세이드 LX2)에 맞추고, 바닥에 세웁니다.
- **방향 맞추기**: 90° 회전과 앞뒤 바꾸기로 차 앞이 `정면` 시점에 오도록 맞춥니다.
- **도장 바꾸기**: 차체 재질을 이름과 면적으로 자동 추정하고, 클리어코트 도장으로 색을 바꿉니다. 원래 재질로 되돌릴 수 있습니다.
- **조명**: 스튜디오 환경광(RoomEnvironment), 그림자, 노출과 반사광 조절
- **애니메이션**: 모델에 애니메이션(문 열림 등)이 있으면 재생 버튼이 나타납니다.
- **PNG 저장**: 현재 화면을 투명 배경 PNG로 저장합니다.
- 모델이 없으면 코드로 만든 팰리세이드 LX2 근사 모형(`procedural-car.js`)을 보여 줍니다. 아래 제원으로 만들었고, 모델 정보 칸에 제원과 실측값을 나란히 보여 줍니다.

## 내장 근사 모형의 치수

LX2는 1세대 팰리세이드(2018–2024) 코드명입니다. 2025년에 나온 2세대 "디 올 뉴 팰리세이드"는 LX3이고 치수가 다릅니다(전장 5,060 mm, 축거 2,970 mm).
모형은 LX2 페이스리프트(2022–) 기준이며, 치수는 `procedural-car.js`의 `PALISADE_LX2_SPEC` 한 곳에서 정합니다.

| 항목 | 제원 | 모형 실측 | 근거 |
|---|---|---|---|
| 전장 | 4,995 mm | 4,998 mm | 공개 제원 (페이스리프트 이전 4,980) |
| 전폭 (미러 제외) | 1,975 mm | 1,975 mm | 공개 제원 |
| 전고 (루프랙 포함) | 1,750 mm | 1,750 mm | 공개 제원 |
| 축거 | 2,900 mm | 2,900 mm | 공개 제원 |
| 윤거 전 / 후 | 1,708 / 1,716 mm | 1,708 / 1,716 mm | 현대자동차 공식 제원 |
| 후방 오버행 | 1,135 mm | 1,135 mm | 호주 시장 제원 (1,130–1,136) |
| 전방 오버행 | 960 mm | 962 mm | 전장 − 축거 − 후방 오버행으로 계산 |
| 최저지상고 | 203 mm | 203 mm | 공개 제원 (201–203) |
| 타이어 | 245/50R20 (지름 753 mm) | 지름 755 mm | 공개 제원 (18인치는 245/60R18) |
| 접근각 / 이탈각 | 18.5° / 20.3° | 범퍼 아래 끝을 이 각도 선 위에 배치 | 현대자동차 호주 공식 제원표 |

공개 제원으로 확인할 수 없어 사진 비율로 추정한 값도 있습니다. 보닛·카울·벨트라인 높이, 앞유리 기울기, 필러 위치, 그릴과 램프 크기, 사이드미러 돌출이 그렇습니다(미러 포함 폭 2,235 mm도 추정). 공식 도면이나 실측으로 맞출 때는 `PALISADE_LX2_SPEC`의 추정 항목을 고치면 됩니다.

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
