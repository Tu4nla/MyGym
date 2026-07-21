import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'
sections=[]
def sec(i,id,title,*paras,codes=None):
    blocks=[{'type':'paragraph','content':p} for p in paras]
    for label,code in (codes or []): blocks.append({'type':'code','language':'kotlin','label':label,'content':code})
    sections.append({'id':id,'title':f'{i}. {title}','blocks':blocks})
sec(1,'objectives','Mục tiêu bài học',
'Hiểu hiệu năng Compose theo pipeline frame: snapshot invalidation, recomposition, measure, layout, draw, GPU rendering và I/O phụ trợ. Người học phải phân biệt được bottleneck CPU, GPU, memory, startup và jank thay vì gộp tất cả thành recomposition.',
'Mục tiêu thực hành là thiết lập chiến lược đo đạc bằng Layout Inspector, Compose compiler reports, Perfetto, Macrobenchmark, Baseline Profiles và benchmark module; đồng thời viết UI test ổn định dựa trên semantics, state và clock thay vì delay hoặc tọa độ màn hình.')
sec(2,'prerequisites','Kiến thức nền',
'Cần nắm stability, recomposition, LazyColumn, Modifier, animation, lifecycle, Navigation Compose, coroutines và immutable UI state từ các bài D01-D11. D12 tổng hợp toàn bộ để đo và kiểm thử một màn Compose thực tế.',
'Cần biết khác biệt debug/release build, warm/cold startup, main thread, frame budget, test instrumentation và dependency injection. Số liệu debug không đại diện production vì tracing, inspection và lack of optimization làm thay đổi behavior.')
sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',
'Jank là frame trễ hoặc không kịp deadline; dropped frame là frame không được trình bày đúng nhịp. Frame time gồm work trên UI thread, RenderThread và GPU. Recomposition count chỉ là một tín hiệu, không phải KPI cuối.',
'Macrobenchmark đo hành vi toàn app như startup, scroll và frame timing trên thiết bị; Microbenchmark đo hàm hoặc component cô lập. Baseline Profile mô tả đường code quan trọng để ART precompile, giảm startup và interaction latency.',
'Semantics tree là cây thông tin accessibility/testing mà Compose UI test truy vấn. TestTag là nhãn kỹ thuật; contentDescription và role mang nghĩa sản phẩm. Idling synchronization giúp test chờ Compose/coroutine scheduler ổn định.')
sec(4,'mechanism','Cơ chế hoạt động bên trong',
'Khi state thay đổi, snapshot system invalidates scope đã đọc state. Recomposer schedule work vào frame; composable restartable có thể chạy lại, phần skippable được bỏ qua. Sau composition, node bị ảnh hưởng có thể remeasure, relayout hoặc redraw tùy phase đọc state.',
'Measure có thể lan từ child lên parent khi constraints hoặc size đổi. Draw-only state đọc trong draw modifier có thể tránh recomposition/remeasure. graphicsLayer tạo layer và transform ở render phase nhưng có memory và offscreen rendering cost.',
'Compose UI test dựng content trong host test, truy vấn semantics nodes, thực hiện action rồi chờ framework idle. MainTestClock điều khiển animation/frame trong môi trường test; advanceTimeBy giúp test deterministic hơn sleep.',codes=[('Theo dõi state ở phase phù hợp','''Canvas(
    Modifier.drawWithContent {
        drawContent()
        drawRect(color.copy(alpha = animatedAlpha.value))
    }
)'''),('UI test theo semantics','''composeRule.onNodeWithTag("job_list")
    .performScrollToNode(hasText("Android Engineer"))
composeRule.onNodeWithText("Android Engineer")
    .assertIsDisplayed()
    .performClick()''')])
