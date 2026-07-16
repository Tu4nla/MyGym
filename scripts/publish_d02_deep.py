import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_ID = "d02"
LESSON_PATH = DATA / "lessons" / "d" / "d02.json"
REPORT_PATH = ROOT / "validation-d02.json"


def paragraph(text):
    return {"type": "paragraph", "content": text}


def bullets(items):
    return {"type": "list", "items": items}


def code(label, text):
    return {"type": "code", "language": "kotlin", "label": label, "content": text}


def callout(title, text, variant="info"):
    return {"type": "callout", "variant": variant, "title": title, "content": text}


def table(headers, rows):
    return {"type": "table", "headers": headers, "rows": rows}


sections = [
    {
        "id": "objectives",
        "title": "1. Mục tiêu bài học",
        "blocks": [
            paragraph("State là dữ liệu có thể thay đổi theo thời gian và làm thay đổi UI hoặc hành vi của màn hình. Trong Compose, bài toán không dừng ở việc đặt một giá trị vào mutableStateOf; developer phải xác định owner, lifetime, mutation boundary, restoration policy và cách runtime quan sát read/write. Sau bài này, người học phải giải thích được vì sao UI cập nhật, vì sao đôi khi không cập nhật và cách thiết kế state contract có thể kiểm thử."),
            paragraph("Mục tiêu thực hành là xây được Composable stateless, stateful wrapper, immutable UiState và ViewModel expose StateFlow; đồng thời phân biệt local presentation state với screen business state, derived state với source of truth, state với one-time event và configuration change với process death."),
            bullets(["Hiểu Snapshot State, read tracking, invalidation và mutation policy.", "Thiết kế state hoisting theo value-down/event-up.", "Chọn remember, rememberSaveable, SavedStateHandle, StateFlow hoặc repository đúng lifetime.", "Tránh duplicate source of truth, mutation ẩn và lost update.", "Phân tích form, search và chat theo product contract."])
        ]
    },
    {
        "id": "prerequisites",
        "title": "2. Kiến thức nền",
        "blocks": [
            paragraph("Bài này kế thừa D01 về composition, recomposition, slot table, identity và snapshot. Người học cũng cần hiểu immutable data, data class copy, Coroutine, StateFlow, ViewModel và lifecycle collection. Compose state và Flow đều observable nhưng phục vụ boundary khác nhau: Snapshot State tích hợp trực tiếp với composition, còn Flow mô tả stream bất đồng bộ cần được collect thành state ở UI boundary."),
            paragraph("Một var Kotlin thông thường không phải observable. Thay đổi field có thể xảy ra đúng về mặt ngôn ngữ nhưng runtime không biết scope nào đã đọc nó, do đó không có invalidation. Đây là nền tảng để hiểu vì sao mutable collection sửa tại chỗ hoặc object mutable truyền cùng reference thường tạo bug UI khó đoán.")
        ]
    },
    {
        "id": "terminology",
        "title": "3. Định nghĩa và chú giải thuật ngữ",
        "blocks": [
            paragraph("State là giá trị hiện tại có thể được đọc lại; event là một occurrence như click, navigation hoặc snackbar. MutableState là state holder tích hợp Snapshot. State hoisting là chuyển ownership lên common owner thấp nhất cần đọc hoặc ghi state. Single source of truth là quy ước mỗi dữ liệu business chỉ có một nguồn có thẩm quyền tại một thời điểm."),
            table(["Thuật ngữ", "Ý nghĩa"], [["Snapshot State", "State có version và read/write tracking."], ["Mutation policy", "Quy tắc xác định write có thật sự là thay đổi."], ["Derived state", "Giá trị tính từ state khác, không phải nguồn độc lập."], ["State holder", "Object gom state cùng logic UI với lifetime rõ ràng."], ["UiState", "Mô hình immutable mô tả trạng thái render của màn hình."], ["State hoisting", "Value đi xuống, event đi lên owner."], ["Restoration", "Khôi phục dữ liệu sau recreation hoặc process death."]])
        ]
    },
    {
        "id": "internal-mechanism",
        "title": "4. Cơ chế hoạt động bên trong",
        "blocks": [
            paragraph("Khi Composable đọc State.value, Snapshot system ghi nhận RecomposeScope hiện tại phụ thuộc vào state đó. Khi state được ghi và mutation policy xác định giá trị mới khác giá trị cũ, scope đã đọc bị invalid. Recomposer gom nhiều invalidation, lên lịch theo frame clock, chạy lại scope cần thiết rồi apply change xuống UI tree. Read placement vì vậy ảnh hưởng trực tiếp phạm vi recomposition."),
            paragraph("Snapshot dùng record có version để cung cấp góc nhìn nhất quán. Mutable snapshot có thể ghi riêng rồi apply vào global snapshot; nếu hai snapshot sửa cùng state, runtime phải merge hoặc báo conflict. Đây là mô hình sâu hơn một field mutable thông thường và là lý do Snapshot State có thể theo dõi mutation trên nhiều thread nhưng vẫn yêu cầu developer giữ business invariant rõ ràng."),
            paragraph("mutableStateOf mặc định dùng structuralEqualityPolicy: write một value equals với value hiện tại thường không invalid. referentialEqualityPolicy chỉ xem reference khác là thay đổi; neverEqualPolicy xem mọi write là thay đổi. Chọn sai policy có thể làm UI thiếu cập nhật hoặc recomposition thừa."),
            code("Read và write Snapshot State", "@Composable\nfun Counter() {\n    var count by remember { mutableIntStateOf(0) }\n    Button(onClick = { count++ }) {\n        Text(\"Count: $count\")\n    }\n}")
        ]
    },
    {
        "id": "purpose",
        "title": "5. Mục đích của kỹ thuật",
        "blocks": [
            paragraph("State management biến UI thành hàm của dữ liệu hiện tại thay vì tập lệnh cập nhật widget rời rạc. Khi loading, content, validation và error được mô hình hóa thành state hợp lệ, developer giảm khả năng rơi vào tổ hợp vô nghĩa như vừa loading vừa submit enabled hoặc hiển thị dữ liệu cũ với error mới mà không có chủ đích."),
            paragraph("State hoisting còn tạo Composable tái sử dụng và testable. Child chỉ nhận value cùng callback nên không cần biết ViewModel, repository hay navigation owner. Parent có thể thay local state bằng ViewModel state mà không đổi contract hiển thị của child.")
        ]
    },
    {
        "id": "problems-solved",
        "title": "6. Vấn đề kỹ thuật được giải quyết",
        "blocks": [
            paragraph("Thiết kế state đúng giải quyết UI không cập nhật vì var thường, hai nơi cùng giữ query rồi lệch nhau, child tự gọi repository, derived value bị lưu song song, process recreation làm mất input và event bị replay như state. Điểm chung của các lỗi này là ownership hoặc lifetime không rõ."),
            callout("Invariant", "Mỗi state phải có owner, lifetime, mutation API, observation contract và restoration policy rõ ràng. Nếu không trả lời được năm câu hỏi này, state design chưa hoàn chỉnh.", "purpose")
        ]
    },
    {
        "id": "when-to-use",
        "title": "7. Dấu hiệu cần dùng",
        "blocks": [
            paragraph("Dùng observable state khi UI phải thay đổi theo user input, network, database, timer hoặc kết quả tính toán; khi nhiều Composable cần đọc cùng dữ liệu; khi cần giữ dữ liệu qua recomposition; hoặc khi logic transition cần test độc lập. Local MutableState phù hợp state thuần UI nhỏ, còn ViewModel phù hợp screen state có business dependency hoặc cần sống qua configuration change."),
            bullets(["Expanded, selected tab, focus và animation thường là local UI state.", "Loading, content, error và filter của màn hình thường do screen owner giữ.", "Session và dữ liệu app-wide thuộc repository hoặc application/session owner."])
        ]
    },
    {
        "id": "when-not-to-use",
        "title": "8. Khi không nên dùng",
        "blocks": [
            paragraph("Không tạo MutableState cho hằng số, giá trị chỉ tính một lần hoặc dữ liệu không ảnh hưởng UI. Không mirror StateFlow thành MutableState chỉ để tiện đọc, vì hai source of truth có thể lệch. Không đưa mọi state vào ViewModel: scroll, focus, ripple hoặc animation nội bộ thường nên ở UI. Không dùng state để thay thế command một lần nếu chưa có consumption contract."),
            paragraph("Không lưu derived value độc lập khi có thể tính từ source. Ví dụ isSubmitEnabled nên được tính từ email, password và loading thay vì có một biến mutable riêng phải đồng bộ ở mọi nhánh.")
        ]
    },
    {
        "id": "product-requirements",
        "title": "9. Yêu cầu sản phẩm cụ thể",
        "blocks": [
            paragraph("Form tạo bài đăng phải giữ nội dung khi recomposition và xoay màn hình, hiển thị lỗi đúng field, không xóa draft khi submit thất bại và chỉ reset khi server xác nhận thành công. Search phải giữ query/filter nhất quán, không để request cũ ghi đè kết quả mới. Chat phải phân biệt draft, pending message, acknowledged message và retry state."),
            callout("Requirement — form", "Draft text nhỏ có thể restore; URI media hoặc metadata lớn phải ở repository, không nhét toàn bộ vào saved state.", "requirement"),
            callout("Requirement — search", "Query mới phải trở thành source of truth; result phải gắn với generation/query tương ứng để chống stale response.", "requirement"),
            callout("Requirement — chat", "Optimistic item phải có clientId ổn định để acknowledgement cập nhật đúng item thay vì append duplicate.", "requirement")
        ]
    },
    {
        "id": "analysis",
        "title": "10. Phân tích dependency, error policy, lifecycle và resource limits",
        "blocks": [
            paragraph("Dependency: local presentation state không nên gọi repository trực tiếp. Screen owner nhận use case hoặc repository, chuyển domain result thành immutable UiState và expose event API. Error renderable là state; error chỉ phục vụ logging không nhất thiết nằm trong UiState. Retry phải là event tạo transition rõ ràng thay vì Composable tự lặp request."),
            paragraph("Lifecycle: remember sống khi group còn identity trong composition. rememberSaveable có thể restore dữ liệu saveable qua recreation. ViewModel sống qua configuration change nhưng không mặc định sống qua process death. SavedStateHandle phục hồi key nhỏ; dữ liệu lớn nên reload từ database/network."),
            paragraph("Resource limits: không lưu Bitmap, danh sách hàng nghìn item, socket, repository hoặc object graph vào Bundle/SavedStateHandle. Việc copy UiState có allocation nhưng thường đáng đổi lấy invariant rõ; chỉ chia state hoặc dùng persistent collection khi profiling chứng minh bottleneck."),
            table(["State", "Owner", "Restoration"], [["Card expanded", "Composable", "remember"], ["Text draft nhỏ", "Composable/ViewModel", "rememberSaveable hoặc SavedStateHandle"], ["Search result", "ViewModel/Repository", "reload/cache"], ["Auth session", "Session owner", "secure persistence"], ["Scroll", "LazyListState", "saveable support"]])
        ]
    },
    {
        "id": "minimal-code",
        "title": "11. Ví dụ code tối giản",
        "blocks": [
            paragraph("Stateless Composable nhận value và callback; stateful wrapper quyết định nơi lưu. Cặp API này cho phép preview, test và reuse mà không buộc child phụ thuộc ViewModel."),
            code("Stateless field", "@Composable\nfun NameField(value: String, onValueChange: (String) -> Unit, error: String?) {\n    Column {\n        OutlinedTextField(value, onValueChange, isError = error != null)\n        error?.let { Text(it) }\n    }\n}"),
            code("Stateful wrapper", "@Composable\nfun ProfileEditor() {\n    var name by rememberSaveable { mutableStateOf(\"\") }\n    val error = name.takeIf { it.length > 50 }?.let { \"Tối đa 50 ký tự\" }\n    NameField(name, { name = it }, error)\n}")
        ]
    },
    {
        "id": "upzi-case",
        "title": "12. Ví dụ thực tế Upzi hoặc dự án liên quan",
        "blocks": [
            paragraph("Các ví dụ Upzi phải phân biệt dữ kiện đã xác nhận với thiết kế suy luận. confirmed: dự án dùng Compose, ViewModel, Flow/StateFlow và single-activity navigation theo bối cảnh đã cung cấp. inferred: nhiều màn có khả năng dùng immutable screen state nhưng shape cụ thể chưa được kiểm chứng. proposed: form post nên dùng PostEditorState và reducer-style events. needs-confirmation: nơi lưu chat draft hiện tại cần xác nhận trước khi kể trong phỏng vấn."),
            callout("confirmed", "Compose, ViewModel và Flow/StateFlow là các thành phần đã được xác nhận trong bối cảnh Upzi.", "confirmed"),
            callout("inferred", "Search/Job Detail nhiều khả năng có owner cho loading, content và error; implementation cụ thể chưa xác nhận.", "inferred"),
            callout("proposed", "Đề xuất PostEditorState immutable, lưu draft nhỏ bằng SavedStateHandle và media metadata ở repository.", "proposed"),
            callout("needs-confirmation", "Cần xác nhận draft chat có persistence local hay chỉ sống trong ViewModel.", "needs-confirmation"),
            code("Immutable screen state", "data class SearchUiState(\n    val query: String = \"\",\n    val jobs: List<JobUi> = emptyList(),\n    val loading: Boolean = false,\n    val error: String? = null\n)")
        ]
    },
    {
        "id": "alternatives",
        "title": "13. Phương án thay thế",
        "blocks": [
            paragraph("Local MutableState phù hợp UI state nhỏ; StateFlow trong ViewModel phù hợp screen/business state; plain state holder phù hợp logic UI tái sử dụng; SavedStateHandle phù hợp key nhỏ cần process restoration; repository observable state phù hợp nguồn dữ liệu app-wide. Không có một API đúng cho mọi lifetime."),
            table(["Phương án", "Ưu điểm", "Giới hạn"], [["MutableState", "Tích hợp Compose trực tiếp", "Gắn composition nếu dùng local"], ["StateFlow", "Tốt cho ViewModel và stream", "Cần collect theo lifecycle"], ["Plain holder", "Tách logic UI", "Phải tự định nghĩa observation"], ["SavedStateHandle", "Restore key nhỏ", "Giới hạn kích thước"], ["Repository state", "Chia sẻ app-wide", "Không chứa presentation-only state"]])
        ]
    },
    {
        "id": "tradeoffs",
        "title": "14. Lý do lựa chọn và trade-off",
        "blocks": [
            paragraph("Một UiState lớn cho snapshot nhất quán và reducer đơn giản nhưng có thể khiến nhiều consumer nhận update. Nhiều Flow nhỏ giảm phạm vi quan sát nhưng tăng combine boilerplate và nguy cơ đọc tổ hợp trung gian. State hoisting tăng testability nhưng hoist quá cao tạo prop drilling. Common owner thấp nhất thường là điểm cân bằng."),
            paragraph("Immutable copy tạo allocation nhưng làm transition rõ, hỗ trợ atomic update và debug. Với mobile UI, correctness thường quan trọng hơn micro-optimization. Dùng profiler trước khi chuyển sang object mutable hoặc chia state quá nhỏ.")
        ]
    },
    {
        "id": "edge-cases",
        "title": "15. Edge cases",
        "blocks": [
            paragraph("Các edge case quan trọng gồm sửa MutableList tại chỗ mà không ghi state holder, hai coroutine read-copy-write làm mất field, key list không ổn định khiến remembered state đi theo sai item, collect không theo lifecycle giữ upstream hoạt động, remember nằm trong nhánh đổi identity, SavedStateHandle chứa object lớn gây TransactionTooLargeException và server-format TextField mỗi ký tự làm nhảy cursor."),
            code("Atomic StateFlow update", "private val _state = MutableStateFlow(EditorUiState())\n\nfun onTitleChanged(value: String) {\n    _state.update { current -> current.copy(title = value, titleError = null) }\n}")
        ]
    },
    {
        "id": "mistakes",
        "title": "16. Sai lầm thường gặp",
        "blocks": [
            paragraph("Sai lầm phổ biến là dùng var thường trong Composable, truyền MutableState hoặc MutableStateFlow xuống nhiều tầng, expose mutable stream khỏi ViewModel, lưu cả source và derived state, dùng LaunchedEffect để đồng bộ hai state rồi tạo loop, dùng remember như cache business data và giả định ViewModel sống qua process death."),
            table(["Sai", "Hậu quả", "Sửa"], [["var thường", "UI không invalid", "Observable state"], ["Expose mutable", "Nhiều mutation owner", "Expose read-only"], ["Source + derived cùng mutable", "Lệch dữ liệu", "Tính derived"], ["remember business data", "Mất khi rời composition", "ViewModel/repository"], ["Object lớn trong saved state", "Binder limit", "Lưu ID rồi reload"]])
        ]
    },
    {
        "id": "interview-basic",
        "title": "17. Câu hỏi phỏng vấn cơ bản",
        "blocks": [
            paragraph("Câu hỏi cơ bản thường xoay quanh State trong Compose, remember và rememberSaveable, state hoisting, MutableState với recomposition, immutable UiState và khác biệt giữa StateFlow với Snapshot State. Câu trả lời tốt phải nói ownership, lifetime, observation và mutation boundary thay vì chỉ đọc tên API."),
            bullets(["State hoisting là gì?", "remember sống qua những lifecycle nào?", "Vì sao immutable UiState hữu ích?", "StateFlow được collect trong Compose thế nào?", "Khi nào state nên ở ViewModel?"])
        ]
    },
    {
        "id": "interview-deep",
        "title": "18. Câu hỏi xoáy sâu và câu hỏi bẫy",
        "blocks": [
            paragraph("Câu hỏi sâu gồm: vì sao mutableListOf không chắc cập nhật UI; hai coroutine có thể làm lost update thế nào; derivedStateOf khi nào có lợi; một UiState lớn có chắc redraw toàn màn hình không; event có nên nằm trong UiState; process death khác configuration change ra sao; và mutation policy ảnh hưởng invalidation thế nào."),
            callout("Câu bẫy", "Recomposition không đồng nghĩa toàn bộ node redraw. Composition, layout và draw là các phase khác nhau; cần profiler và frame metrics thay vì suy luận từ số lần gọi Composable.", "warning"),
            code("Lost update dễ gặp", "// Không an toàn nếu hai coroutine cùng chạy\nval old = _state.value\n_state.value = old.copy(loading = true)\n\n// Ưu tiên atomic transform\n_state.update { it.copy(loading = true) }")
        ]
    },
    {
        "id": "experience-answer",
        "title": "19. Mẫu trả lời gắn với kinh nghiệm của người học",
        "blocks": [
            paragraph("Trong dự án Compose, tôi ưu tiên immutable UiState do ViewModel sở hữu và expose dưới dạng StateFlow. UI collect theo lifecycle, render state và gửi event ngược lên. State thuần UI như expanded hoặc scroll giữ local; business state như loading, filter và data đặt ở screen owner. Cách này làm source of truth rõ và test transition dễ hơn."),
            paragraph("Khi có nhiều cập nhật đồng thời, tôi dùng MutableStateFlow.update thay vì read-copy-write. Với process death, tôi chỉ lưu ID, query hoặc draft nhỏ trong SavedStateHandle rồi reload từ repository; tôi không lưu danh sách lớn hay object media vào saved state.")
        ]
    },
    {
        "id": "practice",
        "title": "20. Bài tập thực hành",
        "blocks": [
            paragraph("Hãy refactor một TextField tự giữ state thành stateless child và stateful wrapper; viết LoginUiState immutable cùng reducer; tạo derived validation không lưu trùng; viết unit test cho transition; và dùng recomposition counter hoặc profiler để so sánh parent đọc toàn UiState với child đọc state gần nơi sử dụng."),
            code("Reducer-style transition", "sealed interface LoginAction {\n    data class EmailChanged(val value: String) : LoginAction\n    data object Submit : LoginAction\n}\n\nfun reduce(state: LoginUiState, action: LoginAction): LoginUiState = when (action) {\n    is LoginAction.EmailChanged -> state.copy(email = action.value, emailError = null)\n    LoginAction.Submit -> state.copy(loading = true)\n}")
        ]
    },
    {
        "id": "scenario",
        "title": "21. Bài tập tình huống",
        "blocks": [
            paragraph("Thiết kế màn đăng bài gồm text, ảnh/video, upload progress, validation và draft restoration. Xác định owner của từng state, dữ liệu nào saveable, dữ liệu nào ở repository, event nào được replay và invariant khi submit thất bại. Sau đó thiết kế chat optimistic với clientId, pending, acknowledgement, retry và chống duplicate."),
            code("State holder cho editor", "data class EditorUiState(\n    val text: String = \"\",\n    val mediaIds: List<String> = emptyList(),\n    val uploading: Boolean = false,\n    val fieldError: String? = null\n)")
        ]
    },
    {
        "id": "checklist",
        "title": "22. Checklist tự đánh giá",
        "blocks": [
            paragraph("Tự kiểm tra: tôi xác định được owner và lifetime; không expose mutable state; phân biệt state, event và derived state; có restoration policy; không lưu object lớn vào Bundle; hiểu read tracking và mutation policy; dùng atomic update khi có concurrency; và giải thích được trade-off giữa một UiState lớn với nhiều stream nhỏ."),
            bullets(["Owner rõ", "Lifetime rõ", "Read-only public API", "Một source of truth", "Restoration có giới hạn", "Transition test được", "Không tuyên bố Upzi vượt quá dữ kiện"])
        ]
    },
    {
        "id": "summary",
        "title": "23. Tóm tắt cần nhớ",
        "blocks": [
            paragraph("Compose chỉ invalid scope đã đọc observable state khi write được policy xem là thay đổi. State hoisting theo value-down/event-up tạo mutation boundary rõ. Local UI state không mặc định thuộc ViewModel. remember giữ qua recomposition nhưng restoration cần rememberSaveable, SavedStateHandle hoặc persistence. Derived state nên tính từ source, immutable UiState giúp transition nhất quán và lifecycle/process death phải được thiết kế riêng."),
            bullets(["Observable read quyết định invalidation.", "Owner thấp nhất đủ dùng.", "Một source of truth.", "Không lưu dữ liệu lớn vào saved state.", "StateFlow.update chống lost update.", "State khác event."])
        ]
    },
    {
        "id": "quiz",
        "title": "24. Quiz có giải thích đáp án",
        "blocks": [
            paragraph("Quiz kiểm tra cơ chế runtime, ownership, lifecycle, concurrency và restoration. Mỗi đáp án phải được giải thích bằng invariant thay vì ghi nhớ tên API.")
        ]
    }
]

