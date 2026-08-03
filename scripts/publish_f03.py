import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'

def p(x): return {'type':'paragraph','content':x}
def code(label,x): return {'type':'code','language':'kotlin','label':label,'content':x}
def section(i,id,title,paras,codes=None):
    blocks=[p(x) for x in paras]
    blocks += [code(a,b) for a,b in (codes or [])]
    return {'id':id,'title':f'{i}. {title}','blocks':blocks}

S=[]
S.append(section(1,'objectives','Mục tiêu bài học',[
'Hiểu MVI và Unidirectional Data Flow như một mô hình quản lý state, event và side effect có hướng đi rõ ràng: UI phát intent/action, logic xử lý tạo state mới, UI render từ state.',
'Phân biệt MVI với MVVM thông thường, Redux-style reducer, state machine và event-driven architecture; nhận diện phần cốt lõi có giá trị thay vì sao chép framework hoặc boilerplate.',
'Thiết kế feature có immutable state, typed action, reducer thuần, effect handler, concurrency policy, lifecycle collection, process-death strategy và test deterministic đủ dùng trong sản phẩm Android thực tế.'
]))
S.append(section(2,'prerequisites','Kiến thức nền',[
'Cần nắm F01 Separation of Concerns và F02 MVVM: ViewModel scope, StateFlow, immutable UiState, one-time effect, SavedStateHandle, lifecycle-aware collection và error mapping.',
'Cần hiểu coroutine cancellation, Flow operators, sealed interface, data class copy, repository contract và Compose recomposition. MVI không thay thế các kiến thức này mà tổ chức chúng thành một pipeline nhất quán.'
]))
S.append(section(3,'terminology','Định nghĩa và chú giải thuật ngữ',[
'Intent hoặc Action là mô tả typed về điều đã xảy ra hoặc điều người dùng muốn thực hiện. State là ảnh chụp bất biến của dữ liệu cần render. Reducer nhận state hiện tại và action/result để tạo state mới.',
'Effect là công việc không thuần như network, database, analytics, navigation, toast hoặc mở system picker. Result hoặc Mutation là dữ liệu quay về từ effect để reducer cập nhật state.',
'Unidirectional Data Flow là luồng một chiều: event đi vào, state đi ra. Single source of truth nghĩa là tại một thời điểm UI lấy trạng thái từ một nguồn có quyền sở hữu rõ ràng.',
'MVI có nhiều biến thể. Tên Model-View-Intent không bảo đảm implementation đúng; giá trị nằm ở event contract, state transition, effect boundary và khả năng replay/test.'
]))
S.append(section(4,'mechanism','Cơ chế hoạt động bên trong',[
'UI chỉ render state và gửi action. Store hoặc ViewModel serialize action vào processor. Reducer thuần tạo state mới; effect handler chạy side effect rồi phát result trở lại pipeline.',
'Immutable state giúp mỗi transition có before/after rõ ràng, giảm shared mutable state và thuận lợi cho logging, replay, snapshot test. Tuy nhiên copy state lớn có thể tạo allocation nếu thiết kế model kém.',
'Pipeline phải quyết định ordering. Search thường latest-wins; submit payment cần first-wins hoặc serialize; toggle local có thể optimistic; refresh cần deduplicate. Không có policy, action cạnh tranh sẽ ghi đè state hoặc tạo request trùng.',
'Compose collect StateFlow theo lifecycle và render idempotent. Recomposition không được phát lại action khởi tạo tùy tiện; initial load nên được guard trong ViewModel hoặc derive từ state machine.'
],[('Reducer thuần','data class FeedState(val loading:Boolean=false,val items:List<PostUi> = emptyList(),val error:String?=null)\nsealed interface FeedMutation { data object Loading:FeedMutation; data class Data(val items:List<PostUi>):FeedMutation; data class Failed(val message:String):FeedMutation }\nfun reduce(s:FeedState,m:FeedMutation)=when(m){\n FeedMutation.Loading -> s.copy(loading=true,error=null)\n is FeedMutation.Data -> s.copy(loading=false,items=m.items)\n is FeedMutation.Failed -> s.copy(loading=false,error=m.message)\n}')]))
S.append(section(5,'purpose','Mục đích của kỹ thuật',[
'MVI làm rõ ai sở hữu state, state thay đổi bởi action nào và side effect nằm ở đâu. Điều này hữu ích khi màn hình có nhiều nguồn sự kiện, optimistic update, retry, pagination hoặc websocket.',
'Mục tiêu không phải biến mọi click thành hàng chục class mà là tạo state transition có thể đọc, test và điều tra. MVI tốt làm giảm trạng thái bất khả thi và race condition.'
]))
S.append(section(6,'problem','Vấn đề kỹ thuật được giải quyết',[
'Ở UI phức tạp, nhiều MutableStateFlow hoặc callback cập nhật độc lập có thể tạo loading sai, dữ liệu cũ ghi đè mới, effect chạy lặp sau rotation và UI khó tái hiện bug.',
'MVI gom transition vào một pipeline và bắt đội phát triển định nghĩa state/action/effect contract. Log action cùng state diff giúp truy vết hành vi tốt hơn callback rời rạc.'
]))
S.append(section(7,'when-to-use','Dấu hiệu cần dùng',[
'Dùng khi feature có state phức tạp, nhiều action cạnh tranh, optimistic update, offline queue, websocket, undo, wizard nhiều bước hoặc yêu cầu audit/replay transition.',
'MVI phù hợp khi team cần convention thống nhất giữa nhiều feature Compose và chấp nhận đầu tư reducer/effect/test tooling.'
]))
S.append(section(8,'when-not-to-use','Khi không nên dùng',[
'Không cần full MVI cho màn hình tĩnh, form rất nhỏ hoặc CRUD đơn giản khi MVVM với immutable UiState đã rõ. Boilerplate không tự tạo chất lượng.',
'Không dùng một global store cho toàn app chỉ vì Redux quen thuộc. Global state làm coupling, memory retention, testing và ownership khó hơn; ưu tiên store theo feature hoặc navigation scope.'
]))
S.append(section(9,'requirement','Yêu cầu sản phẩm cụ thể',[
'Chat phải hiển thị message optimistic ngay, cập nhật ack/delivered/read theo cùng message identity, retry không tạo bản sao và reconnect không làm state lùi về snapshot cũ.',
'Feed phải xử lý refresh, paging, reaction optimistic và rollback. Refresh mới không được bị request cũ ghi đè; scroll state không nằm trong domain store nếu chỉ là concern của UI.',
'Acceptance criteria gồm transition table, concurrency policy cho từng action, effect delivery policy, process-death behavior, analytics privacy, test duplicate action và test out-of-order result.'
]))
S.append(section(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: reducer là pure Kotlin; effect handler phụ thuộc use case/repository qua interface; Android API nằm ở UI hoặc platform adapter. Store không nên giữ Activity, NavController hoặc Context ngắn hạn.',
'Error policy: technical exception được map thành domain/result typed; state giữ lỗi render bền vững, effect dùng cho thông báo thật sự nhất thời. Retry action phải chứa đủ context nhưng không mang object lớn.',
'Lifecycle: StateFlow có thể replay state khi UI quay lại; effect không nên vô tình replay. SavedStateHandle chỉ lưu input nhỏ hoặc draft quan trọng, không serialize toàn bộ store.',
'Resource limits: action queue phải bounded hoặc có conflation phù hợp; state không chứa bitmap, PagingData snapshot khổng lồ hay history vô hạn. Logging action phải redact token và PII.',
'Tính đúng đắn cần xét ordering, idempotency, cancellation, process death, account switch và source of truth; reducer thuần không tự giải quyết các vấn đề này.'
]))
S.append(section(11,'minimal-code','Ví dụ code tối giản',[
'Một ViewModel có thể nhận Action qua Channel, chuyển thành Mutation bằng effect processor rồi scan/reduce thành StateFlow. Với feature nhỏ, xử lý trực tiếp trong onAction vẫn là UDF nếu state transition có một chủ sở hữu.',
'Tách reducer chỉ khi nó mang lại testability hoặc transition đủ phức tạp. Tránh framework hóa quá sớm.'
],[('Store tối giản trong ViewModel','class FeedViewModel(private val repo:FeedRepository):ViewModel(){\n private val actions=MutableSharedFlow<FeedAction>(extraBufferCapacity=32)\n private val _state=MutableStateFlow(FeedState())\n val state:StateFlow<FeedState> = _state\n fun onAction(a:FeedAction){ actions.tryEmit(a) }\n init { viewModelScope.launch { actions.collectLatest { a -> when(a){\n   FeedAction.Refresh -> runCatching { repo.refresh() }\n     .onStart { _state.update { reduce(it,FeedMutation.Loading) } }\n     .onSuccess { x -> _state.update { reduce(it,FeedMutation.Data(x)) } }\n     .onFailure { e -> _state.update { reduce(it,FeedMutation.Failed(e.userMessage())) } }\n } } } }\n}')]))
S.append(section(12,'upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng Compose, ViewModel, StateFlow, Paging và Socket.IO; chat có optimistic clientId, ack timeout, delivered/read/typing và grouping message. Đây là bối cảnh tự nhiên để áp dụng UDF theo feature.',
'inferred: một số flow hiện tại có thể đã mang đặc trưng MVI dù không gọi tên như action vào và state ra, nhưng chưa xác nhận reducer/store chuẩn hóa ở từng module.',
'proposed: định nghĩa ChatAction, ChatMutation, ChatState và ChatEffect; normalize message theo clientId/serverId; serialize ack transition; tách socket effect khỏi reducer; test reconnect và out-of-order event.',
'needs-confirmation: cần đối chiếu code production, ownership của chat state, cơ chế dedup, Paging integration và effect navigation trước khi trình bày như kinh nghiệm đã triển khai đầy đủ MVI.'
]))
S.append(section(13,'alternatives','Phương án thay thế',[
'MVVM với StateFlow và các hàm intent riêng có thể đạt UDF mà không cần reducer formal. Elm/Redux dùng reducer và store nghiêm ngặt hơn; state machine phù hợp flow hữu hạn có transition rõ.',
'Actor model hoặc event sourcing phù hợp bài toán khác. Event sourcing lưu event như dữ liệu nghiệp vụ lâu dài; MVI thường chỉ quản lý presentation state trong process.'
]))
S.append(section(14,'tradeoffs','Lý do lựa chọn và trade-off',[
'MVI tăng predictability và testability nhưng thêm type, reducer, mapping và convention. Lợi ích tăng theo độ phức tạp của state, không theo số lượng màn hình.',
'Một state duy nhất dễ quan sát nhưng copy object lớn và invalidation rộng. Có thể chia sub-state ổn định, dùng persistent collection hoặc derive state có kiểm soát.',
'Serialize action loại race nhưng có thể tăng latency. collectLatest hủy việc cũ tốt cho search nhưng nguy hiểm cho submit không idempotent.',
'Time-travel logging hỗ trợ debug nhưng tốn memory và có rủi ro dữ liệu nhạy cảm; chỉ bật debug, giới hạn ring buffer và redact payload.'
]))
S.append(section(15,'edge-cases','Edge cases',[
'Kết quả request cũ về sau request mới; websocket event đến trước REST snapshot; ack trùng; process chết sau optimistic update nhưng trước persistence; logout khi queue còn action.',
'One-time effect có thể mất khi UI chưa collect hoặc lặp khi dùng state flag không consume đúng. Với hành động quan trọng, biểu diễn kết quả trong state hoặc persistence thay vì event best-effort.',
'Compose recomposition, navigation back stack nhiều instance, multi-window và shared ViewModel sai scope có thể tạo nhiều collector/action source.',
'Infinite action loop xảy ra khi state change tự phát action không có guard. Reducer cũng có thể tạo impossible state nếu boolean độc lập thay vì sealed screen state.'
]))
S.append(section(16,'mistakes','Sai lầm thường gặp',[
'Gọi mọi hàm ViewModel là intent nhưng vẫn mutate nhiều state rời rạc; reducer chạy network; UI tự sửa state; dùng Any hoặc string action; effect chứa dữ liệu nghiệp vụ cần bền vững.',
'Tạo một BaseMviViewModel khổng lồ, global store hoặc abstraction generic khó đọc. Convention nên phục vụ feature chứ không ép mọi feature vào một engine.',
'Không định nghĩa concurrency policy; dùng collectLatest cho payment; dùng SharedFlow replay cho navigation; giữ toàn bộ history state production.',
'Nhầm MVI với Clean Architecture. MVI chủ yếu là presentation/data-flow pattern; dependency direction và domain boundary là concern khác.'
]))
S.append(section(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',[
'MVI là gì; UDF là gì; intent, state, reducer và effect khác nhau ra sao; reducer vì sao nên pure; one-time event xử lý thế nào; MVI khác MVVM ở đâu.',
'Câu trả lời tốt mô tả pipeline action -> effect/result -> reducer -> state -> render, sau đó nêu concurrency, lifecycle và trade-off thay vì chỉ đọc tên ba chữ M-V-I.'
]))
S.append(section(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Nếu hai refresh trả kết quả ngược thứ tự, pipeline bảo đảm state mới nhất thế nào? Nếu action queue đầy, drop, suspend hay conflate? Vì sao mỗi lựa chọn khác nhau?',
'Navigation nên là effect hay state? Không có đáp án tuyệt đối: điều hướng nhất thời có thể là effect, còn flow bắt buộc phải phục hồi sau process death cần state/persistence.',
'MVI có luôn single state object không? Không bắt buộc; điều bắt buộc thực tế là ownership và direction rõ. Có thể có sub-store nếu boundary hợp lý.',
'Tại sao reducer pure vẫn có bug? Vì contract mutation sai, event ordering sai, source of truth sai hoặc state model cho phép trạng thái bất khả thi.'
]))
S.append(section(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm của người học',[
'Có thể trả lời trung thực: ở Upzi tôi đã làm ViewModel/StateFlow và các flow chat optimistic. confirmed là clientId, ack timeout và event delivered/read; đây là nền tảng UDF.',
'Không nên nói đã triển khai Redux/MVI toàn app nếu chưa xác nhận. Có thể nói proposed rằng sẽ chuẩn hóa action/mutation/state, tách socket effect và test out-of-order event.',
'Mẫu STAR nên nêu triệu chứng duplicate hoặc race, state ownership, policy dedup/cancellation, test reconnect và kết quả đo được; nếu chưa có metric thì nói rõ chưa đo.'
]))
S.append(section(20,'practice','Bài tập thực hành',[
'Xây Search feature với QueryChanged, Retry, Clear; debounce 300 ms; latest-wins; state gồm query/loading/results/error; test kết quả cũ không ghi đè mới.',
'Xây reaction optimistic cho post: update local, gọi API, rollback khi lỗi, dedup double tap và giữ server source of truth.',
'Viết reducer test theo bảng Given state, When mutation, Then state; thêm property test rằng loading và terminal error không đồng thời nếu contract cấm.'
]))
S.append(section(21,'scenario','Bài tập tình huống',[
'Chat nhận message REST snapshot, socket new-message và ack local cùng lúc. Hãy thiết kế identity, ordering, merge rule, persistence và action/result types.',
'Form đăng ký nhiều bước cần quay lại, process death và submit đúng một lần. Quyết định phần nào là state, effect, SavedStateHandle và server idempotency key.',
'Feed dùng Paging nhưng cần reaction optimistic. Trình bày cách không copy toàn bộ danh sách vào UiState và cách overlay local mutation lên Paging stream.'
]))
S.append(section(22,'checklist','Checklist tự đánh giá',[
'Tôi xác định được owner của state và đường đi action -> result -> state.',
'Tôi phân biệt persistent state với one-time effect và biết delivery guarantee.',
'Tôi khai báo concurrency policy cho search, refresh, submit và optimistic action.',
'Tôi giữ reducer pure, effect có boundary và error typed.',
'Tôi xử lý duplicate, stale result, process death, account switch và queue limit.',
'Tôi không dùng MVI boilerplate cho feature quá đơn giản và không tạo global store vô lý.'
]))
S.append(section(23,'summary','Tóm tắt cần nhớ',[
'MVI có giá trị khi tạo một chiều dữ liệu, state ownership và transition có thể kiểm chứng; tên pattern không quan trọng bằng contract.',
'Reducer thuần giúp test, nhưng correctness còn phụ thuộc effect, ordering, idempotency, lifecycle và source of truth.',
'State là dữ liệu render bền vững; effect là tương tác ngoài hoặc thông báo nhất thời. Hành động quan trọng cần guarantee nên nằm trong state/persistence.',
'Áp dụng theo độ phức tạp: UDF nhẹ trong ViewModel trước, formal reducer/store khi feature thật sự cần.'
]))
quiz=[]
qs=[
('Đặc điểm cốt lõi của UDF là gì?',['UI và repository cùng mutate state','Event đi vào một hướng, state đi ra một hướng','Mọi state phải global','Mọi action chạy song song'],1,'UDF yêu cầu ownership và hướng dữ liệu rõ, không yêu cầu global store.'),
('Reducer lý tưởng nên có tính chất nào?',['Pure và deterministic','Gọi network trực tiếp','Giữ Activity','Phát navigation'],0,'Reducer thuần nhận input và trả state mới, side effect nằm ngoài.'),
('Search query mới đến khi request cũ đang chạy nên thường dùng policy nào?',['first-wins','latest-wins','không hủy bao giờ','global mutex vô hạn'],1,'Search thường chỉ quan tâm kết quả query mới nhất.'),
('Submit thanh toán nên tránh policy nào?',['serialize','idempotency key','first-wins','collectLatest hủy request tùy tiện'],3,'Hủy tùy tiện một submit không idempotent có thể tạo trạng thái không xác định.'),
('Navigation luôn phải là SharedFlow replay=1 đúng không?',['Đúng','Sai'],1,'Replay có thể phát lại navigation; policy phụ thuộc yêu cầu phục hồi.'),
('MVI và Clean Architecture có đồng nghĩa không?',['Có','Không'],1,'MVI là data-flow/presentation pattern; Clean Architecture nói về dependency boundaries.'),
('State có nên chứa Bitmap lớn không?',['Có để render nhanh','Không, nên giữ reference/data phù hợp và cache có budget'],1,'State lớn làm memory và copy cost tăng.'),
('Kết quả request cũ về muộn cần xử lý bằng gì?',['Tin kết quả cuối cùng đến','Generation/key/cancellation policy','Thread.sleep','Global variable'],1,'Cần gắn identity hoặc cancellation để stale result không ghi đè.'),
('One-time effect quan trọng cần không được mất nên làm gì?',['Dùng best-effort event','Biểu diễn bằng state hoặc persistence có acknowledgement','Toast','Logcat'],1,'Guarantee yêu cầu stateful/persistent protocol.'),
('Global store luôn tốt hơn feature store?',['Đúng','Sai'],1,'Global store tăng coupling và phạm vi invalidation.'),
('Reducer pure có tự giải quyết duplicate socket event không?',['Có','Không'],1,'Cần identity, merge và idempotency contract.'),
('Áp dụng hợp lý cho màn CRUD nhỏ là gì?',['Luôn full Redux framework','MVVM/UDF nhẹ nếu đã đủ rõ','Global event sourcing','Một reducer cho toàn app'],1,'Pattern nên tỷ lệ với độ phức tạp.'),
]
for i,(q,o,a,e) in enumerate(qs,1): quiz.append({'id':f'q{i}','question':q,'options':o,'answerIndex':a,'explanation':e})
S.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[{'type':'quiz','questions':quiz}]})
lesson={'id':'f03','code':'F03','title':'MVI và Unidirectional Data Flow','summary':'Thiết kế luồng dữ liệu một chiều với typed action, immutable state, reducer, effect, concurrency policy và kiểm thử deterministic.','estimatedMinutes':360,'sections':S}
(DATA/'lessons'/'f').mkdir(parents=True,exist_ok=True)
(DATA/'lessons'/'f'/'f03.json').write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text())
for ch in catalog['chapters']:
  for l in ch['lessons']:
    if l['id']=='f03': l['status']='published'; l['estimatedMinutes']=360
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')

