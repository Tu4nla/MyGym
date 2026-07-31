import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'

def p(x): return {'type':'paragraph','content':x}
def c(label,code): return {'type':'code','language':'kotlin','label':label,'content':code}
def sec(i,id,title,paras,codes=None):
    blocks=[p(x) for x in paras]
    for code in codes or []: blocks.append(c(*code))
    return {'id':id,'title':f'{i}. {title}','blocks':blocks}

sections=[]
sections.append(sec(1,'objectives','Mục tiêu bài học',[
'Hiểu performance Android như một hệ thống gồm memory, CPU, I/O, main thread, rendering, process priority và giới hạn nền tảng; không tối ưu theo cảm giác hoặc chỉ nhìn một chỉ số.',
'Phân biệt memory pressure, memory leak, allocation churn, OOM, ANR, jank, slow start và excessive background work; biết chọn profiler, trace và metric phù hợp cho từng triệu chứng.',
'Thiết kế performance budget, observability, quy trình tái hiện, phân tích root cause và regression test đủ dùng trong sản phẩm thực tế và phỏng vấn Android Middle.'
]))
sections.append(sec(2,'prerequisites','Kiến thức nền',[
'Cần nắm Activity/process lifecycle, configuration change, process death, Context leak, coroutine, Compose recomposition, WorkManager, Service và dữ liệu persistence.',
'Cần hiểu main thread xử lý input, lifecycle callback, Binder callback và render scheduling; background thread không tự bảo đảm an toàn nếu vẫn chặn tài nguyên dùng chung với main thread.'
]))
sections.append(sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',[
'Heap là vùng object do runtime quản lý; native heap chứa bitmap buffer, codec, JNI và allocation ngoài managed heap. RSS phản ánh bộ nhớ resident của process, PSS phân bổ trang chia sẻ tương đối.',
'Leak là object không còn cần nhưng vẫn reachable từ GC root. Churn là tạo-hủy object với tốc độ cao gây GC và CPU. OOM xảy ra khi process không đáp ứng allocation, không đồng nghĩa luôn có leak.',
'ANR là trạng thái app không phản hồi trong cửa sổ thời gian hệ thống theo dõi. Jank là frame trễ so với deadline. Cold, warm và hot start có đường đi và budget khác nhau.',
'System trace mô tả timeline đa tiến trình; method trace đo call stack nhưng có overhead. Perfetto, CPU Profiler, Memory Profiler, Macrobenchmark, Baseline Profile và JankStats phục vụ mục tiêu khác nhau.'
]))
sections.append(sec(4,'mechanism','Cơ chế hoạt động bên trong',[
'Android main looper lấy Message từ MessageQueue và chạy tuần tự. Một callback dài, lock contention, synchronous Binder, disk I/O, network hoặc GC pause đều có thể làm input và frame bị trì hoãn.',
'Choreographer phối hợp frame; UI phải hoàn tất measure, layout, draw và phần việc liên quan trước deadline. Ở màn hình tần số quét cao, budget mỗi frame còn nhỏ hơn 16,6 ms.',
'LMKD có thể kết thúc process dưới memory pressure dựa trên mức ưu tiên. Process đang foreground quan trọng hơn cached process, nhưng giữ service hoặc object lớn không tạo bảo đảm sống lâu.',
'Garbage collector chỉ thu object không reachable. Nếu singleton, thread, listener, ViewModel hoặc native handle giữ reference chain, object vẫn tồn tại. Native allocation có thể tăng RSS dù Java heap trông ổn.'
],[("Đo block trên main thread bằng trace section","fun loadFeed() {\n    Trace.beginSection(\"feed_decode\")\n    try {\n        repository.decodeCachedFeed()\n    } finally {\n        Trace.endSection()\n    }\n}")]))
sections.append(sec(5,'purpose','Mục đích của kỹ thuật',[
'Mục tiêu performance là bảo đảm hành vi người dùng quan trọng đạt latency, responsiveness, stability và resource budget xác định, thay vì chạy benchmark vi mô không liên quan sản phẩm.',
'Kỹ thuật đúng giúp tìm bottleneck có bằng chứng, ưu tiên theo tác động, tránh tối ưu sớm và tạo guardrail để lỗi không quay lại.'
]))
sections.append(sec(6,'problem','Vấn đề kỹ thuật được giải quyết',[
'App có thể giật khi cuộn, mở màn chậm, treo khi resume, crash OOM, bị hệ thống kill thường xuyên hoặc tiêu thụ CPU/battery cao dù code chức năng vẫn đúng.',
'Không có telemetry và budget, đội phát triển dễ sửa triệu chứng cục bộ, chuyển việc sang thread khác nhưng vẫn tranh lock, hoặc giảm chất lượng UX mà không xử lý nguyên nhân.'
]))
sections.append(sec(7,'when-to-use','Dấu hiệu cần dùng',[
'Cần điều tra khi Play Console, vitals, crash report, trace hoặc phản hồi người dùng cho thấy ANR, OOM, slow startup, frozen frame, excessive wakeup hoặc memory tăng theo thao tác lặp.',
'Cần performance engineering trước release lớn, thay đổi target SDK, thêm media/feed nặng, chuyển Compose, tích hợp SDK mới hoặc mở rộng thiết bị cấu hình thấp.'
]))
sections.append(sec(8,'when-not-to-use','Khi không nên dùng',[
'Không tối ưu chỉ vì profiler hiển thị allocation nếu không có tác động đo được. Một allocation ngắn hạn rẻ có thể tốt hơn object pool phức tạp và lỗi concurrency.',
'Không dùng microbenchmark để kết luận UX end-to-end; không tắt animation, cache vô hạn hoặc giữ process sống bằng foreground service chỉ để che startup và loading kém.'
]))
sections.append(sec(9,'requirement','Yêu cầu sản phẩm cụ thể',[
'Feed phải mở nội dung khả dụng trong budget đã thống nhất, cuộn không có frozen frame đáng kể, media thumbnail không làm RSS tăng vô hạn và quay lại màn hình không tải lại vô ích.',
'Chat phải xử lý message burst mà không block main thread; database write, JSON decode và socket callback được đo. Khi mạng yếu, UI vẫn phản hồi và retry không tạo storm.',
'Acceptance criteria gồm cold/warm start, p50/p95/p99 latency, ANR rate, OOM rate, frame timing, memory high-water mark, thiết bị thấp-trung-cao và regression threshold trong CI.'
]))
sections.append(sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: UI chỉ render state; repository chịu I/O; dispatcher được inject; image loader có cache budget; SDK được cô lập và đo. Performance ownership phải theo user journey, không theo module đơn lẻ.',
'Error policy: khi thiếu memory, giảm chất lượng ảnh hoặc evict cache có kiểm soát; khi task bị hủy, giải phóng tài nguyên; khi decode thất bại, fallback thay vì retry tight loop.',
'Lifecycle: dừng collector, sensor, callback và animation khi không visible; tránh khởi tạo lại đắt đỏ mỗi recomposition; không giả định process hoặc singleton còn sau background.',
'Resource limits: Binder transaction, file descriptor, thread count, bitmap/native buffer, database connection, executor queue và cache đều cần giới hạn. Queue không bounded biến spike thành OOM hoặc latency kéo dài.',
'Ưu tiên điều tra theo bằng chứng: tái hiện -> capture trace/heap -> xác định critical path hoặc retaining path -> sửa nhỏ nhất -> benchmark lại -> thêm regression gate.'
]))
sections.append(sec(11,'minimal-code','Ví dụ code tối giản',[
'Dùng StrictMode ở debug để phát hiện disk/network trên main thread và resource leak. Đây là detector, không phải bằng chứng production duy nhất.',
'Macrobenchmark đo startup và scroll ở process độc lập; Baseline Profile tối ưu compilation cho critical path nhưng không sửa I/O hoặc thuật toán tệ.'
],[("StrictMode cho debug build","if (BuildConfig.DEBUG) {\n    StrictMode.setThreadPolicy(\n        StrictMode.ThreadPolicy.Builder()\n            .detectDiskReads().detectDiskWrites().detectNetwork()\n            .penaltyLog().build()\n    )\n    StrictMode.setVmPolicy(\n        StrictMode.VmPolicy.Builder()\n            .detectLeakedClosableObjects().penaltyLog().build()\n    )\n}"),("Macrobenchmark startup","@Test fun coldStart() = benchmarkRule.measureRepeated(\n    packageName = \"vn.upzi.app\",\n    metrics = listOf(StartupTimingMetric()),\n    iterations = 10,\n    startupMode = StartupMode.COLD\n) {\n    pressHome(); startActivityAndWait()\n}")]))
sections.append(sec(12,'upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng single-activity Compose, Paging, Flow, Socket.IO, image/video feed và từng gặp TransactionTooLarge do SavedStateHandle; đây là các bề mặt có rủi ro memory, main-thread và lifecycle performance rõ ràng.',
'inferred: feed, chat message grouping, media upload và rich-text parsing có thể tạo allocation, decode hoặc database pressure, nhưng chưa có số liệu trace hay production metric để khẳng định bottleneck cụ thể.',
'proposed: lập performance budget cho feed/chat, thêm Macrobenchmark cho cold start và scroll, Perfetto trace cho message burst, LeakCanary debug, image-cache budget, bounded queue và dashboard ANR/OOM/frame metrics.',
'needs-confirmation: cần xác nhận công cụ monitoring hiện dùng, baseline vitals, thiết bị mục tiêu, SDK analytics/media và các incident đã xử lý trước khi kể như kinh nghiệm production.'
]))
sections.append(sec(13,'alternatives','Phương án thay thế',[
'Perfetto phù hợp timeline hệ thống; CPU profiler phù hợp hotspot; heap dump phù hợp retained object; LeakCanary phù hợp leak debug; Macrobenchmark phù hợp user journey; Microbenchmark phù hợp hàm nhỏ ổn định.',
'Cache có thể dùng memory, disk hoặc không cache; background work có thể dùng coroutine gắn lifecycle, WorkManager hoặc service tùy durability và user visibility.'
]))
sections.append(sec(14,'tradeoffs','Lý do lựa chọn và trade-off',[
'Cache tăng tốc nhưng tăng memory, invalidation và stale-data complexity. Prefetch giảm latency nhưng tốn network, battery và có thể tải dữ liệu người dùng không xem.',
'Parallelism giảm latency đến một mức, sau đó tăng contention, context switch và memory. Giới hạn concurrency thường ổn định hơn tạo coroutine không giới hạn.',
'Baseline Profile tăng startup/render consistency nhưng cần maintenance theo critical journey. Lazy initialization giảm startup nhưng có thể chuyển jank sang lần tương tác đầu tiên.',
'Giảm chất lượng ảnh tiết kiệm memory nhưng ảnh hưởng trải nghiệm; quyết định cần dựa trên device tier, viewport và product requirement.'
]))
sections.append(sec(15,'edge-cases','Edge cases',[
'ANR có thể do process khác giữ Binder, database lock, class loading, DNS, content provider hoặc broadcast startup; stack main thread tại thời điểm dump chưa chắc là nguyên nhân đầu tiên.',
'Memory tăng không luôn là leak: cache có trần, JIT, mapped file và native codec có thể giữ lại hợp lệ. Cần xem plateau, retained path và behavior sau GC.',
'Compose jank có thể do unstable parameter, đọc state sai scope, layout intrinsic đắt, image decode hoặc business work trên main; recomposition count một mình không đủ kết luận.',
'Thiết bị thermal throttling, refresh rate, OEM, low-RAM mode, multi-window, accessibility và background app khác có thể làm benchmark nhiễu.',
'Force-stop khác process kill; startup sau update có dex optimization khác; first install và returning user cần tách metric.'
]))
sections.append(sec(16,'mistakes','Sai lầm thường gặp',[
'Tối ưu bằng cảm giác, đo debug build, profile emulator duy nhất, nhìn average thay p95/p99, không warm-up benchmark và thay nhiều biến cùng lúc.',
'Chạy JSON decode, Room query, bitmap processing hoặc SDK init trên main; dùng Dispatchers.IO nhưng giữ mutex khiến main chờ; tạo unbounded executor hoặc channel.',
'Giữ Activity/View trong singleton, không đóng Cursor/stream/file descriptor, cache bitmap theo số lượng thay vì byte, log payload lớn và cập nhật notification/progress quá dày.',
'Che ANR bằng tăng timeout hoặc chuyển mọi thứ sang thread khác mà không xử lý dependency, backpressure và cancellation.'
]))
sections.append(sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',[
'Phân biệt ANR, crash và jank; nguyên nhân OOM; leak khác churn; main looper hoạt động ra sao; vì sao Service không phải background thread; PSS khác heap; cách đo startup.',
'Một câu trả lời tốt luôn nêu symptom, công cụ đo, bằng chứng, root cause, fix, trade-off và cách ngăn regression.'
]))
sections.append(sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Nếu main-thread stack đang chờ lock, thread nào sở hữu lock và vì sao? Nếu Java heap thấp nhưng process OOM, kiểm tra native heap, bitmap, mmap, file descriptor và allocator thế nào?',
'Tại sao Dispatchers.IO không tự sửa ANR? Vì sao nhiều coroutine có thể làm app chậm hơn? Baseline Profile không sửa loại bottleneck nào?',
'Làm sao phân biệt cache tăng hợp lệ với leak; vì sao average frame time đẹp nhưng người dùng vẫn thấy giật; vì sao một ANR cluster cần xem trace trước thời điểm watchdog?' 
]))
sections.append(sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm người học',[
'Mẫu trung thực: “Tôi từng xử lý TransactionTooLarge do lưu payload lớn trong SavedStateHandle. Tôi chuyển sang chỉ lưu ID/state tối thiểu, dữ liệu lớn nằm ở repository/persistence, sau đó kiểm tra process restoration. Đây là incident đã xác nhận.”',
'Với performance chưa xác nhận: “Tôi đề xuất đo feed bằng Macrobenchmark và Perfetto, đặt memory/frame budget, nhưng cần xác nhận dự án đã triển khai dashboard hay chưa.” Không biến proposed thành confirmed.'
]))
sections.append(sec(20,'practice','Bài tập thực hành',[
'Tạo sample app có disk read trên main, allocation churn và Activity leak. Dùng StrictMode, Perfetto và heap dump để tìm từng lỗi, ghi lại bằng chứng trước và sau sửa.',
'Viết Macrobenchmark cho cold start và scroll LazyColumn; chạy trên release-like build, ít nhất hai device tier, báo p50/p95 và variance.',
'Thêm bounded concurrency cho image preprocessing, cancellation khi rời màn và test memory high-water mark sau 30 vòng navigation.'
]))
sections.append(sec(21,'scenario','Bài tập tình huống',[
'Feed giật sau khi thêm video autoplay: lập hypothesis cho decode, player count, surface, network, recomposition và GC; chọn trace, metric và thứ tự thử nghiệm.',
'Chat ANR khi nhận 500 message: phân tích socket callback, JSON parse, Room transaction, diff/list rendering, lock và analytics; thiết kế batching, backpressure và regression test.',
'App OOM chỉ trên máy RAM thấp sau mở nhiều ảnh: phân biệt leak với cache/bitmap native, đề xuất sampling, downscale, pool/cache budget và fallback UX.'
]))
sections.append(sec(22,'checklist','Checklist tự đánh giá',[
'Tôi phân loại đúng symptom trước khi chọn công cụ; đo release-like build trên thiết bị thật; tách cold/warm/hot start; theo dõi p95/p99.',
'Tôi biết đọc main-thread trace, lock owner, Binder wait, heap retaining path, native memory và frame timeline.',
'Tôi đặt budget cho cache, queue, thread, bitmap và user journey; có cancellation, backpressure, lifecycle cleanup và regression test.',
'Tôi phân biệt confirmed/inferred/proposed/needs-confirmation khi kể case Upzi.'
]))
sections.append(sec(23,'summary','Tóm tắt cần nhớ',[
'Performance là thuộc tính end-to-end. Đừng tối ưu khi chưa có symptom, metric và trace.',
'ANR thường là main-thread starvation hoặc dependency blocking; OOM có thể đến từ leak, churn, cache, native memory hoặc queue không giới hạn.',
'Đo đúng bằng Perfetto, profiler, heap dump, Macrobenchmark và production vitals; sửa root cause nhỏ nhất rồi khóa bằng budget và regression gate.',
'Lifecycle, cancellation, bounded resources và typed ownership thường quan trọng hơn mẹo tối ưu vi mô.'
]))
quiz=[
('ANR khác jank thế nào?', ['ANR luôn là crash','ANR là không phản hồi trong watchdog; jank là trễ frame','Jank chỉ do GPU','Không khác'],1,'ANR liên quan responsiveness window của hệ thống; jank liên quan frame deadline.'),
('Heap thấp nhưng RSS cao nên kiểm tra gì?', ['Chỉ Java object','Native allocation, bitmap, mmap và shared pages','Chỉ network','Chỉ Compose'],1,'Nhiều tài nguyên nằm ngoài managed heap.'),
('Dispatchers.IO có bảo đảm hết ANR không?', ['Có','Không, main có thể vẫn chờ lock/Binder/kết quả','Chỉ Android 14','Chỉ khi dùng Flow'],1,'Chuyển thread không loại bỏ dependency blocking.'),
('Công cụ tốt để xem timeline đa tiến trình?', ['LeakCanary','Perfetto','Lint','R8'],1,'Perfetto cho system trace đa tiến trình và thread.'),
('Leak khác churn ở điểm nào?', ['Leak là object còn reachable không cần thiết; churn là allocation tốc độ cao','Không khác','Churn luôn OOM','Leak luôn native'],0,'Đây là hai cơ chế khác nhau dù đều gây pressure.'),
('Macrobenchmark phù hợp nhất với gì?', ['Một phép cộng','Startup và user journey','Kiểm tra JSON schema','Unit test ViewModel'],1,'Macrobenchmark đo hành vi app ở mức hệ thống/process.'),
('Cache vô hạn có trade-off gì?', ['Không có','OOM và stale complexity','Chỉ tăng APK','Chỉ tăng CPU build'],1,'Cache cần budget và eviction.'),
('Average frame time tốt có loại trừ jank không?', ['Có','Không, tail latency/frozen frame vẫn xấu','Chỉ trên 60Hz','Chỉ Compose'],1,'Cần xem phân phối, p95/p99 và frozen frame.'),
('Baseline Profile sửa được disk I/O main thread không?', ['Có hoàn toàn','Không','Chỉ debug','Chỉ emulator'],1,'Profile cải thiện compilation, không thay logic I/O.'),
('Khi main chờ mutex cần làm gì?', ['Tăng timeout','Tìm thread giữ lock và critical section','Bỏ trace','Force GC'],1,'Root cause thường nằm ở owner hoặc dependency trước đó.'),
('OOM có luôn là memory leak không?', ['Có','Không','Chỉ máy thấp','Chỉ native'],1,'OOM có thể do spike, cache, bitmap, queue hoặc native allocation.'),
('Bước đúng sau khi sửa performance?', ['Dừng đo','Benchmark lại và thêm regression gate','Tăng log payload','Tắt animation'],1,'Cần chứng minh cải thiện và ngăn tái phát.')]
sections.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[p('Chọn đáp án rồi đối chiếu giải thích. Mục tiêu là hiểu cơ chế, không học thuộc tên công cụ.')], 'quiz':[{'question':q,'options':o,'answerIndex':a,'explanation':e} for q,o,a,e in quiz]})
lesson={'id':'e10','code':'E10','title':'Memory, ANR và Platform Performance','summary':'Phân tích memory, OOM, ANR, jank, startup và performance Android bằng profiler, Perfetto, benchmark, budget và regression testing.','estimatedMinutes':360,'sections':sections}
(DATA/'lessons'/'e').mkdir(parents=True,exist_ok=True)
(DATA/'lessons'/'e'/'e10.json').write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text())
next_id=None
found=False
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='e10':
            item['status']='published'; item['estimatedMinutes']=360; found=True
        elif found and next_id is None and item.get('status')=='planned': next_id=item['id']
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
plan=json.loads((DATA/'book-plan.json').read_text())
if 'e10' not in plan['completed']: plan['completed'].append('e10')
plan['current']=next_id
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n")
idx=json.loads((DATA/'search-index.json').read_text())
idx=[x for x in idx if x.get('id')!='e10']
idx.append({'id':'e10','code':'E10','title':lesson['title'],'summary':lesson['summary'],'path':'data/lessons/e/e10.json','keywords':['memory','ANR','OOM','jank','Perfetto','Macrobenchmark','Baseline Profile','startup','GC','PSS','StrictMode']})
(DATA/'search-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+"\n")
validation={'id':'e10','sections':len(sections),'uniqueSectionIds':len({s['id'] for s in sections}),'exactSectionOrder':[s['id'] for s in sections]==['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide'],'paragraphs':sum(1 for s in sections for b in s.get('blocks',[]) if b['type']=='paragraph'),'paragraphCharacters':sum(len(b['content']) for s in sections for b in s.get('blocks',[]) if b['type']=='paragraph'),'codeBlocks':sum(1 for s in sections for b in s.get('blocks',[]) if b['type']=='code'),'quizQuestions':len(quiz),'quizAnswersValid':all(0<=a<len(o) for _,o,a,_ in quiz),'truthfulnessLabelsPresent':all(x in json.dumps(lesson,ensure_ascii=False) for x in ['confirmed','inferred','proposed','needs-confirmation']),'nextLesson':next_id}
(DATA/'validation-e10.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n")
print(validation)