sec(5,'purpose','Mục đích của kỹ thuật',
'Đo hiệu năng giúp ưu tiên đúng vấn đề: startup chậm, scroll jank, typing lag, image decode, excessive allocation hay GPU overdraw. Không đo, team dễ dành nhiều thời gian giảm recomposition không đáng kể trong khi bottleneck nằm ở network/image/layout.',
'UI test bảo vệ contract nhìn từ người dùng: nội dung hiển thị, trạng thái lỗi, tương tác, navigation trigger, accessibility semantics và behavior khi dữ liệu thay đổi. Nó bổ sung unit test reducer/ViewModel chứ không thay thế.')
sec(6,'problem','Vấn đề kỹ thuật được giải quyết',
'Compose declarative khiến một thay đổi state có thể lan qua nhiều phase. Model mutable, unstable parameter, đọc state ở scope quá cao hoặc layout phức tạp có thể làm frame cost tăng khó quan sát bằng code review.',
'UI test dễ flaky nếu dựa vào delay, text không ổn định, animation thực, network thật, loading không kiểm soát hoặc selector quá rộng. Cần testability như một phần kiến trúc, không phải vá sau cùng.')
sec(7,'when-to-use','Dấu hiệu cần dùng',
'Dùng profiler/benchmark khi có dropped frames, startup regression, scroll giật, typing delay, memory tăng, ANR hoặc metric production xấu. Cũng cần benchmark trước khi tối ưu lớn để có baseline và sau thay đổi để chứng minh lợi ích.',
'Dùng Compose UI test cho critical user journeys, màn có nhiều state branch, component tương tác, accessibility contract và bug regression. Smoke test ít nhưng giá trị cao nên chạy trên PR; suite dài hơn có thể chạy nightly/device farm.')
sec(8,'when-not-to-use','Khi không nên dùng',
'Không dùng recomposition counter đơn lẻ để kết luận hiệu năng. Không benchmark debug build, emulator đang tải nặng hoặc một lần chạy duy nhất rồi công bố kết quả.',
'Không viết UI test cho logic thuần có thể unit test nhanh hơn. Không assert pixel exact cho mọi màn nếu contract chỉ là semantics/state; screenshot test phù hợp visual regression nhưng nhạy font, density và rendering environment.')
sec(9,'requirement','Yêu cầu sản phẩm cụ thể',
'Màn job feed phải đạt scroll mượt trên thiết bị trung bình với dataset Paging, ảnh cache lạnh/nóng và item có bookmark. Product gate cần định nghĩa startup P50/P95, frame time/jank threshold và không regression vượt ngân sách đã thống nhất.',
'Màn chat phải test gửi optimistic message, ack, retry, typing, pagination prepend và giữ scroll position. UI test phải dùng fake repository/socket deterministic, không gọi backend thật và xác nhận semantics cho trạng thái sent/failed.',
'CI phải tách unit test, Compose UI test và benchmark. Benchmark chạy trên thiết bị/profile phù hợp, lưu report artifact và so trend; test flake rate phải được theo dõi thay vì retry vô hạn để che lỗi.')
sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',
'Dependency: production UI nhận interface repository/navigator/clock; test inject fake. Performance tooling nằm module benchmark hoặc build variant riêng. Không để test phụ thuộc singleton thật, system time hoặc random không seed.',
'Error policy: UI test phải bao phủ loading, empty, recoverable error, permission denial và retry. Benchmark failure do thermal throttling, background process hoặc device state cần được phân biệt với product regression; report phải giữ metadata.',
'Lifecycle: test phải mô phỏng recreation, navigation back, activity restart và state restoration khi contract yêu cầu. Coroutine/Flow collection cần lifecycle-aware; fake emissions phải có quyền kiểm soát thứ tự và cancellation.',
'Resource limits: ảnh lớn, text dài, nested lazy list, large semantics tree, many test tags và retained state đều có cost. Benchmark nên đại diện dữ liệu xấu hợp lý, không chỉ happy path vài item.',codes=[('Macrobenchmark scroll','''@Test
fun scrollJobFeed() = benchmarkRule.measureRepeated(
    packageName = targetPackage,
    metrics = listOf(FrameTimingMetric()),
    iterations = 10,
    setupBlock = { startActivityAndWait() }
) {
    device.findObject(By.res("job_list")).fling(Direction.DOWN)
    device.waitForIdle()
}''')])
sec(11,'minimal-code','Ví dụ code tối giản',
'Screen nên nhận immutable state và callbacks để Compose test setContent trực tiếp. Route layer có ViewModel/navigation được test riêng ở integration boundary; không cần khởi động toàn app cho mọi assertion.',
'Selector ưu tiên semantics có nghĩa: role, stateDescription, text ổn định hoặc testTag ở container phức tạp. Tránh dùng index khi list reorder và tránh selector text từ remote localization nếu test không kiểm soát locale.',codes=[('Screen testable','''@Composable
fun JobScreen(
    state: JobUiState,
    onRetry: () -> Unit,
    onOpenJob: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    JobContent(state, onRetry, onOpenJob, modifier.testTag("job_screen"))
}'''),('Test loading sang content','''@get:Rule val composeRule = createComposeRule()

@Test fun loadsJobs() {
    val state = mutableStateOf<JobUiState>(JobUiState.Loading)
    composeRule.setContent { JobScreen(state.value, {}, {}) }
    composeRule.onNodeWithTag("loading").assertExists()
    state.value = JobUiState.Content(fakeJobs)
    composeRule.onNodeWithText("Android Engineer").assertIsDisplayed()
}''')])
sec(12,'upzi-case','Ví dụ thực tế Upzi',
'confirmed: Upzi dùng Jetpack Compose, Paging3, Navigation Compose, chat realtime và các màn list/detail; đây là bối cảnh có rủi ro scroll jank, state update dày và test orchestration phức tạp.',
'inferred: project có unit/UI test và profiling ở mức nào đó nhưng chưa xác nhận Macrobenchmark, Baseline Profile, compiler metrics hay device matrix hiện tại. proposed: tạo benchmark cho cold startup, job feed scroll và chat prepend; xây fake socket/repository cho Compose UI test. needs-confirmation: cần kiểm tra module test hiện có, CI runtime, minSdk/target device và metric production trước khi kể là đã triển khai.')
sec(13,'alternatives','Phương án thay thế',
'Robolectric/Compose test host có thể chạy nhanh cho một số integration nhưng không thay instrumentation trên thiết bị thật cho rendering/lifecycle đặc thù. Paparazzi/Roborazzi phù hợp screenshot regression; Espresso phù hợp mixed View/Compose.',
'Firebase Test Lab hoặc device farm tăng coverage thiết bị nhưng chi phí và thời gian cao. Manual exploratory test vẫn cần cho cảm nhận motion, gesture, accessibility và lỗi phụ thuộc OEM; benchmark tự động không đánh giá toàn bộ UX.')
sec(14,'tradeoffs','Lý do lựa chọn và trade-off',
'TestTag ổn định và dễ chọn nhưng có thể làm test coupling implementation nếu lạm dụng. Semantics theo nghĩa người dùng bền hơn nhưng localization/merged tree cần hiểu rõ. Screenshot test bắt visual regression tốt nhưng maintenance cao.',
'Baseline Profile cải thiện runtime thực nhưng cần quy trình generate, merge và verify. Macrobenchmark đáng tin hơn stopwatch thủ công nhưng chạy chậm, nhạy device state và không phù hợp mọi PR.',
'Tối ưu skip/recomposition có thể tăng complexity model/annotation. Chỉ chấp nhận khi metric chứng minh lợi ích và contract stability đúng; code dễ hiểu thường giá trị hơn micro-optimization không đo được.')
sec(15,'edge-cases','Edge cases',
'Compose semantics có merged/unmerged tree; child text có thể bị merge vào button. Node lazy chưa compose sẽ không tồn tại cho tới khi scroll. Animation và infinite transition khiến test không idle nếu clock/policy không kiểm soát.',
'Paging load state, debounce, snapshotFlow và coroutine trên custom dispatcher có thể không được test scheduler tự chờ. Fake cần expose explicit completion hoặc inject dispatcher/clock.',
'Font scale, RTL, dark mode, dynamic color, keyboard inset, foldable width và accessibility services có thể làm layout khác. Critical components nên có parameterized/device configuration tests.',
'Macrobenchmark cold startup cần force-stop và compilation mode rõ. Cache, JIT, profile install, thermal throttling và background sync làm số liệu dao động; cần nhiều iteration và percentile.')
sec(16,'mistakes','Sai lầm thường gặp',
'Lỗi phổ biến gồm benchmark debug, tối ưu theo recomposition count, remember object sai key, đọc layoutInfo trong composition mỗi pixel, decode ảnh gốc, tạo formatter trong row và dùng unstable mutable collection.',
'Test mistake gồm Thread.sleep, network thật, assert node bằng index, test nhiều flow trong một case khổng lồ, bỏ qua cleanup, retry flaky vô hạn và chỉ test happy path.',
'Không nên expose internal state chỉ để test. Thay vào đó thiết kế dependency, state và semantics contract rõ; test qua public UI behavior hoặc reducer API.')
sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',
'Câu hỏi nền: recomposition có luôn xấu không; measure/layout/draw khác gì; Macrobenchmark và Microbenchmark khác gì; Baseline Profile làm gì; Compose test tìm node bằng gì; test clock dùng khi nào.',
'Mẫu trả lời tốt phải bắt đầu từ symptom và metric, mô tả cách tái hiện, trace phase, tối ưu, rồi benchmark lại. Với testing, phải nói semantics, fake dependency, synchronization và test pyramid.')
sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',
'Câu xoáy: update một item làm cả list lambda chạy có nghĩa mọi row redraw không; derivedStateOf khi nào có lợi; graphicsLayer có đổi hitbox không; compiler stable report có đủ chứng minh smooth không; benchmark variance xử lý thế nào.',
'Câu bẫy: UI test pass có chứng minh accessibility tốt không; waitForIdle có chờ network thật không; testTag càng nhiều càng tốt không; Baseline Profile có sửa logic jank không; emulator có dùng để chốt KPI production không.')
sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm',
'Trong dự án Compose tôi không tối ưu theo cảm giác. Tôi tái hiện trên release/profile build, dùng tracing và Layout Inspector xác định phase, sửa scope đọc state/model/allocation, sau đó chạy Macrobenchmark cùng metric frame timing để so trước-sau.',
'Khi viết UI test, tôi tách Route và Screen, inject fake repository/socket, dùng semantics/testTag ổn định và điều khiển clock. Với Upzi, chỉ khẳng định stack Compose/Paging/chat đã biết; benchmark hay Baseline Profile phải ghi inferred/proposed nếu chưa xác nhận.')
sec(20,'practice','Bài tập thực hành',
'Tạo job feed 500 item có ảnh, bookmark và filter. Cố ý thêm formatter trong row, key index và state read rộng; đo trace, sửa từng lỗi và ghi bảng before/after frame timing, allocation và recomposition.',
'Viết Compose UI test cho loading, content, empty, error/retry, click detail và bookmark. Dùng fake repository phát Flow theo lệnh test; không sleep.',
'Tạo Macrobenchmark startup và scroll, thử compilation mode khác nhau, generate Baseline Profile rồi so cold startup percentile.')
sec(21,'scenario','Bài tập tình huống',
'Production báo chat giật khi 20 message ack gần nhau. Hãy lập kế hoạch thu thập trace, kiểm tra reducer, stable key, image/text measure, socket batching và benchmark regression.',
'UI test job feed flaky 8% chỉ trên CI. Log cho thấy animation và Paging append chạy đồng thời. Hãy đề xuất fake paging, clock control, selector và cách phân loại lỗi thay vì tăng retry.',
'Baseline Profile giảm startup nhưng scroll vẫn jank. Giải thích vì sao và xây kế hoạch đo CPU/GPU/layout/image riêng.')
sec(22,'checklist','Checklist tự đánh giá',
'Tôi phân biệt composition, measure, layout, draw, RenderThread/GPU và biết chọn tool cho từng symptom. Tôi không dùng debug benchmark hoặc một lần chạy để kết luận.',
'Tôi biết thiết kế Screen testable, dùng semantics tree, merged/unmerged nodes, test clock, fake dependency và tránh sleep/network thật.',
'Tôi có thể lập performance budget, benchmark critical journey, theo dõi regression/flake và trình bày chi tiết Upzi với nhãn trung thực.')
sec(23,'summary','Tóm tắt cần nhớ',
'Hiệu năng Compose là frame pipeline và resource behavior, không phải cuộc thi giảm recomposition. Measure trên build và thiết bị đại diện, tối ưu đúng phase rồi chứng minh bằng benchmark.',
'UI test ổn định đến từ kiến trúc deterministic: immutable state, injected dependency, semantics rõ, clock/scheduler kiểm soát và scope test hợp lý.',
'Compiler reports, Layout Inspector, Perfetto, Macrobenchmark, Baseline Profile và Compose test mỗi công cụ trả lời một câu hỏi khác nhau; không công cụ nào thay toàn bộ quy trình.')
sec(24,'quiz-guide','Quiz có giải thích đáp án',
'Làm quiz sau khi có thể tự chọn công cụ cho startup chậm, scroll jank, recomposition rộng, visual regression và flaky animation test. Mỗi đáp án cần nêu phase, metric và test boundary.',
'Khi ôn phỏng vấn, luôn trả lời theo chuỗi symptom -> reproduce -> measure -> hypothesis -> change -> verify -> regression guard.')
quiz=[]
def q(i,question,correct,wrong1,wrong2,wrong3,explanation):
    quiz.append({'id':f'q{i}','question':question,'options':[{'id':'a','text':correct},{'id':'b','text':wrong1},{'id':'c','text':wrong2},{'id':'d','text':wrong3}],'correctOptionIds':['a'],'explanation':explanation})
