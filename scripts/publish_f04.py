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
'Hiểu Clean Architecture như tập hợp nguyên tắc tổ chức dependency quanh business policy, không phải sơ đồ ba vòng hay số lượng package cố định.',
'Giải thích được Dependency Rule, boundary, entity, use case, interface adapter, framework/driver và cách ánh xạ chúng vào Android hiện đại với Compose, ViewModel, repository, Room, Retrofit và WorkManager.',
'Thiết kế kiến trúc đủ sạch nhưng không over-engineer: xác định phần cần độc lập, ownership của model, mapping, error, transaction, lifecycle và test strategy.',
'Đánh giá trade-off của pure Kotlin domain, abstraction qua interface, modularization, code generation và migration từ codebase đang chạy.'
]))
sections.append(section(2,'prerequisites','Kiến thức nền',[
'Cần nắm F01 Separation of Concerns, F02 MVVM và F03 MVI/UDF: cohesion, coupling, dependency direction, immutable state, use case, repository contract và side-effect boundary.',
'Cần hiểu Kotlin interface, constructor injection, coroutine, Flow, DTO, database entity, UI model, Android lifecycle, process death và module Gradle.',
'Clean Architecture không thay thế concurrency, persistence hay lifecycle correctness. Nó chỉ tạo boundary để các quyết định đó có nơi sở hữu rõ ràng.'
]))
sections.append(section(3,'terminology','Định nghĩa và chú giải thuật ngữ',[
'Policy là quy tắc nghiệp vụ tương đối ổn định; detail là cơ chế thay đổi thường xuyên như REST, Room, Firebase, Android SDK hoặc UI framework.',
'Dependency Rule yêu cầu source-code dependency hướng vào policy cấp cao. Lớp trong không biết framework, database hay transport cụ thể.',
'Entity trong Clean Architecture là business object và invariant dài hạn, không đồng nghĩa Room Entity. Use case mô tả một mục tiêu người dùng hoặc quy trình nghiệp vụ cụ thể.',
'Interface adapter chuyển dữ liệu giữa dạng phù hợp cho use case và dạng phù hợp cho framework. Gateway hoặc port là contract; adapter là implementation nối contract với detail.',
'Boundary là ranh giới thay đổi, ownership và dependency; không nhất thiết trùng package, module hoặc process.',
'Composition root là nơi ghép implementation cụ thể vào abstraction, thường thông qua DI container ở application/module entry point.'
]))
sections.append(section(4,'mechanism','Cơ chế hoạt động bên trong',[
'UI phát action vào ViewModel hoặc presenter. Presentation gọi use case bằng input model nhỏ. Use case điều phối policy và gọi gateway interface. Adapter triển khai gateway bằng API, database hoặc platform service.',
'Compile-time dependency của domain trỏ đến abstraction do phía policy sở hữu; runtime object graph vẫn đưa implementation bên ngoài vào qua constructor injection.',
'Dữ liệu đi qua boundary bằng model phù hợp. DTO không chảy thẳng vào UI; Room entity không trở thành domain object mặc định; Android Context không đi vào use case chỉ để tiện.',
'Error cũng phải đi qua boundary. IOException, HttpException, SQLiteException được adapter map thành failure có nghĩa với application; presentation map tiếp sang UiState hoặc message.',
'Transaction boundary thường thuộc use case hoặc repository implementation tùy loại consistency. Use case quyết định ý nghĩa nghiệp vụ; adapter quyết định cơ chế transaction.',
'Boundary hiệu quả cho phép thay fake repository trong test, đổi API client, tách module hoặc chạy policy trên JVM mà không kéo Android framework.'
],[('Dependency hướng vào policy','interface OpportunityRepository {\n    suspend fun get(id: OpportunityId): Result<Opportunity>\n}\n\nclass LoadOpportunity(\n    private val repository: OpportunityRepository\n) {\n    suspend operator fun invoke(id: OpportunityId): Result<Opportunity> =\n        repository.get(id)\n}\n\nclass NetworkOpportunityRepository(\n    private val api: OpportunityApi\n) : OpportunityRepository {\n    override suspend fun get(id: OpportunityId) =\n        runCatching { api.get(id.value).toDomain() }\n}')] ))
sections.append(section(5,'purpose','Mục đích của kỹ thuật',[
'Mục đích là bảo vệ business rule khỏi chi tiết có tốc độ thay đổi cao và làm cho dependency, test seam, ownership và failure policy có thể nhìn thấy.',
'Kiến trúc tốt giảm blast radius: thay Retrofit, đổi schema, chuyển Compose hoặc thêm nguồn dữ liệu không buộc sửa mọi tầng.',
'Clean Architecture còn tạo ngôn ngữ chung để review: thay đổi này thuộc policy hay detail, boundary nào bị xuyên thủng, abstraction đang bảo vệ điều gì.'
]))
sections.append(section(6,'problem','Vấn đề kỹ thuật được giải quyết',[
'Code Android dễ gom UI, API, database, mapping và business condition vào Activity hoặc ViewModel. Kết quả là test khó, dependency vòng, lỗi framework lan rộng và thay đổi nhỏ gây sửa nhiều nơi.',
'Một repository quá lớn có thể trở thành lớp chứa mọi logic; DTO dùng toàn app khiến backend thay field làm vỡ UI; Context truyền sâu khiến domain không còn độc lập.',
'Không có boundary, team khó xác định nơi đặt validation, retry, authorization, cache policy, transaction và analytics. Mỗi feature giải quyết khác nhau và behavior trở nên không nhất quán.'
]))
sections.append(section(7,'when-to-use','Dấu hiệu cần dùng',[
'Dùng mạnh khi sản phẩm có business rule đáng kể, nhiều data source, offline/cache, nhiều client, module lớn, vòng đời dài hoặc team nhiều người.',
'Cần boundary rõ khi một thay đổi backend liên tục ảnh hưởng UI, ViewModel khó test, repository phụ thuộc Android API hoặc feature phải hỗ trợ nhiều implementation.',
'Use case hữu ích khi hành động cần validation, kết hợp nhiều repository, transaction, authorization, concurrency policy hoặc được tái sử dụng ở nhiều entry point.'
]))
sections.append(section(8,'when-not-to-use','Khi không nên dùng',[
'Không cần tạo entity, use case, mapper và interface cho từng thao tác đọc một field tĩnh. Boundary không có volatility hoặc policy chỉ tạo pass-through boilerplate.',
'Không chia module chỉ để vẽ đúng sơ đồ. Module tăng build configuration, API surface và coordination cost; package boundary có thể đủ ở giai đoạn đầu.',
'Không ép pure domain nếu feature phụ thuộc chặt Android và không có business value độc lập, ví dụ màn hình chọn quyền hệ thống rất nhỏ. Vẫn cần separation nhưng không cần nghi lễ đầy đủ.',
'Không viết lại toàn bộ codebase để đạt Clean Architecture. Ưu tiên seam quanh phần đang thay đổi hoặc gây lỗi.'
]))
sections.append(section(9,'requirement','Yêu cầu sản phẩm cụ thể',[
'Opportunity Detail phải lấy ID từ navigation, kiểm tra session, tải cache khả dụng, refresh network, map lỗi not-found/forbidden/network và không để DTO xuất hiện trong Compose.',
'Chat Send Message phải tạo clientId, persist optimistic message, gửi socket, xử lý ack timeout, retry idempotent và cập nhật cùng message identity trong một application workflow.',
'Feed reaction phải optimistic nhưng rollback được; authorization và idempotency thuộc application/domain policy, HTTP code và database schema thuộc adapter.',
'Acceptance criteria gồm dependency graph không vòng, domain JVM-testable, mapping test, contract test cho repository, process-death behavior, account-switch isolation và performance budget.'
]))
sections.append(section(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: presentation phụ thuộc use case/domain contract; data phụ thuộc contract để implement; app module làm composition root. Không để domain import android.*, Retrofit annotation, Room annotation hoặc Compose type nếu mục tiêu là pure domain.',
'Error policy: adapter map technical failure sang typed application failure; use case quyết định retry hợp lệ hay không; UI quyết định render. Không nuốt CancellationException và không biến mọi lỗi thành chuỗi.',
'Lifecycle: use case không sở hữu Activity lifecycle. ViewModel sở hữu coroutine phục vụ screen; WorkManager sở hữu durable work; repository quản lý stream/resource theo contract và đóng tài nguyên đúng lúc.',
'Resource limits: boundary không biện minh cho copy object khổng lồ. PagingData, bitmap, Cursor, InputStream và socket handle không nên bị biến thành domain state dài hạn. Dùng ID, metadata hoặc stream abstraction phù hợp.',
'Concurrency: use case công bố semantics như latest-wins, serialize hoặc idempotent; dispatcher là detail có thể inject khi cần. Repository không âm thầm tạo GlobalScope.',
'Transaction: business operation nhiều bước phải xác định atomicity. Nếu local database là source of truth, repository implementation có thể dùng Room transaction nhưng use case vẫn định nghĩa outcome nghiệp vụ.',
'Observability: analytics/logging là cross-cutting concern. Có thể decorate use case/repository hoặc inject interface; không để analytics SDK xâm nhập domain model.'
]))
sections.append(section(11,'minimal-code','Ví dụ code tối giản',[
'Use case chỉ đáng tồn tại khi tên và contract thể hiện policy. Một wrapper chỉ gọi repository mà không thêm semantics vẫn có thể là seam, nhưng cần cân nhắc cost.',
'Mapping nên ở boundary gần nguồn dữ liệu. DTO mapper xử lý nullable/default/version; presentation mapper xử lý format, localization và affordance UI.',
'Composition root ghép implementation, không để ViewModel tự new Retrofit, database hoặc repository.'
],[('Use case có policy rõ','class SendMessage(\n    private val repository: ChatRepository,\n    private val clock: Clock,\n    private val ids: ClientIdGenerator\n) {\n    suspend operator fun invoke(conversationId: String, text: String): SendResult {\n        val normalized = text.trim()\n        require(normalized.isNotEmpty())\n        val draft = OutgoingMessage(ids.next(), conversationId, normalized, clock.now())\n        return repository.enqueueAndSend(draft)\n    }\n}'),('Composition root với Koin','val chatModule = module {\n    single<ChatRepository> { SocketChatRepository(get(), get(), get()) }\n    factory { SendMessage(get(), get(), get()) }\n    viewModel { ChatViewModel(sendMessage = get(), observeChat = get()) }\n}')] ))
sections.append(section(12,'upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng single-activity Compose, ViewModel, Flow, Paging, Koin, Retrofit/Room và Socket.IO; các feature feed, chat, opportunity và deeplink có boundary presentation-data rõ để áp dụng Clean Architecture.',
'confirmed: chat có optimistic clientId, ack timeout, delivered/read/typing; deep link có /opportunity/{id} và /chat/{id}; từng gặp TransactionTooLarge từ SavedStateHandle. Đây là bằng chứng rằng identity, lifecycle và state boundary quan trọng.',
'inferred: project có thể đã dùng repository/use-case ở một số module, nhưng chưa xác nhận dependency direction, model ownership và mức độ Android-free của domain.',
'proposed: tạo feature contracts cho Opportunity, Feed và Chat; domain giữ ID/value object và policy; data adapter map API/Room/socket; app composition root ghép theo flavor; thêm contract test cho cache/network/socket.',
'proposed: SendMessage use case điều phối optimistic persistence, socket send và idempotency; repository adapter xử lý Room transaction và protocol ack; ViewModel chỉ chuyển action thành UiState/effect.',
'needs-confirmation: cần đọc dependency graph, module Gradle, Koin definitions, repository implementation và incident thực tế trước khi mô tả Clean Architecture như đã triển khai đầy đủ trong Upzi.'
]))
sections.append(section(13,'alternatives','Phương án thay thế',[
'Layered architecture đơn giản với UI-service-data có thể đủ nếu dependency và ownership rõ. Hexagonal/Ports and Adapters nhấn mạnh port do core sở hữu và adapter bên ngoài; Onion Architecture gần với Dependency Rule.',
'Feature-first modular architecture tổ chức theo capability sản phẩm, bên trong mỗi feature có presentation/domain/data. Layer-first phù hợp codebase nhỏ nhưng dễ tạo shared layer khổng lồ.',
'Vertical slice ưu tiên hoàn thành use case end-to-end với ít abstraction. Có thể kết hợp: chỉ trích xuất domain boundary khi volatility hoặc policy chứng minh nhu cầu.',
'MVVM và MVI là presentation/data-flow pattern, không thay thế Clean Architecture. Chúng có thể nằm ở vòng ngoài và gọi cùng application use case.'
]))
sections.append(section(14,'tradeoffs','Lý do lựa chọn và trade-off',[
'Pure domain tăng testability và portability nhưng tạo mapping, duplicate model và abstraction. Lợi ích lớn khi business rule ổn định hơn framework; nhỏ khi app chỉ hiển thị dữ liệu.',
'Interface cho mọi class làm code phân mảnh. Chỉ đặt interface tại boundary cần thay implementation, test seam hoặc dependency inversion; concrete class vẫn tốt trong cùng boundary.',
'Multi-module cưỡng chế dependency tốt hơn package nhưng tăng build logic, public API, kapt/ksp overhead và coordination. Bắt đầu bằng package, tách module khi boundary ổn định là chiến lược hợp lý.',
'Use case nhỏ tăng discoverability và permission control nhưng có nguy cơ class explosion. Có thể nhóm theo capability hoặc dùng application service cho workflow liên quan.',
'Mapping bảo vệ boundary nhưng tốn CPU/allocation. Cần tránh map toàn bộ danh sách lớn nhiều lần; dùng paging, lazy mapping hoặc model được thiết kế đúng scope.',
'Abstraction giúp thay detail nhưng không miễn phí. Mỗi abstraction cần trả lời: biến động nào được cô lập, ai sở hữu contract, test nào dựa vào seam này.'
]))
sections.append(section(15,'edge-cases','Edge cases',[
'Domain model cần thời gian, tiền tệ, locale hoặc file. Dùng abstraction/value type phù hợp thay vì kéo Context; nhưng không tự viết thư viện phức tạp khi java.time hoặc standard type đủ.',
'Một API endpoint trả dữ liệu phục vụ nhiều feature. Không nên dùng chung DTO như domain chung; mỗi feature có thể map phần cần thiết và shared kernel chỉ chứa concept thực sự ổn định.',
'Cross-feature workflow như apply opportunity rồi mở chat có thể thuộc application coordinator ở cấp cao hơn, không nhét vào một repository hoặc ViewModel ngẫu nhiên.',
'Offline-first làm source of truth và sync phức tạp. Domain không cần biết Room, nhưng policy conflict, freshness và merge có thể là business concern cần model hóa.',
'Dynamic feature/module split, build flavor và white-label có thể yêu cầu nhiều adapter. Contract phải nhỏ để implementation không kéo dependency không cần thiết.',
'Process death phá object graph in-memory; khôi phục bằng ID/draft tối thiểu và source of truth, không serialize domain graph vào SavedStateHandle.',
'Circular dependency thường xuất hiện khi shared module chứa cả model lẫn helper UI/data. Tách contract nhỏ hoặc đảo dependency tại boundary thay vì tạo module common vô hạn.'
]))
sections.append(section(16,'mistakes','Sai lầm thường gặp',[
'Đồng nhất Clean Architecture với ba folder presentation/domain/data mà dependency vẫn chạy hai chiều và DTO vẫn xuyên mọi tầng.',
'Tạo UseCase cho getter/setter không policy, interface cho mọi class, mapper chuỗi dài và base class generic khó đọc; đây là ceremony chứ không phải architecture.',
'Đặt Android Context, NavController, Retrofit Response, Room Entity hoặc MutableStateFlow trong domain để tiết kiệm vài dòng.',
'Cho repository quyết định toàn bộ business policy, biến repository thành God object. Repository chủ yếu cung cấp collection-like access hoặc gateway; workflow thuộc use case/application service.',
'Domain trả message tiếng Việt/Anh đã format; localization là presentation concern, domain nên trả typed reason hoặc data.',
'Fake test không tuân contract thật khiến test xanh nhưng production sai. Cần contract test chạy cùng suite với fake và implementation khi khả thi.',
'Big-bang rewrite theo sơ đồ lý tưởng. Migration an toàn cần strangler seam, characterization test và đo value sau từng bước.'
]))
sections.append(section(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',[
'Clean Architecture là gì và Dependency Rule nói gì?',
'Entity trong Clean Architecture khác Room Entity thế nào?',
'Use case, repository interface và adapter có trách nhiệm gì?',
'Tại sao domain không nên phụ thuộc Android framework?',
'MVVM/MVI liên hệ với Clean Architecture ra sao?',
'Đặt mapper, error mapping và DI composition root ở đâu?',
'Khi nào không cần use case hoặc repository interface?'
]))
sections.append(section(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Nếu domain module phụ thuộc kotlinx.coroutines Flow thì còn clean không? Câu trả lời cần dựa trên policy của team, stability và mức coupling, không phải giáo điều.',
'Repository interface nên nằm ở domain hay data? Contract thuộc phía tiêu thụ policy; nhưng read-only query đơn giản có thể đặt application contract để tránh domain phình.',
'Có cần model riêng cho DTO, entity, domain và UI không? Chỉ khi semantics hoặc lifecycle khác; duplicate có mục đích khác duplicate máy móc.',
'Use case gọi nhiều repository và một bước thất bại giữa chừng thì rollback ở đâu? Phải phân biệt business compensation với database transaction mechanism.',
'Fake repository có làm kiến trúc tốt hơn mock không? Chỉ khi fake phản ánh contract, concurrency và error semantics; fake đơn giản quá có thể che bug.',
'Clean Architecture có cải thiện performance không? Không trực tiếp; mapping/module/abstraction có cost, nhưng boundary giúp đo và thay detail. Cần benchmark thay vì khẳng định.',
'Làm sao migrate codebase legacy mà không dừng phát triển? Tạo seam quanh flow cần sửa, characterization test, tách model/contract, di chuyển dependency từng bước và tránh rewrite toàn bộ.'
]))
sections.append(section(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm của người học',[
'Mẫu trả lời trung thực: Trong dự án Android Compose, tôi ưu tiên dependency direction từ presentation vào application/domain contract, còn Retrofit, Room và Socket.IO là adapter được inject bằng Koin.',
'Có thể nói confirmed rằng Upzi dùng Compose, ViewModel, Flow, Paging, Koin, Retrofit/Room và Socket.IO; không nên khẳng định toàn bộ codebase đã theo Clean Architecture nếu chưa kiểm tra module và dependency graph.',
'Ví dụ hợp lý: với chat, tôi sẽ đặt policy gửi message optimistic và idempotency trong use case, repository adapter chịu persistence/protocol, ViewModel chịu UiState. Đây phải được ghi là proposed nếu chưa triển khai thật.',
'Một câu trả lời tốt nêu vấn đề, boundary chọn, dependency trước/sau, trade-off, test strategy và kết quả đo; tránh chỉ đọc tên layer.'
]))
sections.append(section(20,'practice','Bài tập thực hành',[
'Vẽ dependency graph của một feature hiện tại và đánh dấu mọi import Android/Retrofit/Room đi vào phần policy.',
'Refactor Opportunity Detail: tạo ID value object, domain model, repository contract, network adapter, mapper, use case và ViewModel; viết unit test không dùng Android runtime.',
'Viết contract test cho repository get(id): success, not found, forbidden, offline cache, stale cache và cancellation.',
'Tạo decorator analytics cho một use case mà domain không import analytics SDK.',
'Đo allocation trước/sau khi thêm mapping cho danh sách lớn và đề xuất tối ưu không phá boundary.'
]))
sections.append(section(21,'scenario','Bài tập tình huống',[
'Tình huống 1: backend đổi field salary từ số sang object. Xác định adapter, mapper, domain và UI nào cần thay; thiết kế để UI không biết schema transport.',
'Tình huống 2: gửi chat cần lưu local, gửi socket, retry sau process death và tránh duplicate. Vẽ workflow, transaction/compensation, identity và ownership.',
'Tình huống 3: team muốn tạo module domain cho màn permission nhỏ. Phân tích value, volatility và chọn mức abstraction tối thiểu.',
'Tình huống 4: hai feature phụ thuộc module common chứa 80 model. Thiết kế shared kernel nhỏ hoặc contract module để loại dependency vòng.',
'Tình huống 5: repository hiện chứa navigation và toast. Lập kế hoạch migration từng bước không làm gián đoạn release.'
]))
sections.append(section(22,'checklist','Checklist tự đánh giá',[
'Tôi phân biệt được policy và detail.',
'Tôi giải thích được dependency source code khác runtime object graph.',
'Tôi biết contract thuộc phía nào và vì sao.',
'Tôi không để DTO, Room Entity hoặc Context xuyên boundary không cần thiết.',
'Tôi xác định được ownership của validation, transaction, retry và error mapping.',
'Tôi biết khi nào use case/interface/module là thừa.',
'Tôi có test ở reducer/use case/mapper/repository contract và integration boundary.',
'Tôi xem xét lifecycle, cancellation, process death, account switch và resource limits.',
'Tôi có chiến lược migration incremental thay vì rewrite.',
'Tôi mô tả Upzi đúng nhãn confirmed/inferred/proposed/needs-confirmation.'
]))
sections.append(section(23,'summary','Tóm tắt cần nhớ',[
'Clean Architecture là dependency và boundary, không phải tên folder.',
'Policy cấp cao không phụ thuộc framework/detail; runtime implementation được inject tại composition root.',
'Model, error và resource phải được chuyển đổi tại boundary có ownership rõ.',
'Use case chứa application workflow hoặc policy có nghĩa; repository là gateway, không phải nơi chứa mọi logic.',
'Abstraction, mapping và module đều có chi phí. Chỉ thêm khi bảo vệ volatility, test seam hoặc dependency quan trọng.',
'Kiến trúc tốt phải hỗ trợ lifecycle, concurrency, process death, performance và migration thực tế.',
'Tính trung thực khi kể kinh nghiệm quan trọng hơn việc gắn nhãn Clean Architecture cho toàn bộ dự án.'
]))