quiz_specs = [
    ("MutableState invalid scope khi nào?", ["Mỗi lần đọc", "Write được policy xem là thay đổi và scope đã đọc state", "Mỗi frame", "Khi Activity resume"], 1, "Read tạo dependency; write hợp lệ mới invalid scope."),
    ("State hoisting thường truyền gì xuống child?", ["Repository", "MutableStateFlow", "Value và event callback", "ViewModel bắt buộc"], 2, "Child nhận value và phát event cho owner mutation."),
    ("remember bảo toàn state qua đâu?", ["Process death mặc định", "Recomposition khi identity còn", "App uninstall", "Mọi navigation"], 1, "remember gắn với slot trong composition."),
    ("Derived state nên được xử lý thế nào?", ["Luôn lưu mutable riêng", "Tính từ source of truth", "Đưa server", "Biến thành event"], 1, "Lưu song song tạo nguy cơ lệch."),
    ("ViewModel nên expose gì?", ["MutableStateFlow", "StateFlow", "MutableList", "Public var"], 1, "Owner giữ quyền mutation, consumer chỉ đọc."),
    ("SavedStateHandle phù hợp với dữ liệu nào?", ["Bitmap lớn", "Danh sách hàng nghìn item", "ID hoặc query nhỏ", "Socket connection"], 2, "Saved state có giới hạn Binder/Bundle."),
    ("Sửa MutableList tại chỗ có rủi ro gì?", ["Không compile", "Mutation có thể không observable", "Luôn crash", "Luôn recomposition"], 1, "State holder/reference có thể không được ghi lại."),
    ("MutableStateFlow.update giúp gì?", ["Chạy trên Main", "Atomic transform state hiện tại", "Lưu process death", "Retry network"], 1, "update giảm read-copy-write race."),
    ("Event khác state ở điểm nào?", ["Event luôn String", "Event là occurrence, state là giá trị hiện tại có thể đọc lại", "State không đổi", "Không khác"], 1, "Replay và consumption contract khác nhau."),
    ("Nên hoist state tới đâu?", ["Application luôn", "ViewModel luôn", "Common owner thấp nhất cần dùng", "Repository luôn"], 2, "Hoist đủ dùng để tránh ownership phân tán và prop drilling."),
    ("UiState lớn có chắc redraw toàn màn hình?", ["Có", "Không, còn phụ thuộc read, skip, layout và draw", "Chỉ debug", "Chỉ release"], 1, "Recomposition và redraw không đồng nghĩa."),
    ("Process death ảnh hưởng ViewModel thế nào?", ["ViewModel luôn sống", "ViewModel mới được tạo và cần restoration source", "Không ảnh hưởng", "Chỉ xảy ra iOS"], 1, "ViewModel chỉ giữ qua configuration change trong process hiện tại.")
]
quiz = []
for index, (question, options, answer, explanation) in enumerate(quiz_specs, 1):
    option_items = [{"id": chr(97 + i), "text": text} for i, text in enumerate(options)]
    quiz.append({
        "id": f"d02-q{index:02d}",
        "question": question,
        "options": option_items,
        "correctOptionIds": [option_items[answer]["id"]],
        "explanation": explanation
    })

