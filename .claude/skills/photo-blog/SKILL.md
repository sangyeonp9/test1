---
name: photo-blog
description: photo-blog/photos 폴더에 올라온 사진 중 아직 글이 없는 사진을 찾아 한국어 블로그 글을 써서 photo-blog/blog 폴더에 저장합니다. 사용자가 "새 사진 글 써줘", "블로그 글 써줘", "사진 블로그" 등을 요청하면 사용하세요.
---

# 사진 → 블로그 글 작성

## 1. 글이 없는 사진 찾기
- `photo-blog/photos/` 아래의 사진 파일(jpg, jpeg, png, gif, webp, heic, heif)을 하위 폴더까지 모두 찾습니다. `.gitkeep` 등 숨김 파일은 제외합니다.
- 각 사진의 글 경로는 `photo-blog/blog/<photos 기준 하위 폴더>/<사진 파일 이름에서 확장자 뺀 것>.md` 입니다.
  - 예: `photos/제주여행/성산일출봉.jpg` → `blog/제주여행/성산일출봉.md`
- 글 파일이 이미 있는 사진은 건너뜁니다.
- 사용자가 특정 사진을 지정했다면 그 사진만 처리합니다. 이미 글이 있으면 다시 쓸지 먼저 물어봅니다.
- 처리할 사진이 없으면 "새 사진이 없습니다"라고 알리고, GitHub에 사진을 올리는 방법(`photo-blog/README.md`)을 짧게 안내합니다.

## 2. 사진 보기
- Read 도구로 사진을 열어 내용을 확인합니다.
- HEIC/HEIF 사진은 Read로 볼 수 없으므로 먼저 JPEG로 변환합니다. 변환본은 저장소 밖 임시 폴더에 두고 커밋하지 않습니다.
  ```bash
  pip install -q pillow pillow-heif
  python3 -c "import sys; from PIL import Image; from pillow_heif import register_heif_opener; register_heif_opener(); Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90)" 입력.heic 출력.jpg
  ```
  변환에 실패하면 그 사진은 건너뛰고, 사용자에게 JPG로 다시 올려 달라고 알립니다.

## 3. 글 쓰기
- `photo-blog/prompt.md`의 스타일 가이드를 그대로 따릅니다. (사용자가 수정할 수 있는 파일이므로 매번 새로 읽습니다.)
- 파일 맨 위에 사진을 표시하는 줄을 넣고, 한 줄 띄운 뒤 글 본문을 씁니다. 경로는 글 파일 위치에서 사진까지의 상대 경로이며, 공백·한글이 있어도 깨지지 않도록 `< >`로 감쌉니다.
  - 예: `blog/제주여행/성산일출봉.md` 안에는 `![성산일출봉.jpg](<../../photos/제주여행/성산일출봉.jpg>)`

## 4. 저장과 보고
- 모든 글을 저장한 뒤 한 번에 커밋하고 푸시합니다. 커밋 메시지 예: `Add blog posts for 3 photos`
- 채팅 답변에는 사진별로 **완성된 글 전문**을 보여 줍니다. 사용자가 바로 복사해 블로그에 붙여 넣을 수 있게 하기 위해서입니다.
- 마지막에 처리한 사진 수와 건너뛴 사진(이유 포함)을 짧게 정리합니다.
