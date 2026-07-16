from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "android-learning" / "data" / "lessons" / "c"

replacements = {
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
        'MutableStateFlow tồn tại và giữ value ngay khi được tạo, không cần collector để bắt đầu producer. Gán value cập nhật state holder; collector chỉ quan sát. Đây là khác biệt nền tảng với cold Flow, nơi producer chạy theo mỗi collection.': 'MutableStateFlow tồn tại và giữ value ngay khi được tạo, không cần collector để bắt đầu producer. Gán value cập nhật state holder; collector chỉ quan sát. Đây là khác biệt nền tảng với cold Flow, nơi producer chạy theo mỗi collection. State holder vì thế cần một owner có lifecycle rõ, thường là ViewModel hoặc repository sống theo session. Nếu tạo MutableStateFlow trong composable hoặc trong một function được gọi lại nhiều lần, bạn có thể vô tình tạo nhiều nguồn state độc lập, khiến UI quan sát object này trong khi producer đang cập nhật object khác. StateFlow không tự giải quyết ownership; nó chỉ cung cấp primitive giữ latest value và broadcast update. Thiết kế production phải trả lời ai được phép ghi, state sống bao lâu, khi owner bị hủy thì upstream nào dừng, và collector mới cần nhận trạng thái ban đầu nào. Với stateIn, những câu hỏi này còn gắn với SharingStarted, initialValue và scope được chọn. Chọn scope quá dài có thể giữ network/database observation không cần thiết; chọn scope quá ngắn làm upstream restart liên tục và mất lợi ích chia sẻ.',
        'Collector mới không nhận toàn bộ lịch sử 0,1,2; nó nhận current value 2 rồi các update tiếp theo. Vì vậy StateFlow phù hợp state, không phù hợp audit/event log.': 'Collector mới không nhận toàn bộ lịch sử 0,1,2; nó nhận current value 2 rồi các update tiếp theo. Vì vậy StateFlow phù hợp state, không phù hợp audit/event log. Latest value phải đủ để UI khôi phục màn hình tại thời điểm hiện tại mà không cần biết toàn bộ chuỗi sự kiện trước đó. Ví dụ SearchUiState cần query, loading, items và error hiện hành; collector mới chỉ cần snapshot này để render. Ngược lại, các occurrence như mở màn hình, hiển thị snackbar hoặc gửi analytics không thể suy ra an toàn chỉ từ latest value, bởi cùng một event có thể cần được xử lý đúng một lần và không nên tự động replay sau configuration change. Khi review một StateFlow, hãy kiểm tra invariant của snapshot: các field có thể tồn tại đồng thời không, loading và error có mâu thuẫn không, list có immutable không, và state transition nào được phép. Một StateFlow tốt không chỉ là data class nhiều field; nó là state machine có owner, transition và lifecycle contract rõ ràng.',
    },
    "c04.json": {
        'println("A: $it")': 'println(\\"A: $it\\")',
        'println("B: $it")': 'println(\\"B: $it\\")',
        'events.emit("hello")': 'events.emit(\\"hello\\")',
        'logger.warn("effect buffer full")': 'logger.warn(\\"effect buffer full\\")',
        'UiEffect.ShowSnackbar("Saved")': 'UiEffect.ShowSnackbar(\\"Saved\\")',
    },
}

for filename, mapping in replacements.items():
    path = BASE / filename
    text = path.read_text()
    for old, new in mapping.items():
        text = text.replace(old, new)
    path.write_text(text)

print("Applied targeted JSON string escaping and depth repairs")