plan=json.loads((DATA/'book-plan.json').read_text())
if 'f03' not in plan['completed']: plan['completed'].append('f03')
plan['current']='f04'
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')

idx=json.loads((DATA/'search-index.json').read_text())
entry={'id':'f03','code':'F03','title':'MVI và Unidirectional Data Flow','path':'data/lessons/f/f03.json','keywords':['mvi','unidirectional data flow','udf','intent','action','reducer','effect','state','mutation','store']}
if isinstance(idx,list):
  idx=[x for x in idx if x.get('id')!='f03']+[entry]
elif 'items' in idx:
  idx['items']=[x for x in idx['items'] if x.get('id')!='f03']+[entry]
(DATA/'search-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')

ids=[x['id'] for x in S]
paras=sum(1 for s in S for b in s['blocks'] if b['type']=='paragraph')
chars=sum(len(b['content']) for s in S for b in s['blocks'] if b['type']=='paragraph')
codes=sum(1 for s in S for b in s['blocks'] if b['type']=='code')
validation={'id':'f03','sections':len(S),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide'],'paragraphs':paras,'paragraphCharacters':chars,'codeBlocks':codes,'quizQuestions':len(quiz),'quizAnswersValid':all(0<=q['answerIndex']<len(q['options']) and q['explanation'] for q in quiz),'truthfulnessLabelsPresent':all(x in json.dumps(lesson,ensure_ascii=False) for x in ['confirmed','inferred','proposed','needs-confirmation']),'nextLesson':'f04'}
(DATA/'validation-f03.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print(validation)