lesson = {
    "id": "d02",
    "code": "D02",
    "title": "State trong Compose",
    "summary": "Thiết kế state owner, Snapshot State, state hoisting, immutable UiState, lifecycle và restoration để UI Compose nhất quán, testable và an toàn trước concurrency.",
    "estimatedMinutes": 360,
    "sections": sections,
    "quiz": quiz
}
LESSON_PATH.parent.mkdir(parents=True, exist_ok=True)
LESSON_PATH.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")

section_ids = [section["id"] for section in sections]
paragraphs = [block["content"] for section in sections for block in section.get("blocks", []) if block.get("type") == "paragraph"]
code_blocks = [block for section in sections for block in section.get("blocks", []) if block.get("type") == "code"]
text = LESSON_PATH.read_text()
quiz_valid = all(
    item.get("options") and item.get("correctOptionIds") and item.get("explanation", "").strip()
    and set(item["correctOptionIds"]).issubset({option["id"] for option in item["options"]})
    for item in quiz
)
metrics = {
    "id": LESSON_ID,
    "sections": len(sections),
    "uniqueSectionIds": len(set(section_ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(len(value) for value in paragraphs),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "quizAnswersValid": quiz_valid,
    "truthfulnessLabelsPresent": all(marker in text for marker in ("confirmed", "inferred", "proposed", "needs-confirmation"))
}
REPORT_PATH.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
assert metrics["sections"] == 24
assert metrics["uniqueSectionIds"] == 24
assert metrics["paragraphs"] >= 30
assert metrics["paragraphCharacters"] >= 9000
assert metrics["codeBlocks"] >= 10
assert metrics["quizQuestions"] >= 10
assert metrics["quizAnswersValid"]
assert metrics["truthfulnessLabelsPresent"]

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "d")
entry = next(item for item in chapter["lessons"] if item["id"] == LESSON_ID)
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("d02", "d03")
if LESSON_ID not in plan["completed"]:
    plan["completed"].append(LESSON_ID)
plan["current"] = "d03"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
if not any(item["lessonId"] == LESSON_ID for item in index):
    index.append({
        "lessonId": LESSON_ID,
        "code": "D02",
        "title": "State trong Compose",
        "keywords": ["Compose state", "MutableState", "Snapshot State", "state hoisting", "single source of truth", "UiState", "StateFlow", "remember", "rememberSaveable", "SavedStateHandle", "derivedStateOf", "mutation policy", "process death"],
        "headings": ["Cơ chế Snapshot State", "State hoisting", "Ownership và lifetime", "Immutable UiState", "Lifecycle và restoration", "Upzi form, search và chat", "Trade-off và edge cases", "Câu hỏi phỏng vấn"]
    })
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for path in (catalog_path, plan_path, index_path, LESSON_PATH):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]

print(json.dumps(metrics, ensure_ascii=False, indent=2))
print("D02 deep publication validation passed")
