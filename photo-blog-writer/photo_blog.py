#!/usr/bin/env python3
"""
사진 폴더 감시 → 블로그 글 자동 작성 (Mac + Claude Code)

photos/ 폴더(하위 폴더 포함)에 새 사진이 들어오면 Claude Code(`claude -p`)를
실행해 블로그 글을 쓰고 blog/ 폴더에 .md 파일로 저장합니다.

실행:   python3 photo_blog.py
옵션:   --include-existing   이미 폴더에 있던 사진도 처리
        --once               지금 있는 새 사진만 처리하고 종료
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# ───────────── 설정 (필요하면 바꾸세요) ─────────────
BASE_DIR = Path(__file__).resolve().parent
PHOTO_DIR = BASE_DIR / "photos"          # 사진을 넣는 폴더
BLOG_DIR = BASE_DIR / "blog"             # 블로그 글이 저장되는 폴더
PROMPT_FILE = BASE_DIR / "prompt.md"     # 글쓰기 지시문 (말투·형식 수정은 여기서)
WORK_DIR = BASE_DIR / ".work"            # Claude에게 보낼 변환본 임시 폴더
STATE_FILE = BASE_DIR / ".processed.json"  # 이미 처리한 사진 기록

CHECK_INTERVAL = 5        # 몇 초마다 폴더를 확인할지
CLAUDE_TIMEOUT = 300      # 글 하나당 최대 대기 시간(초)
MAX_IMAGE_SIZE = 1568     # 긴 변 기준 축소 크기(px)
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}
CLAUDE_READABLE = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
# ─────────────────────────────────────────────────


def log(msg: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def file_hash(path: Path) -> str:
    """사진 내용으로 고유값 계산 → 파일 이름을 바꾸거나 하위 폴더로 옮겨도 다시 처리하지 않음."""
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_state() -> dict | None:
    if not STATE_FILE.exists():
        return None
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def find_photos() -> list[Path]:
    photos = []
    for p in PHOTO_DIR.rglob("*"):
        rel_parts = p.relative_to(PHOTO_DIR).parts
        if any(part.startswith(".") for part in rel_parts):
            continue  # 숨김 파일(.DS_Store 등) 제외
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            photos.append(p)
    return sorted(photos)


def prepare_image(src: Path, digest: str) -> Path | None:
    """Mac 기본 도구 sips로 JPEG 변환 + 크기 축소 (아이폰 HEIC 사진 대응)."""
    WORK_DIR.mkdir(exist_ok=True)
    out = WORK_DIR / f"{digest[:12]}.jpg"
    if shutil.which("sips"):
        result = subprocess.run(
            ["sips", "-s", "format", "jpeg", "-Z", str(MAX_IMAGE_SIZE), str(src), "--out", str(out)],
            capture_output=True, text=True,
        )
        if result.returncode == 0 and out.exists():
            return out
    # sips가 없거나 실패하면 원본 사용 (Claude가 읽을 수 있는 형식일 때만)
    if src.suffix.lower() in CLAUDE_READABLE:
        out = WORK_DIR / f"{digest[:12]}{src.suffix.lower()}"
        shutil.copyfile(src, out)
        return out
    return None


def build_prompt(image: Path, original: Path) -> str:
    template = PROMPT_FILE.read_text(encoding="utf-8")
    folder = original.parent.relative_to(PHOTO_DIR).as_posix()
    return (
        template.replace("{image}", image.relative_to(BASE_DIR).as_posix())
        .replace("{filename}", original.name)
        .replace("{folder}", folder if folder != "." else "(없음)")
    )


def run_claude(prompt: str) -> str:
    result = subprocess.run(
        ["claude", "-p", prompt, "--allowedTools", "Read", "--output-format", "text"],
        cwd=BASE_DIR, capture_output=True, text=True, timeout=CLAUDE_TIMEOUT,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip() or "claude 실행 실패")
    text = result.stdout.strip()
    # 글 앞에 붙은 안내 문장이 있으면 첫 제목(#)부터만 사용
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("# "):
            return "\n".join(lines[i:]).strip()
    return text


def save_post(original: Path, body: str) -> Path:
    BLOG_DIR.mkdir(exist_ok=True)
    base_name = f"{datetime.now():%Y-%m-%d}_{original.stem}"
    out = BLOG_DIR / f"{base_name}.md"
    n = 2
    while out.exists():
        out = BLOG_DIR / f"{base_name}_{n}.md"
        n += 1
    rel_image = Path("..") / original.relative_to(BASE_DIR)
    out.write_text(f"![{original.name}](<{rel_image.as_posix()}>)\n\n{body}\n", encoding="utf-8")
    return out


def notify(title: str, message: str) -> None:
    """Mac 알림 센터에 알림 표시 (실패해도 무시)."""
    if not shutil.which("osascript"):
        return
    safe = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
    subprocess.run(
        ["osascript", "-e", f'display notification "{safe(message)}" with title "{safe(title)}"'],
        capture_output=True,
    )


def process(photo: Path, digest: str) -> bool:
    log(f"✍️  글 작성 중: {photo.relative_to(PHOTO_DIR)}")
    image = prepare_image(photo, digest)
    if image is None:
        log("   ⚠️  이 형식은 변환할 수 없어 건너뜁니다.")
        return False
    try:
        body = run_claude(build_prompt(image, photo))
        out = save_post(photo, body)
    except subprocess.TimeoutExpired:
        log("   ⚠️  시간 초과로 실패했습니다.")
        return False
    except Exception as e:  # noqa: BLE001
        log(f"   ⚠️  실패: {e}")
        return False
    finally:
        image.unlink(missing_ok=True)
    log(f"   ✅ 저장 완료: {out.relative_to(BASE_DIR)}")
    notify("블로그 글 완성", out.name)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="사진 → 블로그 글 자동 작성")
    parser.add_argument("--include-existing", action="store_true", help="이미 있던 사진도 처리")
    parser.add_argument("--once", action="store_true", help="한 번만 확인하고 종료")
    args = parser.parse_args()

    if not shutil.which("claude"):
        sys.exit("❌ claude 명령을 찾을 수 없습니다. Claude Code를 먼저 설치하세요 (README 참고).")
    if not PROMPT_FILE.exists():
        sys.exit(f"❌ 지시문 파일이 없습니다: {PROMPT_FILE.name}")

    PHOTO_DIR.mkdir(exist_ok=True)
    BLOG_DIR.mkdir(exist_ok=True)

    state = load_state()
    if state is None:
        state = {"done": []}
        if not args.include_existing:
            existing = find_photos()
            state["done"] = [file_hash(p) for p in existing]
            if existing:
                log(f"기존 사진 {len(existing)}장은 건너뜁니다. (처리하려면 --include-existing)")
        save_state(state)

    done = set(state["done"])
    failed: set[str] = set()       # 이번 실행에서 실패한 사진 (재시작하면 다시 시도)
    last_size: dict[Path, int] = {}

    log(f"📂 감시 시작: {PHOTO_DIR}")
    log("   사진을 넣으면 자동으로 글을 씁니다. 종료하려면 Control + C")

    try:
        while True:
            for photo in find_photos():
                try:
                    size = photo.stat().st_size
                except FileNotFoundError:
                    continue
                # 복사가 끝났는지 확인: 크기가 이전 확인 때와 같아야 처리
                if size == 0 or last_size.get(photo) != size:
                    last_size[photo] = size
                    if not args.once:
                        continue
                digest = file_hash(photo)
                if digest in done or digest in failed:
                    continue
                if process(photo, digest):
                    done.add(digest)
                    state["done"] = sorted(done)
                    save_state(state)
                else:
                    failed.add(digest)
            if args.once:
                break
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        print()
        log("👋 종료합니다.")


if __name__ == "__main__":
    main()
