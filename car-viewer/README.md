# Car Viewer (자동차 3D 뷰어)

`.glb` / `.gltf` 자동차 모델을 브라우저에서 불러와 사실적으로 렌더링하는 정적 웹 앱입니다.
빌드 과정 없이 그대로 GitHub Pages에 배포됩니다 (`/car-viewer/`).

## 기능

- **모델 불러오기**: 파일 열기, 드래그 앤 드롭, URL 입력, 주소의 `?model=` 파라미터
  - `.gltf`는 `.bin`과 텍스처 파일을 함께 선택하거나 끌어다 놓으면 됩니다.
  - Draco, Meshopt, KTX2로 압축된 모델도 읽습니다.
- **실제 크기로 맞춤**: 가장 긴 수평 길이를 입력한 전장(기본 5.06 m)에 맞추고, 바닥에 세웁니다.
- **방향 맞추기**: 90° 회전과 앞뒤 바꾸기로 차 앞이 `정면` 시점에 오도록 맞춥니다.
- **도장 바꾸기**: 차체 재질을 이름과 면적으로 자동 추정하고, 클리어코트 도장으로 색을 바꿉니다. 원래 재질로 되돌릴 수 있습니다.
- **조명**: 스튜디오 환경광(RoomEnvironment), 그림자, 노출과 반사광 조절
- **애니메이션**: 모델에 애니메이션(문 열림 등)이 있으면 재생 버튼이 나타납니다.
- **PNG 저장**: 현재 화면을 투명 배경 PNG로 저장합니다.
- 모델이 없으면 코드로 만든 펠리세이드 LX2 근사 모형(`procedural-car.js`)을 보여 줍니다.

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
| `procedural-car.js` | 모델이 없을 때 쓰는 코드 생성 근사 모형 |
| `style.css` | 화면 스타일 |
| `models/` | 기본 모델을 넣는 폴더 |