questions=[
('Dependency Rule yêu cầu điều gì?',['Framework phụ thuộc domain policy','Domain phụ thuộc Retrofit','UI và data phụ thuộc lẫn nhau','Mọi class phải có interface'],0,'Dependency source code phải hướng vào policy ổn định; detail/framework ở ngoài phụ thuộc contract bên trong.'),
('Room Entity có mặc định là Clean Architecture Entity không?',['Có','Không','Chỉ khi dùng Compose','Chỉ khi có @Parcelize'],1,'Room Entity là persistence model; Clean Architecture Entity là business object/invariant. Có thể trùng trong app nhỏ nhưng không đồng nghĩa.'),
('Nơi phù hợp nhất để ghép implementation cụ thể vào interface là đâu?',['Domain entity','Composition root/DI module','DTO mapper','Composable leaf'],1,'Composition root biết concrete implementation và cấu hình object graph.'),
('Use case nào có giá trị rõ nhất?',['GetName chỉ gọi repository.getName','SendMessage điều phối validation, optimistic persistence và idempotency','Wrapper cho println','Class chứa Context'],1,'Use case có giá trị khi biểu diễn workflow/policy hoặc tạo boundary có ý nghĩa.'),
('IOException nên đi thẳng đến UI không?',['Luôn luôn','Không; adapter nên map sang failure phù hợp rồi presentation map tiếp','Chỉ trên Android 14','Chỉ với Flow'],1,'Technical exception thuộc detail; boundary cần typed error để tránh framework leakage.'),
('Clean Architecture và MVVM quan hệ thế nào?',['Hai khái niệm loại trừ nhau','MVVM là presentation pattern có thể nằm trong Clean Architecture','MVVM thay thế repository','Clean Architecture chỉ dùng XML'],1,'MVVM tổ chức presentation; Clean Architecture định hướng dependency/boundary toàn hệ thống.'),
('Có nên tạo interface cho mọi class?',['Có','Không; chỉ tại boundary cần inversion, substitution hoặc test seam','Chỉ cho data class','Chỉ trong debug'],1,'Interface không miễn phí và không tự tạo architecture.'),
('Ai nên sở hữu HTTP status mapping?',['Domain entity','Data adapter gần transport boundary','Composable','NavController'],1,'Adapter hiểu transport và map sang application/domain failure.'),
('Lưu toàn bộ domain graph vào SavedStateHandle có phù hợp không?',['Có','Không; chỉ lưu input/draft nhỏ và tái tạo từ source of truth','Chỉ khi dùng Parcelable','Chỉ với Koin'],1,'Saved state có giới hạn và process death nên phục hồi từ ID/source of truth.'),
('Multi-module có bắt buộc để đạt Clean Architecture không?',['Có','Không','Chỉ cho app trên Play Store','Chỉ khi có Room'],1,'Package boundary có thể đủ; module là công cụ cưỡng chế dependency với chi phí riêng.'),
('Repository nên chứa navigation và toast không?',['Có','Không; đó là presentation/platform concern','Chỉ khi offline','Chỉ khi repository singleton'],1,'Repository là gateway dữ liệu/capability, không nên điều khiển UI.'),
('Cách migrate an toàn nhất là gì?',['Rewrite toàn bộ','Tạo seam quanh flow cần sửa, thêm characterization test và di chuyển dependency từng bước','Đổi tên folder','Tạo BaseUseCase'],1,'Migration incremental giảm rủi ro và cho phép đo giá trị từng bước.')
]
sections.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[{'type':'quiz','questions':[{'question':q,'options':o,'answer':a,'explanation':e} for q,o,a,e in questions]}]})