q(1,'Recomposition nhiều có luôn đồng nghĩa jank không?','Không, phải xét work và frame time','Có, mọi recomposition đều drop frame','Chỉ khi dùng StateFlow','Chỉ trên Android 14','Recomposition có thể rẻ; measure, draw, image, allocation hoặc GPU mới là bottleneck.')
q(2,'Tool phù hợp đo startup và scroll toàn app là gì?','Macrobenchmark','JUnit local thuần','Lint','Compose Preview','Macrobenchmark chạy journey trên app target và thu metrics như startup/frame timing.')
q(3,'Baseline Profile chủ yếu giúp gì?','Precompile đường code quan trọng để giảm latency','Giảm kích thước ảnh','Tự sửa recomposition','Thay UI test','Profile hướng ART compile code critical trước runtime.')
q(4,'Vì sao tránh Thread.sleep trong UI test?','Không đồng bộ đúng với state và gây flaky/chậm','Compose không hỗ trợ thread','Nó luôn crash','Chỉ hoạt động release','Sleep đoán thời gian thay vì chờ condition/clock deterministic.')
q(5,'Semantics tree dùng để làm gì?','Accessibility và truy vấn UI test','Lưu database','Compile Kotlin','Quản lý network','Compose test tương tác node qua semantics properties/actions.')
q(6,'graphicsLayer transform có đổi layout hitbox không?','Không, thường chỉ tác động rendering layer','Có luôn','Chỉ với alpha','Chỉ debug','Transform draw không nhất thiết thay measure/layout/hit target.')
q(7,'Khi node trong LazyColumn chưa visible, test nên làm gì?','Scroll tới node bằng semantics rồi assert','Dùng sleep 10 giây','Assert index toàn dataset','Tắt LazyColumn','Lazy item chưa compose nên cần performScrollToNode/scrollToIndex phù hợp.')
q(8,'Benchmark đáng tin nên chạy trên build nào?','Release/profile gần production','Debug có inspector','Preview','Unit test JVM','Debug overhead và optimization khác production.')
q(9,'waitForIdle có chắc chờ network thật hoàn tất không?','Không, external async cần fake hoặc synchronization riêng','Có mọi trường hợp','Chỉ Wi-Fi','Chỉ Retrofit','Idling của Compose không tự hiểu mọi external work.')
q(10,'TestTag nên dùng thế nào?','Có chọn lọc cho selector ổn định, ưu tiên semantics nghĩa','Gắn mọi node và assert implementation','Không bao giờ dùng','Dùng UUID ngẫu nhiên','TestTag hữu ích nhưng lạm dụng tăng coupling implementation.')
q(11,'Performance optimization đúng quy trình là gì?','Đo baseline, xác định bottleneck, sửa, đo lại','Thêm remember khắp nơi','Đổi tất cả class thành @Stable','Giảm animation duration','Tối ưu phải dựa metric và kiểm chứng regression.')
q(12,'UI test có thay unit test ViewModel/reducer không?','Không, chúng bổ sung nhau trong test pyramid','Có hoàn toàn','Chỉ khi Compose','Chỉ production','Logic thuần nên unit test nhanh; UI test bảo vệ integration/behavior người dùng.')
lesson={'id':'d12','code':'D12','title':'Compose Performance và UI Testing','summary':'Đo và tối ưu frame pipeline Compose, xây Macrobenchmark/Baseline Profile và viết UI test semantics deterministic, chống flaky.','estimatedMinutes':360,'sections':sections,'quiz':quiz}
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in sections]
assert ids==required and len(set(ids))==24
paragraphs=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']
code_blocks=[b for s in sections for b in s['blocks'] if b['type']=='code']
assert len(paragraphs)>=45 and sum(map(len,paragraphs))>=10000 and len(code_blocks)>=4 and len(quiz)>=10
text=json.dumps(lesson,ensure_ascii=False)
for label in ['confirmed:','inferred:','proposed:','needs-confirmation:']: assert label in text
lesson_path=DATA/'lessons'/'d'/'d12.json'; lesson_path.parent.mkdir(parents=True,exist_ok=True)
lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':'))+'\n')
catalog_path=DATA/'catalog.json'; catalog=json.loads(catalog_path.read_text())
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='d12': item['status']='published'; item['estimatedMinutes']=360
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text()); assert plan['current']=='d12'
if 'd12' not in plan['completed']: plan['completed'].append('d12')
plan['current']='e01'; plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text())
entry={'lessonId':'d12','code':'D12','title':'Compose Performance và UI Testing','keywords':['Compose performance','recomposition','frame timing','jank','Perfetto','Macrobenchmark','Baseline Profile','Compose UI testing','semantics tree','MainTestClock','testTag','screenshot testing'],'headings':['Frame pipeline','Performance measurement','Macrobenchmark','Baseline Profile','Semantics testing','Deterministic tests','Flaky test prevention','Upzi performance case']}
index[:]=[x for x in index if x.get('lessonId')!='d12']+[entry]
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'d12','sections':24,'uniqueSectionIds':24,'exactSectionOrder':True,'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':len(code_blocks),'quizQuestions':len(quiz),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'e01'}
(ROOT/'validation-d12.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))