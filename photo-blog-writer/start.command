#!/bin/bash
# Finder에서 더블클릭하면 사진 감시를 시작합니다.
cd "$(dirname "$0")" || exit 1
python3 photo_blog.py
echo
read -n 1 -s -r -p "아무 키나 누르면 창을 닫습니다."