lesson={'id':'f04','code':'F04','title':'Clean Architecture','summary':'Thiết kế dependency và boundary quanh business policy với entity, use case, port/adapter, mapping, error, transaction, lifecycle, testing và migration thực tế trên Android.','estimatedMinutes':360,'sections':sections}

lesson_path=DATA/'lessons'/'f'/'f04.json'
lesson_path.parent.mkdir(parents=True,exist_ok=True)
lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text(encoding='utf-8'))
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='f04':
            item['status']='published'; item['estimatedMinutes']=360
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

plan=json.loads((DATA/'book-plan.json').read_text(encoding='utf-8'))
if 'f04' not in plan['completed']: plan['completed'].append('f04')
plan['current']='f05'
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

idx_path=DATA/'search-index.json'
idx=json.loads(idx_path.read_text(encoding='utf-8'))
entry={'id':'f04','code':'F04','title':'Clean Architecture','summary':lesson['summary'],'path':'data/lessons/f/f04.json','keywords':['clean architecture','dependency rule','entity','use case','port adapter','repository','mapping','composition root','android architecture']}
if isinstance(idx,list):
    idx=[x for x in idx if x.get('id')!='f04']; idx.append(entry)
elif isinstance(idx,dict) and isinstance(idx.get('items'),list):
    idx['items']=[x for x in idx['items'] if x.get('id')!='f04']; idx['items'].append(entry)
else:
    raise RuntimeError('Unsupported search-index schema')
idx_path.write_text(json.dumps(idx,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

ids=[s['id'] for s in sections]
expected=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
paragraphs=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']
report={'id':'f04','sections':len(sections),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==expected,'paragraphs':len(paragraphs),'paragraphCharacters':sum(len(x) for x in paragraphs),'codeBlocks':sum(1 for s in sections for b in s['blocks'] if b['type']=='code'),'quizQuestions':len(questions),'quizAnswersValid':all(0<=a<len(o) and bool(e) for _,o,a,e in questions),'truthfulnessLabelsPresent':all(x in '\n'.join(paragraphs) for x in ['confirmed:','inferred:','proposed:','needs-confirmation:']),'nextLesson':'f05'}
assert report['sections']==24 and report['uniqueSectionIds']==24 and report['exactSectionOrder']
assert report['quizQuestions']>=10 and report['quizAnswersValid'] and report['truthfulnessLabelsPresent']
(DATA/'validation-f04.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
