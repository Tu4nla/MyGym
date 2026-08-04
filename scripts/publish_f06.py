import json
from pathlib import Path

ROOT = Path('android-learning/data')
LESSON = ROOT / 'lessons/f/f06.json'
CANONICAL = ['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']

def p(*items):
    return [{'type':'paragraph','content':x} for x in items]

def code(label, content):
    return {'type':'code','language':'kotlin','label':label,'content':content}

sections = [
{'id':'objectives','title':'1. Mục tiêu bài học','blocks':p(
'Hiểu Use Case như một application boundary mô tả một mục tiêu nghiệp vụ cụ thể, không phải lớp trung gian được tạo ra chỉ để gọi lại một hàm repository.',
'Phân biệt use case, domain service, application service, repository, ViewModel và worker; xác định đúng nơi đặt orchestration, validation, authorization, transaction và concurrency policy.',
'Thiết kế use case có input/output typed, dependency rõ, error policy ổn định, khả năng hủy, idempotency, observability và test độc lập với Android framework.',
'Đánh giá khi nào use case đem lại giá trị và khi nào chỉ tạo pass-through boilerplate hoặc làm phân mảnh logic.')},
{'id':'prerequisites','title':'2. Kiến thức nền','blocks':p(
'Cần nắm F01 Separation of Concerns, F02 MVVM, F03 MVI/UDF, F04 Clean Architecture và F05 Repository Pattern.',
'Cần hiểu coroutine cancellation, Flow, sealed interface, data class, dependency injection, transaction, idempotency, process death và source of truth.',
'Use case không thay thế repository hay ViewModel. Nó đứng ở application layer để điều phối policy của một hành động nghiệp vụ cụ thể.')},
{'id':'terminology','title':'3. Định nghĩa và chú giải thuật ngữ','blocks':p(
'Use Case là một đơn vị hành vi ứng dụng thể hiện mục tiêu của actor, ví dụ ApplyToJob, SendMessage, RefreshFeed hoặc UploadPostMedia.',
'Application service là lớp điều phối nhiều dependency để hoàn thành use case. Trong Android codebase, một class hậu tố UseCase thường chính là application service nhỏ.',
'Domain service chứa rule nghiệp vụ thuần không thuộc tự nhiên về một entity cụ thể. Repository là abstraction truy cập và đồng bộ dữ liệu; nó không nên quyết định toàn bộ workflow sản phẩm.',
'Command thường biểu diễn yêu cầu thay đổi state; Query biểu diễn yêu cầu đọc. CQRS là tách mô hình command/query có chủ đích, không phải bắt buộc mọi use case thành hai hệ thống riêng.',
'Interactor là tên khác của use case trong nhiều tài liệu Clean Architecture. Boundary là contract input/output mà presentation hoặc adapter gọi vào.')},
{'id':'mechanism','title':'4. Cơ chế hoạt động bên trong','blocks':p(
'UI hoặc ViewModel tạo input typed và gọi use case. Use case validate điều kiện, kiểm tra policy, điều phối repository hoặc service, rồi trả output typed.',
'Use case nên phụ thuộc abstraction hướng vào trong. Retrofit, Room, Context, NavController hoặc Compose state không đi vào contract nếu không thật sự là dữ liệu nghiệp vụ.',
'Coroutine cancellation truyền từ caller xuống dependency. Use case không được nuốt CancellationException hoặc tự chuyển mọi throwable thành lỗi nghiệp vụ.',
'Với workflow nhiều bước, use case xác định ordering, retry boundary, compensation và idempotency. Transaction chỉ bao phủ resource hỗ trợ transaction; network và local DB không tự nhiên atomic với nhau.',
'Use case đọc có thể trả Flow khi kết quả cần quan sát liên tục; use case command thường là suspend và trả result hữu hạn. Không nên dùng Flow chỉ để bọc một response duy nhất.',
'Input/output typed giúp ổn định contract và tránh truyền Map<String, Any>, Retrofit DTO hoặc UI model xuyên tầng.')},
{'id':'purpose','title':'5. Mục đích của kỹ thuật','blocks':p(
'Use case làm nổi bật ngôn ngữ sản phẩm trong code: gửi tin, ứng tuyển, refresh feed, đánh dấu đã đọc thay vì chuỗi lệnh kỹ thuật rải trong ViewModel.',
'Nó tập trung orchestration và policy để nhiều entry point như UI, deep link, notification, worker hoặc test dùng cùng hành vi.',
'Nó tạo seam kiểm thử nhanh cho business workflow mà không cần Android runtime hay UI instrumentation.',
'Mục tiêu là giữ presentation đơn giản và repository tập trung vào dữ liệu, không phải tăng số class theo công thức.')},
{'id':'problem','title':'6. Vấn đề kỹ thuật được giải quyết','blocks':p(
'Khi ViewModel trực tiếp gọi nhiều repository, analytics, permission, cache và scheduler, workflow bị gắn vào lifecycle UI và khó tái sử dụng.',
'Khi repository ôm cả validation, navigation intent, analytics và điều phối sản phẩm, nó trở thành God Repository và contract dữ liệu mất rõ ràng.',
'Khi cùng hành vi được triển khai ở màn hình, notification action và worker, rule dễ lệch nhau.',
'Use case giải quyết bằng một application boundary có trách nhiệm và reason to change cụ thể.')},
{'id':'when-to-use','title':'7. Dấu hiệu cần dùng','blocks':p(
'Dùng khi một hành động cần phối hợp từ hai dependency trở lên hoặc chứa validation, authorization, retry, transaction, idempotency hay concurrency policy.',
'Dùng khi cùng hành vi được gọi từ nhiều entry point hoặc cần test workflow độc lập.',
'Dùng khi tên hành động nghiệp vụ giúp code dễ đọc hơn chuỗi lời gọi kỹ thuật.',
'Dùng khi cần giữ ViewModel không phụ thuộc chi tiết cache, socket, upload session hoặc scheduling.')},
{'id':'when-not-to-use','title':'8. Khi không nên dùng','blocks':p(
'Không cần class use case riêng cho mọi getter/setter pass-through nếu nó không thêm policy, abstraction hoặc reuse có ý nghĩa.',
'Không tạo UseCase chỉ để đổi tên repository.getX thành GetXUseCase rồi mock thêm một tầng.',
'Không đặt UI formatting, string resource, navigation hoặc Activity permission request trong domain-oriented use case.',
'Không dùng một MegaUseCase điều phối cả feature; tách theo mục tiêu actor và transaction boundary.',
'Không ép mọi use case triển khai generic interface phức tạp nếu Kotlin function type hoặc class đơn giản đã đủ.')},
{'id':'requirement','title':'9. Yêu cầu sản phẩm cụ thể','blocks':p(
'Use case gửi tin nhắn phải tạo clientId ổn định, persist trạng thái pending trước khi gửi socket, tránh duplicate khi retry và trả identity để UI reconcile.',
'Use case ứng tuyển phải kiểm tra eligibility, chống double submit, map lỗi sản phẩm rõ ràng và không phụ thuộc màn hình hiện tại.',
'Use case upload post phải validate số lượng/loại media, tạo upload session, giới hạn concurrency, theo dõi progress và lưu durable state nếu cần tiếp tục sau process death.',
'Acceptance criteria phải nêu precondition, postcondition, error taxonomy, cancellation behavior, idempotency, telemetry và resource budget.',
'Contract không được rò Retrofit Response, Room Entity, Context hoặc mutable collection ra presentation.')},
{'id':'analysis','title':'10. Phân tích dependency, error policy, lifecycle và resource limits','blocks':p(
'Dependency: use case phụ thuộc repository, clock, dispatcher, validator, policy hoặc scheduler qua contract nhỏ; composition root cung cấp implementation.',
'Error policy: phân biệt validation failure, authorization failure, conflict, unavailable, timeout và unexpected defect. Không biến mọi lỗi thành chuỗi.',
'Lifecycle: use case không sở hữu Activity lifecycle. Caller sở hữu coroutine scope; durable work phải chuyển sang WorkManager hoặc persistence-backed queue.',
'Resource limits: upload/search/paging cần bounded concurrency, timeout, backpressure và giới hạn payload. Use case không giữ bitmap hoặc list vô hạn.',
'Concurrency: khai báo latest-wins, first-wins, serialize, single-flight hoặc idempotent retry theo hành vi; mutex không thay thế server idempotency.',
'Transaction: local multi-table update có thể dùng DB transaction. Workflow network + DB cần outbox, saga hoặc compensation thay vì giả định atomic.',
'Observability: log tên use case, duration, result category và correlation id; redact token, nội dung chat và PII.',
'Testability: inject clock, id generator và fake repository để kiểm thử deterministic; tránh Dispatchers.IO hard-code nếu logic cần kiểm soát scheduler.')},
{'id':'minimal-code','title':'11. Ví dụ code tối giản','blocks':p(
'Use case nên thể hiện policy có ý nghĩa. Ví dụ dưới kiểm tra nội dung, tạo identity ổn định và persist trước khi enqueue gửi.',
'Output typed giúp ViewModel cập nhật state mà không biết chi tiết local/socket.'),
code('Use case command có input/output typed', '''data class SendMessageInput(val conversationId:String,val text:String)\nsealed interface SendMessageResult { data class Accepted(val clientId:String):SendMessageResult; data class Rejected(val reason:String):SendMessageResult }\nclass SendMessageUseCase(private val repo:ChatRepository, private val ids:IdGenerator){\n suspend operator fun invoke(input:SendMessageInput):SendMessageResult {\n   val text=input.text.trim()\n   if(text.isEmpty()) return SendMessageResult.Rejected("empty_message")\n   val clientId=ids.next()\n   repo.persistPending(input.conversationId,clientId,text)\n   repo.enqueueSend(clientId)\n   return SendMessageResult.Accepted(clientId)\n }\n}'''),
p('Use case query có thể trả Flow từ source of truth và giữ mapping ngoài UI.'),
code('Query use case', '''class ObserveConversationUseCase(private val repo:ChatRepository){\n operator fun invoke(id:String):Flow<List<Message>> =\n   repo.observeMessages(id).map { items -> items.sortedBy(Message::createdAt) }\n}''')},
{'id':'upzi-case','title':'12. Ví dụ thực tế Upzi','blocks':p(
'confirmed: Upzi có Compose, ViewModel, StateFlow, Paging, Socket.IO, optimistic clientId, ack timeout, delivered/read/typing, deep link và WorkManager-related platform concerns.',
'inferred: các workflow chat, feed, opportunity và upload có nhu cầu tự nhiên cho application-level use case, nhưng chưa xác nhận toàn bộ code production đã chuẩn hóa thành class UseCase.',
'proposed: tách SendMessageUseCase, RetryMessageUseCase, MarkConversationReadUseCase, RefreshFeedUseCase và ProcessDeepLinkUseCase; mỗi use case có policy, contract và test riêng.',
'proposed: SendMessageUseCase persist pending message và outbox trước khi socket emit; socket adapter chỉ thực thi transport; repository reconcile clientId/serverId.',
'needs-confirmation: cần kiểm tra code hiện tại về ownership của ack timeout, dedup, analytics, repository boundary và WorkManager trước khi mô tả đây là kiến trúc đã triển khai.',
'needs-confirmation: cần xác nhận Apply Opportunity và media upload có rule đa bước nào đang nằm trong ViewModel hoặc repository.')},
{'id':'alternatives','title':'13. Phương án thay thế','blocks':p(
'Với feature nhỏ, ViewModel gọi repository trực tiếp có thể đủ nếu boundary và policy vẫn rõ.',
'Một application service có nhiều method liên quan có thể phù hợp hơn hàng chục class một-hàm khi cohesion tốt.',
'Domain entity method phù hợp rule thuộc bản thân entity; domain service phù hợp rule thuần giữa nhiều entity; use case phù hợp orchestration của actor goal.',
'Command handler hoặc reducer effect handler là hình thức tổ chức khác nhưng có thể thực hiện cùng vai trò application boundary.',
'Kotlin top-level function hoặc function type phù hợp logic thuần nhỏ; class hữu ích khi cần dependency injection và state cấu hình bất biến.')},
{'id':'tradeoffs','title':'14. Lý do lựa chọn và trade-off','blocks':p(
'Use case tăng readability, reuse và testability nhưng thêm class, mapping và dependency graph.',
'Một class mỗi hành động làm navigation code rõ nhưng có thể tạo ceremony nếu phần lớn chỉ pass-through.',
'Gộp nhiều method vào service giảm file count nhưng dễ tăng coupling và biến service thành God object.',
'Input/output typed tăng an toàn nhưng tạo mapping; nên đặt mapping ở boundary có thay đổi độc lập.',
'Use case không phụ thuộc Android dễ test nhưng platform requirement phải đi qua adapter, làm tăng abstraction.',
'Chọn granularity theo actor goal và reason to change, không theo mỗi API endpoint.')},
{'id':'edge-cases','title':'15. Edge cases','blocks':p(
'Caller bị cancel sau khi local write nhưng trước network enqueue; cần transaction hoặc trạng thái pending có worker tiếp quản.',
'User double tap submit; mutex trong process không đủ nếu process restart hoặc nhiều thiết bị, cần idempotency key/server constraint.',
'Account switch trong khi use case chạy; result cũ không được ghi vào session mới, cần account partition hoặc session generation.',
'Retry sau timeout nhưng request đầu đã thành công; output cần reconcile bằng idempotency key hoặc fetch authoritative state.',
'Clock thiết bị sai làm TTL/eligibility sai; dùng server time hoặc injected monotonic clock khi phù hợp.',
'Flow query có nhiều collector gây refresh trùng; source of truth và sharing policy phải được xác định ở repository/ViewModel.',
'Use case trả object mutable khiến caller sửa state ngoài kiểm soát; dùng immutable model.',
'Unexpected exception bị map thành business failure làm che bug; giữ phân loại defect và crash/report phù hợp.')},
{'id':'mistakes','title':'16. Sai lầm thường gặp','blocks':p(
'Tạo lớp UseCase cho mọi lời gọi repository nhưng không có policy, reuse hay abstraction value.',
'Đưa Context, NavController, mutable Compose state hoặc Retrofit DTO vào use case contract.',
'Bắt mọi use case kế thừa BaseUseCase generic với Result wrapper lồng nhiều tầng.',
'Nuốt CancellationException trong runCatching/catch rộng.',
'Hard-code dispatcher, clock, UUID hoặc singleton khiến test nondeterministic.',
'Để use case quyết định UI string, toast hoặc route cụ thể.',
'Đặt toàn bộ business rule trong repository rồi use case chỉ forward.',
'Không định nghĩa idempotency, concurrency và transaction semantics cho command quan trọng.',
'Dùng Flow cho one-shot operation chỉ vì codebase ưu tiên reactive API.')},
{'id':'interview-basic','title':'17. Câu hỏi phỏng vấn cơ bản','blocks':p(
'Use case là gì và khác repository thế nào?',
'Use case nên nằm ở layer nào và phụ thuộc vào gì?',
'Khi nào cần một use case class riêng?',
'Tại sao operator fun invoke thường được dùng?',
'Use case nên trả Flow hay suspend function?',
'Use case có được phụ thuộc Android Context không?',
'Phân biệt use case với domain service và ViewModel.',
'Tại sao pass-through use case có thể là over-engineering?')},
{'id':'interview-deep','title':'18. Câu hỏi xoáy sâu và câu hỏi bẫy','blocks':p(
'Nếu use case chỉ gọi một repository method thì có nên xóa không? Trả lời phải dựa trên contract stability, reuse, policy và cost, không theo giáo điều.',
'Làm sao đảm bảo command idempotent khi timeout và retry? Nêu client key, server constraint, durable outbox và reconciliation.',
'Use case có nên mở DB transaction không? Có thể qua repository/unit-of-work abstraction khi transaction là application policy; không rò Room API.',
'Làm sao xử lý network thành công nhưng local write thất bại? Nêu authoritative source, retry, reconciliation hoặc compensation.',
'Tại sao mutex không đủ chống duplicate submit? Vì chỉ bảo vệ một process instance.',
'Có nên catch Throwable trong use case? Không catch cancellation/fatal tùy platform; map expected technical failures, để defect được quan sát.',
'Làm sao test timeout, clock và UUID? Inject dependency deterministic.',
'Use case scope thuộc ai? Caller cho work ngắn hạn; durable scheduler cho work phải sống qua lifecycle.',
'Use case và MVI reducer liên hệ thế nào? Reducer thuần cập nhật state; effect handler gọi use case để thực hiện application behavior.')},
{'id':'experience-answer','title':'19. Mẫu trả lời gắn với kinh nghiệm','blocks':p(
'Ở Upzi, tôi có bối cảnh chat dùng optimistic clientId, socket ack timeout và trạng thái delivered/read. Cách tôi trình bày trung thực là: confirmed các cơ chế này tồn tại; proposed là gom policy gửi/retry/reconcile vào use case riêng nếu code hiện tại còn phân tán.',
'Tôi sẽ giải thích SendMessageUseCase tạo clientId, persist pending, enqueue transport và trả kết quả typed; repository chịu source of truth, socket adapter chịu transport, ViewModel chịu UiState.',
'Tôi không khẳng định đã triển khai Clean Architecture đầy đủ nếu chưa đối chiếu code. Tôi nêu rõ phần confirmed, inferred, proposed và needs-confirmation.',
'Khi được hỏi trade-off, tôi nói không tạo use case cho mọi getter; chỉ tách khi có policy, reuse, orchestration hoặc boundary ổn định.')},
{'id':'practice','title':'20. Bài tập thực hành','blocks':p(
'Viết SendMessageUseCase với validation, clientId injected, persist pending, enqueue và typed result.',
'Viết unit test cho empty text, persist failure, cancellation và duplicate retry.',
'Refactor một ViewModel đang gọi ba repository thành một application use case; đo số dependency của ViewModel trước/sau.',
'Viết ApplyOpportunityUseCase có eligibility, first-wins policy và idempotency key.',
'Tạo fake Clock và IdGenerator để test deterministic.',
'Viết contract test bảo đảm fake repository và implementation thật cùng semantics quan trọng.')},
{'id':'scenario','title':'21. Bài tập tình huống','blocks':p(
'Tình huống 1: người dùng bấm gửi hai lần khi mạng lag. Thiết kế identity, local state, enqueue và server idempotency.',
'Tình huống 2: process chết sau khi chọn 5 video và upload được 2 file. Xác định phần nào là use case ngắn hạn, phần nào cần durable worker/persistence.',
'Tình huống 3: notification action đánh dấu chat đã đọc trong khi app chưa mở. Thiết kế một use case dùng lại giữa receiver và màn hình.',
'Tình huống 4: refresh feed và reaction optimistic chạy đồng thời. Xác định transaction, source of truth và stale response policy.',
'Tình huống 5: team có 70 pass-through use case. Đề xuất tiêu chí giữ, gộp hoặc xóa mà không phá API nội bộ.')},
{'id':'checklist','title':'22. Checklist tự đánh giá','blocks':p(
'Tôi xác định được actor goal và pre/postcondition của use case.',
'Tôi phân biệt orchestration với data access và UI rendering.',
'Input/output là typed, immutable và không rò framework detail.',
'Tôi có error taxonomy và không nuốt cancellation.',
'Tôi đã định nghĩa concurrency, idempotency và transaction semantics.',
'Tôi biết caller hay durable scheduler sở hữu lifecycle.',
'Tôi có resource budget và observability không lộ PII.',
'Tôi test happy path, failure, cancellation, duplicate và out-of-order case.',
'Tôi không tạo pass-through abstraction vô nghĩa.',
'Tôi gắn nhãn trung thực cho case Upzi.')},
{'id':'summary','title':'23. Tóm tắt cần nhớ','blocks':p(
'Use case biểu diễn mục tiêu nghiệp vụ và application policy, không phải tên mới của repository method.',
'Use case tốt có responsibility rõ, input/output typed, dependency hướng vào abstraction và test độc lập.',
'ViewModel quản lý presentation state; repository quản lý data boundary; use case điều phối hành vi.',
'Command quan trọng cần idempotency, transaction/reconciliation, cancellation và lifecycle policy.',
'Không mọi thao tác đều cần use case class. Tối ưu cho clarity và changeability, không cho số lượng layer.',
'Với Upzi, chat, apply, feed refresh và upload là các ứng viên mạnh nhưng phải xác nhận implementation thực tế trước khi kể như kinh nghiệm.')},
{'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[]}
]

quiz = [
('Use case khác repository chủ yếu ở đâu?',['Use case điều phối mục tiêu và policy; repository trừu tượng hóa dữ liệu','Use case luôn gọi Retrofit','Repository quản lý UI state','Không khác'],'A','Use case mô tả hành vi ứng dụng, repository mô tả data boundary.'),
('Khi nào pass-through use case có thể hợp lý?',['Không bao giờ','Khi tạo contract ổn định/reuse hoặc chuẩn bị policy có ý nghĩa','Khi muốn tăng file count','Khi repository là interface'],'B','Giá trị phải đến từ boundary hoặc change reason, không từ hình thức.'),
('API phù hợp cho command one-shot là gì?',['Flow vô hạn','suspend function với result typed','LiveData mutable','Callback trong Activity'],'B','Command hữu hạn thường dùng suspend; Flow phù hợp quan sát liên tục.'),
('Ai sở hữu coroutine scope của use case ngắn hạn?',['Use case singleton','Caller như ViewModel','Repository luôn luôn','DTO'],'B','Caller quyết định lifecycle; use case nên cooperative cancellation.'),
('Cách đúng xử lý CancellationException?',['Map thành lỗi mạng','Nuốt đi','Cho truyền tiếp','Retry vô hạn'],'C','Cancellation là control flow của coroutine, không phải business failure.'),
('Mutex trong app có đủ chống double submit tuyệt đối không?',['Có','Không, cần idempotency/server constraint cho nhiều process hoặc retry','Chỉ trên debug','Chỉ với Flow'],'B','Mutex chỉ bảo vệ phạm vi process/runtime cụ thể.'),
('Use case có nên trả Retrofit Response?',['Có để linh hoạt','Không, nên map sang contract application/domain','Chỉ Compose','Chỉ worker'],'B','Rò transport detail làm presentation phụ thuộc data implementation.'),
('Network + local DB có tự động atomic không?',['Có','Không, cần outbox/reconciliation/compensation','Có nếu coroutine','Có nếu mutex'],'B','Hai resource khác nhau không nằm trong một transaction local thông thường.'),
('Khi nào dùng Flow trong use case?',['Mọi operation','Khi cần quan sát giá trị thay đổi liên tục','Chỉ upload','Không bao giờ'],'B','Query reactive từ source of truth là trường hợp phù hợp.'),
('Logic UI string nên nằm ở đâu?',['Use case','Presentation mapping/resource layer','Repository','DTO'],'B','Use case trả category typed; presentation chọn wording theo locale.'),
('Granularity tốt của use case dựa trên gì?',['Mỗi endpoint','Actor goal và reason to change','Mỗi table','Mỗi button pixel'],'B','Use case nên phản ánh mục tiêu có nghĩa, không cấu trúc kỹ thuật thuần.'),
('Nhãn nào dùng cho thiết kế đề xuất chưa xác nhận ở Upzi?',['confirmed','inferred','proposed','published'],'C','proposed chỉ rõ đây là phương án thiết kế, không phải tuyên bố đã triển khai.')]
sections[-1]['blocks'] = [{'type':'quiz','question':q,'options':o,'answer':a,'explanation':e} for q,o,a,e in quiz]
lesson={'id':'f06','code':'F06','title':'Use Case','summary':'Thiết kế application use case có contract typed, orchestration, error policy, cancellation, idempotency, transaction và testability mà không tạo pass-through boilerplate.','estimatedMinutes':360,'sections':sections}
assert [s['id'] for s in sections] == CANONICAL
assert len({s['id'] for s in sections}) == 24
assert len(quiz) >= 10
LESSON.parent.mkdir(parents=True,exist_ok=True)
LESSON.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog_path=ROOT/'catalog.json'; catalog=json.loads(catalog_path.read_text())
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='f06': item['status']='published'; item['estimatedMinutes']=360
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')

plan_path=ROOT/'book-plan.json'; plan=json.loads(plan_path.read_text())
if 'f06' not in plan['completed']: plan['completed'].append('f06')
plan['current']='f07'; plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')

idx_path=ROOT/'search-index.json'; idx=json.loads(idx_path.read_text())
entry={'id':'f06','code':'F06','title':'Use Case','path':'data/lessons/f/f06.json','chapter':'Architecture','keywords':['use case','interactor','application service','orchestration','idempotency','transaction','cancellation','typed result']}
if isinstance(idx,list):
    idx=[x for x in idx if x.get('id')!='f06']+[entry]
elif 'lessons' in idx:
    idx['lessons']=[x for x in idx['lessons'] if x.get('id')!='f06']+[entry]
idx_path.write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')

paragraphs=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']
report={'id':'f06','sections':24,'uniqueSectionIds':24,'exactSectionOrder':True,'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':sum(1 for s in sections for b in s['blocks'] if b['type']=='code'),'quizQuestions':len(quiz),'quizAnswersValid':all(x[2] in 'ABCD' for x in quiz),'truthfulnessLabelsPresent':all(k in json.dumps(lesson,ensure_ascii=False) for k in ['confirmed','inferred','proposed','needs-confirmation']),'nextLesson':'f07'}
(ROOT/'validation-f06.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(report)
