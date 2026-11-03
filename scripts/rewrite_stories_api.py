#!/usr/bin/env python3
"""Viết lại các chương Âm Dương Kí theo giọng văn trong stories/STYLE_GUIDE.md.

Chạy bằng API key Anthropic của bạn (tính theo token API, không đụng quota
gói Claude). Cần:  pip install anthropic   và   export ANTHROPIC_API_KEY=sk-ant-...

Ví dụ:
  python3 scripts/rewrite_stories_api.py --book an-hong-ngai --only 01   # thử 1 chương
  python3 scripts/rewrite_stories_api.py --book an-hong-ngai             # cả cuốn
  python3 scripts/rewrite_stories_api.py                                 # cả 4 cuốn
  python3 scripts/rewrite_stories_api.py --out-dir /tmp/ban-nhap         # không ghi đè

Mặc định ghi đè file .md gốc (git giữ lịch sử, xem diff bằng `git diff`).
Tiến độ lưu trong scripts/.rewrite_state.json nên chạy lại sẽ bỏ qua chương đã xong;
dùng --force để viết lại.
"""
import argparse
import json
import sys
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent.parent
STORIES = ROOT / "stories"
STATE_FILE = Path(__file__).resolve().parent / ".rewrite_state.json"

INSTRUCTIONS = """Bạn là biên tập viên văn học, viết lại các chương của bộ truyện kinh dị trinh thám \
"Âm Dương Kí" cho đúng giọng văn của tác giả.

Nhiệm vụ: nhận một chương (Markdown) và viết lại TOÀN BỘ chương đó theo đúng hướng dẫn giọng văn \
bên dưới. Giữ nguyên cốt truyện, manh mối, sự kiện, tên riêng, mốc thời gian, POV và nội dung các \
dòng in đậm quan trọng. Thay đổi cách kể: câu chảy liền, đậm chất đời thường, nhiều cảm xúc, bỏ \
lối liệt kê và lối mỗi câu một dòng.

Chỉ trả về nội dung chương đã viết lại dưới dạng Markdown, không thêm lời dẫn, ghi chú hay tiêu đề \
mà bản gốc không có."""


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"done": []}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def build_system():
    style = (STORIES / "STYLE_GUIDE.md").read_text(encoding="utf-8")
    bible = (STORIES / "EDITORIAL_CHARACTER_BIBLE.md").read_text(encoding="utf-8")
    text = (
        f"{INSTRUCTIONS}\n\n<huong_dan_giong_van>\n{style}\n</huong_dan_giong_van>\n\n"
        f"<ho_so_nhan_vat>\n{bible}\n</ho_so_nhan_vat>"
    )
    # Phần system giống hệt nhau cho mọi chương -> cache để đỡ tiền input.
    return [{"type": "text", "text": text, "cache_control": {"type": "ephemeral"}}]


def rewrite_chapter(client, args, system, book, chapter, prev_tail):
    src = STORIES / chapter["file"]
    original = src.read_text(encoding="utf-8")
    context = (
        f"Truyện: {book['title']} ({book.get('period', '')}, POV: {book.get('pov', '')})\n"
        f"Chương {chapter['id']}: {chapter['title']} ({chapter.get('date', '')})\n"
    )
    if prev_tail:
        context += (
            "\nĐoạn cuối chương trước (đã viết lại), để giữ mạch văn liền:\n"
            f"<chuong_truoc>\n{prev_tail}\n</chuong_truoc>\n"
        )
    user = f"{context}\n<chuong_goc>\n{original}\n</chuong_goc>\n\nHãy viết lại chương này."

    with client.beta.messages.stream(
        model=args.model,
        max_tokens=64000,
        thinking={"type": "adaptive"},
        output_config={"effort": args.effort},
        system=system,
        messages=[{"role": "user", "content": user}],
        betas=["server-side-fallback-2026-07-01"],
        extra_body={"fallbacks": "default"},
    ) as stream:
        if args.verbose:
            for event in stream:
                if event.type == "content_block_delta" and getattr(event.delta, "type", "") == "text_delta":
                    print(event.delta.text, end="", flush=True)
            print()
        msg = stream.get_final_message()

    if msg.stop_reason == "refusal":
        raise RuntimeError(f"model từ chối (refusal): {getattr(msg, 'stop_details', None)}")
    if msg.stop_reason == "max_tokens":
        raise RuntimeError("bị cắt vì hết max_tokens, không ghi file")

    text = "".join(b.text for b in msg.content if b.type == "text").strip() + "\n"
    if len(text) < 0.5 * len(original):
        raise RuntimeError(f"bản mới quá ngắn ({len(text)} vs {len(original)} ký tự), không ghi file")

    dest = Path(args.out_dir) / chapter["file"] if args.out_dir else src
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")

    u = msg.usage
    print(
        f"  ✓ {chapter['file']}  {len(original)} → {len(text)} ký tự | "
        f"in {u.input_tokens} (cache đọc {u.cache_read_input_tokens or 0}, "
        f"ghi {u.cache_creation_input_tokens or 0}) out {u.output_tokens}"
    )
    return text, u


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--book", help="id cuốn: p201, ma-ki-su, an-hong-ngai, huyet-chung (mặc định: tất cả)")
    p.add_argument("--only", nargs="*", help="chỉ các chương có id này, vd: 01 02")
    p.add_argument("--model", default="claude-opus-5-5")
    p.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
    p.add_argument("--out-dir", help="ghi ra thư mục khác thay vì ghi đè file gốc")
    p.add_argument("--force", action="store_true", help="viết lại cả chương đã đánh dấu xong")
    p.add_argument("--verbose", action="store_true", help="in chữ ra màn hình khi đang viết")
    args = p.parse_args()

    catalog = json.loads((STORIES / "data" / "catalog.json").read_text(encoding="utf-8"))
    books = [b for b in catalog["books"] if not args.book or b["id"] == args.book]
    if not books:
        sys.exit(f"Không thấy cuốn '{args.book}'")

    client = anthropic.Anthropic()  # đọc ANTHROPIC_API_KEY
    system = build_system()
    state = load_state()
    total_in = total_out = 0

    for book in books:
        print(f"\n== {book['title']} ==")
        prev_tail = ""
        for ch in book["chapters"]:
            if args.only and ch["id"] not in args.only:
                continue
            path = STORIES / ch["file"]
            if not path.exists():
                print(f"  - bỏ qua {ch['file']} (chưa có file)")
                continue
            if ch["file"] in state["done"] and not args.force:
                print(f"  - đã xong {ch['file']}")
                prev_tail = path.read_text(encoding="utf-8")[-2500:]
                continue
            try:
                text, usage = rewrite_chapter(client, args, system, book, ch, prev_tail)
            except anthropic.RateLimitError:
                print("  ! Bị giới hạn tốc độ (429). Đợi vài phút rồi chạy lại, script sẽ làm tiếp.")
                sys.exit(1)
            except (anthropic.APIError, RuntimeError) as e:
                print(f"  ! Lỗi ở {ch['file']}: {e}")
                continue
            prev_tail = text[-2500:]
            total_in += usage.input_tokens + (usage.cache_read_input_tokens or 0)
            total_out += usage.output_tokens
            if not args.out_dir:
                state["done"].append(ch["file"])
                save_state(state)

    print(f"\nTổng: ~{total_in:,} token input, {total_out:,} token output")


if __name__ == "__main__":
    main()
