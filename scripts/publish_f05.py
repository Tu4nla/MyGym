import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'android-learning' / 'data'

def p(text): return {'type':'paragraph','content':text}
def code(label, text): return {'type':'code','language':'kotlin','label':label,'content':text}
def section(i, sid, title, paragraphs, codes=None):
    blocks=[p(x) for x in paragraphs]
    blocks.extend(code(*x) for x in (codes or []))
    return {'id':sid,'title':f'{i}. {title}','blocks':blocks}

sections=[]
sections.append(section(1,'objectives','Mục tiêu bài học',[
'Hiểu Repository Pattern như một boundary quản lý quyền truy cập dữ liệu và chính sách phối hợp nguồn dữ liệu, không phải lớp đổi tên API service hoặc DAO.',
'Phân biệt repository contract, repository implementation, remote data source, local data source, cache, mapper, use case và single source of truth.',
'Thiết kế repository có contract rõ, error model ổn định, cache policy, consistency rule, concurrency policy, transaction boundary, observability và test strategy phù hợp Android production.',
'Biết nhận diện God Repository, pass-through repository, generic repository, leaking DTO/Room Entity và các thiết kế làm domain phụ thuộc framework.'
]))
sections.append(section(2,'prerequisites','Kiến thức nền',[
'Cần nắm F01 Separation of Concerns, F02 MVVM, F03 MVI/UDF và F04 Clean Architecture, đặc biệt dependency direction, ports/adapters, mapping và composition root.',
'Cần hiểu coroutine, Flow, Room transaction, Retrofit response, Paging, process death, WorkManager, offline-first, idempotency và lifecycle collection.',
'Repository Pattern không tự quyết định UI architecture. Nó có thể phục vụ MVVM, MVI, Compose hoặc View system miễn contract và ownership rõ ràng.'
]))
sections.append(section(3,'terminology','Định nghĩa và chú giải thuật ngữ',[
'Repository là abstraction biểu diễn một collection hoặc capability nghiệp vụ và che giấu chi tiết nguồn dữ liệu khỏi caller. Contract mô tả điều caller được phép kỳ vọng, không mô tả cách Retrofit hoặc Room hoạt động.',
'Remote data source bọc network transport; local data source bọc database, file hoặc preferences. Cache là policy lưu và tái sử dụng dữ liệu, không đồng nghĩa local database.',
'Source of truth là nguồn có quyền quyết định state hiện tại. Cache-aside, read-through, write-through, write-back và stale-while-revalidate là các chiến lược khác nhau.',
'Consistency gồm strong, eventual, read-your-writes và monotonic reads. Freshness là mức mới của dữ liệu; availability là khả năng trả dữ liệu; ba yếu tố này thường có trade-off.',
'Entity trong Repository Pattern có thể là domain object; Room Entity chỉ là persistence model. DTO là transport model. Không nên dùng chung chỉ vì field giống nhau.'
]))
sections.append(section(4,'mechanism','Cơ chế hoạt động bên trong',[
'Caller gọi repository contract. Implementation chọn nguồn dữ liệu, mapping, cache policy, retry, deduplication và transaction. Caller không cần biết dữ liệu đến từ REST, Room, socket hay file.',
'Với offline-first, local database thường là single source of truth. Repository phát Flow từ local, đồng thời refresh remote rồi ghi transaction vào local; UI tự cập nhật qua Flow.',
'Với remote-first, repository gọi network và có thể fallback cache. Với cache-aside, caller hoặc repository kiểm tra cache trước rồi fetch khi miss hoặc stale.',
'Write path cần quyết định optimistic hay pessimistic, idempotency key, conflict resolution, retry durability và rollback. Read path và write path có thể dùng policy khác nhau.',
'Concurrency phải xử lý request trùng, out-of-order response, account switch và invalidation. Mutex, single-flight, flatMapLatest hoặc serialized actor chỉ đúng khi khớp semantics.',
'Repository không nên phát mutable object dùng chung. Mapping sang immutable domain model giúp tránh caller vô tình thay đổi cache hoặc persistence state.'
],[('Repository offline-first tối giản','interface PostRepository {\n    fun observeFeed(): Flow<List<Post>>\n    suspend fun refreshFeed(force: Boolean = false): RefreshResult\n}\n\nclass OfflinePostRepository(\n    private val api: PostApi,\n    private val dao: PostDao,\n    private val clock: Clock\n) : PostRepository {\n    override fun observeFeed(): Flow<List<Post>> =\n        dao.observeAll().map { rows -> rows.map(PostEntity::toDomain) }\n\n    override suspend fun refreshFeed(force: Boolean): RefreshResult {\n        if (!force && dao.isFresh(clock.now())) return RefreshResult.SkippedFresh\n        val dto = api.getFeed()\n        dao.replaceAllInTransaction(dto.map(PostDto::toEntity), clock.now())\n        return RefreshResult.Updated(dto.size)\n    }\n}')]))
sections.append(section(5,'purpose','Mục đích của kỹ thuật',[
'Repository giảm coupling giữa business/presentation logic với transport và storage detail. Thay đổi API, database hoặc cache policy không bắt caller sửa theo nếu contract giữ nguyên.',
'Repository gom data access policy tại một boundary có thể test, quan sát và review. Nó tạo nơi rõ ràng để xử lý mapping, freshness, consistency, retry và source coordination.',
'Mục tiêu không phải tăng số lớp mà là bảo vệ semantics dữ liệu và ownership.'
]))
sections.append(section(6,'problem','Vấn đề kỹ thuật được giải quyết',[
'Không có repository boundary, ViewModel dễ gọi Retrofit, Room và preferences trực tiếp, tự quyết định fallback, tạo logic trùng và inconsistent behavior giữa màn hình.',
'Mỗi caller có thể hiểu lỗi, freshness hoặc cache khác nhau. Một màn hình hiển thị cache cũ, màn hình khác ép network; logout không clear đúng scope; retry tạo duplicate write.',
'Repository giúp chuyển từ “lấy dữ liệu bằng cách nào” sang “hệ thống bảo đảm điều gì về dữ liệu”.'
]))
sections.append(section(7,'when-to-use','Dấu hiệu cần dùng',[
'Dùng khi feature có nhiều nguồn dữ liệu, cache/offline, mapping model, policy retry, pagination, websocket merge hoặc cần thay implementation trong test.',
'Dùng khi business logic cần contract ổn định như observeMessages, sendMessage, refreshFeed hoặc applyJob, thay vì phụ thuộc endpoint và DAO cụ thể.',
'Dùng khi cùng dữ liệu được nhiều caller sử dụng và cần một policy nhất quán về identity, freshness, ownership và mutation.'
]))
sections.append(section(8,'when-not-to-use','Khi không nên dùng',[
'Không cần repository riêng cho wrapper một dòng không thêm contract hoặc policy. Với prototype nhỏ, một data source trực tiếp có thể rõ hơn.',
'Không tạo GenericRepository<T> với CRUD chung cho mọi domain. Nghiệp vụ có semantics khác nhau: sendMessage, acceptOffer, refreshFeed không chỉ là create/update/delete.',
'Không ép mọi helper, formatter hoặc SDK adapter thành repository. Repository chỉ hợp lý khi abstraction mô tả data capability hoặc aggregate nghiệp vụ.'
]))
sections.append(section(9,'requirement','Yêu cầu sản phẩm cụ thể',[
'Feed phải mở từ cache nhanh, refresh nền có TTL, pull-to-refresh ép network, paging không duplicate và account switch không lộ dữ liệu tài khoản cũ.',
'Chat phải hiển thị message optimistic, reconcile clientId/serverId, persist trước hoặc sau send theo policy, reconnect không duplicate và ack timeout có retry kiểm soát.',
'Job detail phải có read-your-writes sau apply/save; trạng thái local và server không được hiển thị mâu thuẫn lâu hơn SLA đã thống nhất.',
'Acceptance criteria gồm source of truth, freshness rule, offline behavior, error taxonomy, retry/idempotency, transaction scope, cancellation, telemetry và test out-of-order response.'
]))
sections.append(section(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: domain/presentation phụ thuộc repository interface; data module implement bằng API/DAO. Interface nên sống gần consumer policy hoặc domain, không mặc định đặt cạnh implementation.',
'Error policy: repository map IOException, HTTP code, SQLiteException và serialization error thành failure typed có ý nghĩa. Không nuốt lỗi và trả empty list vì caller không phân biệt empty thật với failure.',
'Lifecycle: repository không giữ Activity, NavController hoặc screen scope vô cớ. Hot Flow, socket subscription và listener cần owner, sharing policy và cleanup rõ ràng.',
'Process death: cache bền vững phải nằm database/file; in-memory cache chỉ là optimization. Pending write quan trọng cần outbox hoặc WorkManager, không dựa vào viewModelScope.',
'Resource limits: cache có byte/count/TTL budget; paging có page size và maxSize; socket buffer, request queue và retry queue phải bounded; transaction tránh giữ lock quá lâu.',
'Security: partition cache theo account/tenant, redact logs, encrypt dữ liệu nhạy cảm khi cần, clear session đúng thứ tự và không cache token trong domain object.',
'Observability: log cache hit/miss, data age, refresh latency, fallback source, write conflict và retry count bằng metric không chứa PII.'
]))
sections.append(section(11,'minimal-code','Ví dụ code tối giản',[
'Contract nên mô tả behavior thay vì transport. observeConversation trả domain message stream; sendMessage trả receipt typed thay vì Retrofit Response.',
'Một single-flight guard ngăn refresh trùng nhưng phải bảo đảm cancellation của một caller không hủy request dùng chung sai semantics.',
'Room transaction bảo đảm replace snapshot nguyên tử; với write nhiều hệ thống không có distributed transaction, cần outbox hoặc compensation.'
],[('Single-flight refresh có mutex','class FeedRepositoryImpl(\n    private val remote: FeedRemoteDataSource,\n    private val local: FeedLocalDataSource\n) : FeedRepository {\n    private val refreshMutex = Mutex()\n\n    override suspend fun refresh(): RefreshResult = refreshMutex.withLock {\n        val snapshot = remote.fetchFeed()\n        local.replaceSnapshot(snapshot.map(FeedDto::toEntity))\n        RefreshResult.Success\n    }\n}'),('Outbox write bền vững','@Transaction\nsuspend fun enqueueMessage(draft: MessageDraft) {\n    val local = draft.toPendingEntity()\n    messageDao.insert(local)\n    outboxDao.insert(OutboxEntity.sendMessage(local.clientId, local.payload))\n}\n// Worker đọc outbox, gửi idempotency key, rồi cập nhật message + xoá outbox trong transaction.')]))
sections.append(section(12,'upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng Compose, Flow/StateFlow, Paging, Room/WorkManager ở các phần liên quan, Retrofit-style network và Socket.IO chat; chat có optimistic clientId, ack timeout, delivered/read/typing.',
'inferred: các module nhiều khả năng đã có repository hoặc data abstraction, nhưng chưa xác nhận contract cụ thể, source of truth, cache TTL và transaction policy của từng feature.',
'proposed: ChatRepository sở hữu identity reconciliation, local message store, socket/REST merge và outbox; FeedRepository sở hữu Paging RemoteMediator hoặc refresh policy; OpportunityRepository sở hữu read-your-writes cho apply/save.',
'needs-confirmation: cần đối chiếu code production để xác nhận Room schema, repository interfaces, Koin scopes, retry policy, offline behavior và telemetry trước khi kể như kinh nghiệm đã triển khai hoàn chỉnh.'
]))
sections.append(section(13,'alternatives','Phương án thay thế',[
'Data source trực tiếp phù hợp feature rất nhỏ. Gateway thường nhấn mạnh integration với external system; DAO nhấn mạnh persistence; service/application service điều phối use case.',
'CQRS tách read và write model khi semantics khác biệt mạnh. RemoteMediator phù hợp Paging offline-first nhưng vẫn cần repository hoặc boundary để expose API hợp lý.',
'Use case có thể điều phối nhiều repository; repository không nên tự biến thành application service biết toàn bộ workflow.'
]))
sections.append(section(14,'tradeoffs','Lý do lựa chọn và trade-off',[
'Repository tăng testability và thay đổi implementation dễ hơn, nhưng thêm interface, mapper và policy cần duy trì. Nếu không có semantic boundary, nó thành boilerplate.',
'Local database làm source of truth tăng offline capability và consistency trong app, nhưng thêm schema, migration, invalidation và sync complexity.',
'Cache tăng tốc và availability nhưng tạo stale data, memory/disk cost và invalidation problem. TTL đơn giản nhưng không phản ánh mọi thay đổi server.',
'Optimistic write cải thiện UX nhưng cần identity, rollback, conflict resolution và durable retry. Pessimistic write đơn giản hơn nhưng latency cao.',
'Một repository lớn dễ reuse ban đầu nhưng coupling cao; repository theo aggregate/feature rõ hơn nhưng có thể cần coordinator cho workflow liên feature.'
]))
sections.append(section(15,'edge-cases','Edge cases',[
'Request cũ hoàn tất sau request mới và ghi đè snapshot mới; giải pháp cần version, timestamp, ETag hoặc serialized refresh.',
'Logout trong lúc refresh, socket event hoặc WorkManager đang chạy có thể ghi dữ liệu tài khoản cũ vào session mới. Mọi write cần account scope và session generation guard.',
'Clock thiết bị sai làm TTL sai; ưu tiên server timestamp hoặc monotonic clock cho duration trong process.',
'HTTP 304, partial response, pagination overlap, item deletion, tombstone và reordered list cần policy merge rõ ràng.',
'Room emits intermediate states nếu nhiều write không transaction; transaction quá lớn lại gây lock và ANR nếu chạy sai dispatcher.',
'Flow được collect nhiều lần có thể kích hoạt network nhiều lần nếu implementation cold và không chia sẻ đúng scope.',
'Cache corruption, migration failure, disk full, low storage, process kill giữa outbox steps và server success nhưng local timeout đều cần recovery path.'
]))
sections.append(section(16,'mistakes','Sai lầm thường gặp',[
'Repository chỉ gọi api.getX() rồi trả DTO; caller vẫn phụ thuộc transport model và HTTP semantics.',
'Repository trả Room Entity ra UI hoặc nhận Context/NavController, làm dependency direction sai.',
'Dùng catch(Exception) trả emptyList, khiến lỗi biến thành dữ liệu rỗng và telemetry mất tín hiệu.',
'Một repository phụ trách user, feed, chat, analytics, navigation và notification; đó là God Repository.',
'Tạo interface cho mọi class dù chỉ có một implementation và không có boundary meaningful.',
'Cache vô hạn, không partition account, không TTL/invalidation, hoặc clear cache đồng thời làm mất pending write.',
'Dùng collectLatest cho write không idempotent, retry mọi lỗi kể cả 4xx, hoặc không giới hạn exponential backoff.'
]))
sections.append(section(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',[
'Repository Pattern là gì và khác DAO/data source thế nào?',
'Tại sao repository không nên trả Retrofit Response hoặc Room Entity?',
'Bạn chọn local hay remote làm source of truth dựa trên tiêu chí nào?',
'Giải thích cache-aside, stale-while-revalidate và offline-first.',
'Repository interface nên đặt ở domain hay data layer?',
'Làm sao test repository có remote và local source?'
]))
sections.append(section(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Nếu hai refresh chạy đồng thời và response về ngược thứ tự, bạn bảo đảm snapshot mới không bị ghi đè thế nào?',
'Server đã nhận sendMessage nhưng client timeout. Retry sao để không tạo message trùng?',
'Flow từ Room là source of truth, vậy network failure được biểu diễn ở đâu để UI biết cache stale?',
'Khi logout đúng lúc WorkManager sync outbox, cách ngăn dữ liệu user cũ ghi vào database user mới?',
'Interface ở domain có luôn đúng không? Khi nào abstraction thuộc application/presentation consumer thay vì domain?',
'Tại sao repository không phải nơi đặt mọi business rule? Phân biệt data policy và use-case orchestration.',
'Generic Repository có vi phạm gì nếu hệ thống chỉ CRUD? Trả lời cần dựa trên semantics, không tuyệt đối.'
]))
sections.append(section(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm của người học',[
'“Ở Upzi, phần đã xác nhận là app dùng Compose, StateFlow, Paging và Socket.IO; chat có optimistic clientId cùng ack timeout. Tôi xem repository là boundary sở hữu data semantics, không chỉ wrapper API.”',
'“Với chat, tôi sẽ để repository reconcile clientId/serverId, merge socket event với local state và dùng outbox cho retry bền vững. Đây là proposed nếu chưa xác nhận production implementation.”',
'“Khi phỏng vấn, tôi tách rõ confirmed, inferred và proposed; tôi không tuyên bố đã triển khai offline-first hoặc RemoteMediator nếu chưa đối chiếu code.”',
'“Trade-off chính là repository giúp policy nhất quán và test được, nhưng abstraction thừa sẽ thành pass-through. Tôi chỉ tách khi có behavior, nhiều source hoặc boundary cần bảo vệ.”'
]))
sections.append(section(20,'practice','Bài tập thực hành',[
'Xây NewsRepository offline-first: Room là source of truth, refresh có TTL, force refresh, ETag và error metadata.',
'Viết contract test chạy cho FakeNewsRepository và RealNewsRepository để bảo đảm observe, refresh, delete và account partition có cùng semantics.',
'Xây ChatRepository với pending/sent/failed states, clientId, idempotency key, outbox và reconnect dedup.',
'Đo cache hit rate, data age và refresh p95; đề xuất budget và alert threshold.',
'Refactor ViewModel đang gọi Retrofit + DAO trực tiếp sang repository mà không thay đổi UI behavior.'
]))
sections.append(section(21,'scenario','Bài tập tình huống',[
'Tình huống 1: Feed mở nhanh từ cache nhưng dữ liệu cũ 24 giờ. Thiết kế freshness indicator, background refresh, force refresh và fallback khi offline.',
'Tình huống 2: User gửi message, server lưu thành công nhưng response mất. Thiết kế retry không duplicate và reconcile khi socket echo đến trước REST ack.',
'Tình huống 3: User A logout, user B login trong khi sync đang chạy. Thiết kế database partition, session generation và cancellation/guard.',
'Tình huống 4: API trả snapshot thiếu một item do eventual consistency nhưng local vừa optimistic update. Quyết định merge, tombstone hay chờ version mới.',
'Tình huống 5: Repository có 40 method và phụ thuộc 12 data source. Đề xuất boundary lại theo aggregate/capability và migration incremental.'
]))
sections.append(section(22,'checklist','Checklist tự đánh giá',[
'Tôi mô tả được repository contract bằng business/data semantics thay vì endpoint.',
'Tôi xác định rõ source of truth, freshness, fallback và offline behavior.',
'Tôi phân biệt DTO, persistence model, domain model và UI model.',
'Tôi định nghĩa error taxonomy, retry, idempotency và conflict policy.',
'Tôi xử lý duplicate request, out-of-order response, account switch và process death.',
'Tôi đặt lifecycle owner cho hot Flow/socket/listener và giới hạn queue/cache.',
'Tôi có contract test, fake đúng semantics và integration test transaction.',
'Tôi không biến repository thành God class hoặc pass-through layer.',
'Tôi dùng đúng nhãn trung thực khi nói về Upzi.'
]))
sections.append(section(23,'summary','Tóm tắt cần nhớ',[
'Repository là boundary cho data semantics và policy, không phải tên khác của API service.',
'Contract tốt che transport/storage detail nhưng công khai freshness, error và mutation semantics cần thiết.',
'Offline-first thường dùng local database làm source of truth; optimistic write cần identity, idempotency và durable retry.',
'Mapping, transaction, concurrency, account partition, resource limits và observability là phần cốt lõi của repository production.',
'Chỉ thêm abstraction khi nó bảo vệ một boundary meaningful; tránh generic CRUD và God Repository.'
]))
quiz=[
('Repository có vai trò chính nào?',['Đổi tên Retrofit service','Che chi tiết nguồn dữ liệu và bảo vệ data semantics','Render UI','Quản lý NavController'],1,'Repository là boundary của truy cập dữ liệu và policy, không phải UI hay wrapper đổi tên.'),
('Offline-first thường chọn nguồn nào làm source of truth?',['Network response trực tiếp','Local database','ViewModel cache','SharedPreferences luôn luôn'],1,'Database bền vững phát state ổn định; network refresh rồi ghi local.'),
('Tại sao không trả Retrofit Response từ repository?',['Vì Response chậm','Vì làm caller phụ thuộc transport/HTTP detail','Vì không hỗ trợ coroutine','Vì Room không đọc được'],1,'Contract nên dùng domain result và error model ổn định.'),
('Retry sendMessage sau timeout cần gì quan trọng nhất?',['Random delay','Idempotency key và identity reconciliation','Xóa local message','Luôn tạo clientId mới'],1,'Server có thể đã xử lý request; idempotency ngăn duplicate.'),
('catch Exception rồi trả emptyList gây vấn đề gì?',['Tăng memory','Nhầm failure thành dữ liệu rỗng','Không compile','Tự retry vô hạn'],1,'Caller mất khả năng phân biệt empty thật và lỗi.'),
('GenericRepository<T> thường có rủi ro nào?',['Không dùng được Kotlin','Xóa bỏ semantics nghiệp vụ khác nhau','Không mock được','Chỉ dùng với Java'],1,'CRUD chung thường làm mờ capability và invariant riêng.'),
('Flow Room bị collect hai lần có thể gây gì nếu repository cold?',['Hai network refresh ngoài ý muốn','Không có gì tuyệt đối','OOM chắc chắn','ANR chắc chắn'],0,'Cold upstream có thể chạy lại side effect; cần ownership/sharing rõ.'),
('Account switch trong lúc sync cần bảo vệ bằng gì?',['Chỉ clear UI','Account partition và session generation guard','Đổi theme','Tăng timeout'],1,'Cancellation không luôn đủ; write phải kiểm tra scope/session.'),
('TTL dựa trên wall clock thiết bị có rủi ro gì?',['Không serialize được','Clock bị chỉnh làm freshness sai','Không dùng với Room','Luôn âm'],1,'Duration nên dùng monotonic clock trong process hoặc server timestamp.'),
('Repository có nên chứa mọi business workflow không?',['Có, luôn luôn','Không; use case/application service thường điều phối nhiều repository','Chỉ khi dùng Compose','Chỉ khi có DAO'],1,'Repository tập trung data policy; workflow liên capability thuộc application layer.'),
('Outbox giải quyết vấn đề nào?',['Render Compose','Write bền vững và retry sau process death','Navigation deep link','Image caching'],1,'Outbox lưu pending command cùng local state để worker xử lý sau.'),
('Dấu hiệu God Repository là gì?',['Có interface','Phụ trách nhiều capability không liên quan và quá nhiều dependency','Có mapper','Dùng suspend'],1,'Quá nhiều reason to change cho thấy boundary sai.')
]
sections.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[], 'quiz':[{'question':q,'options':o,'answerIndex':a,'explanation':e} for q,o,a,e in quiz]})
lesson={'id':'f05','code':'F05','title':'Repository Pattern','summary':'Thiết kế repository như boundary của data semantics, source of truth, cache, consistency, error, concurrency và durable write.','estimatedMinutes':360,'sections':sections}
(DATA/'lessons'/'f').mkdir(parents=True,exist_ok=True)
(DATA/'lessons'/'f'/'f05.json').write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text())
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='f05':
            item['status']='published'; item['estimatedMinutes']=360
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")

plan=json.loads((DATA/'book-plan.json').read_text())
if 'f05' not in plan['completed']: plan['completed'].append('f05')
plan['current']='f06'
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n")

index=json.loads((DATA/'search-index.json').read_text())
index=[x for x in index if x.get('id')!='f05']
index.append({'id':'f05','code':'F05','title':'Repository Pattern','chapter':'Architecture','path':'data/lessons/f/f05.json','keywords':['repository pattern','source of truth','offline-first','cache','data source','idempotency','outbox','consistency','single-flight']})
(DATA/'search-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+"\n")

ids=[s['id'] for s in sections]
paragraphs=[b['content'] for s in sections for b in s.get('blocks',[]) if b['type']=='paragraph']
report={'id':'f05','sections':len(sections),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide'],'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':sum(1 for s in sections for b in s.get('blocks',[]) if b['type']=='code'),'quizQuestions':len(quiz),'quizAnswersValid':all(0<=a<len(o) for _,o,a,_ in quiz),'truthfulnessLabelsPresent':all(x in ' '.join(paragraphs) for x in ['confirmed:','inferred:','proposed:','needs-confirmation:']),'nextLesson':'f06'}
(DATA/'validation-f05.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
