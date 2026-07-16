from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "android-learning" / "data" / "lessons" / "c"

basic_replacements = {
    "c02.json": {
        'println("call API")': 'println(\\"call API\\")',
        'println("flow created")': 'println(\\"flow created\\")',
        'println("request")': 'println(\\"request\\")',
        'log("completed")': 'log(\\"completed\\")',
        'log("cancelled")': 'log(\\"cancelled\\")',
        'log("failed", cause)': 'log(\\"failed\\", cause)',
    },
    "c03.json": {
        'val query: String = ""': 'val query: String = \\"\\"',
    },
    "c04.json": {
        'println("A: $it")': 'println(\\"A: $it\\")',
        'println("B: $it")': 'println(\\"B: $it\\")',
        'events.emit("hello")': 'events.emit(\\"hello\\")',
        'logger.warn("effect buffer full")': 'logger.warn(\\"effect buffer full\\")',
        'UiEffect.ShowSnackbar("Saved")': 'UiEffect.ShowSnackbar(\\"Saved\\")',
    },
}

for filename, mapping in basic_replacements.items():
    path = BASE / filename
    text = path.read_text()
    for old, new in mapping.items():
        text = text.replace(old, new)

    if filename == "c02.json" and "Điểm quan trọng về ownership của cold Flow" not in text:
        old = "Hai collector không tự chia sẻ result. Mỗi collection chạy block flow riêng, có local variable riêng và có thể tạo side effect riêng. Đây là semantics quan trọng nhất khi repository trả cold Flow gọi network: UI collect ở hai nơi có thể tạo hai request."
        new = old + " Điểm quan trọng về ownership của cold Flow là object Flow chỉ mô tả recipe, còn execution thuộc từng collector. Vì thế repository không thể giả định rằng trả về cùng một Flow instance đồng nghĩa dùng chung request hoặc cache. Khi màn hình, analytics và một component phụ cùng collect, mỗi collector có thể mở một call chain, đăng ký observer hoặc đọc tài nguyên riêng. Trước khi share upstream, cần xác định kết quả có thật sự dùng chung được không, scope nào sở hữu cache, khi không còn subscriber thì producer dừng ngay hay trì hoãn, và lỗi của một consumer có được ảnh hưởng consumer khác hay không. stateIn hoặc shareIn chỉ giải quyết việc chia sẻ execution trong một scope; chúng không tự chọn freshness policy, cache invalidation hay quyền sở hữu dữ liệu. Với network one-shot, suspend function kết hợp cache thường dễ hiểu hơn Flow phát đúng một item. Với Room hoặc DataStore, cold Flow tự nhiên hơn vì mỗi collection đăng ký observation và cancellation unregister observer."
        text = text.replace(old, new)

    if filename == "c04.json" and "Điểm cốt lõi khi dùng SharedFlow trong sản phẩm" not in text:
        old = "MutableSharedFlow tồn tại độc lập collector. Producer có thể emit bất cứ lúc nào; subscriber chỉ nhận theo replay và thời điểm subscription. Khác cold Flow, thêm subscriber không chạy lại producer block. Khác Channel point-to-point, SharedFlow broadcast cùng emission tới nhiều subscriber active."
        new = old + " Điểm cốt lõi khi dùng SharedFlow trong sản phẩm là phải mô tả rõ delivery contract thay vì chỉ nói đây là event stream. replay quyết định subscriber mới nhìn lại bao nhiêu item; extraBufferCapacity quyết định producer có thể đi trước subscriber active bao xa; onBufferOverflow quyết định suspend, bỏ item cũ hay bỏ item mới khi queue đầy. Các lựa chọn này tác động trực tiếp tới correctness. Progress hoặc telemetry có thể chấp nhận drop, nhưng payment command, logout bắt buộc hoặc navigation quan trọng thường không được phép mất âm thầm. SharedFlow cũng không lưu một current state có thể đọc đồng bộ như StateFlow, nên collector đến muộn không thể tự dựng lại UI nếu replay bằng 0. Với socket event, owner cần kết hợp snapshot bền vững và event delta, xử lý duplicate/out-of-order, rồi reduce thành StateFlow cho UI; expose raw SharedFlow trực tiếp thường đẩy quá nhiều trách nhiệm đồng bộ xuống từng màn hình."
        text = text.replace(old, new)

    path.write_text(text)

print("Applied idempotent JSON escaping and depth repairs")
