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
'Hiểu Separation of Concerns (SoC) là nguyên tắc phân chia hệ thống theo trách nhiệm và lý do thay đổi, không chỉ là tách file, package hoặc tạo nhiều class.',
'Biết xác định boundary giữa UI, orchestration, domain policy, data access, platform integration và cross-cutting concerns; nhận ra coupling ẩn qua state, callback, global singleton và model dùng chung.',
'Có thể refactor một feature Android thực tế từ God ViewModel hoặc God Repository thành các thành phần có contract rõ, test độc lập và vẫn giữ flow dữ liệu dễ theo dõi.'
]))
sections.append(sec(2,'prerequisites','Kiến thức nền',[
'Cần nắm Kotlin class, interface, sealed type, coroutine, Flow, ViewModel, repository, Room, Retrofit, Compose state và dependency injection ở mức sử dụng.',
'Cần hiểu cohesion là mức độ các phần trong một module cùng phục vụ một mục tiêu; coupling là mức độ một phần phụ thuộc chi tiết của phần khác. SoC hướng tới cohesion cao và coupling có chủ đích.',
'Cần phân biệt kiến trúc với folder structure: cùng một package vẫn có thể tách concern tốt, còn nhiều module Gradle vẫn có thể phụ thuộc vòng hoặc chia sẻ model bừa bãi.'
]))
sections.append(sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',[
'Concern là một nhóm trách nhiệm có cùng mục đích hoặc cùng lý do thay đổi, ví dụ rendering UI, điều phối use case, xác thực nghiệp vụ, persistence, network transport hoặc analytics.',
'Responsibility là nghĩa vụ cụ thể của một thành phần. Reason to change là loại thay đổi khiến thành phần phải sửa; đây là cách thực dụng để tìm boundary.',
'Boundary là đường biên contract giữa hai concern. Contract có thể là interface, data type, function, event hoặc protocol. Boundary tốt che giấu implementation nhưng không che giấu semantics quan trọng.',
'Policy là quyết định nghiệp vụ; mechanism là cách kỹ thuật thực thi. Ví dụ chính sách “chỉ gửi tin khi chưa bị chặn” khác cơ chế gọi Socket.IO hoặc REST.',
'Cross-cutting concern như logging, analytics, auth token, tracing và error mapping đi qua nhiều layer nhưng vẫn cần ownership rõ; không nên vì dùng khắp nơi mà biến thành global mutable utility.'
]))
sections.append(sec(4,'mechanism','Cơ chế hoạt động bên trong',[
'SoC hoạt động bằng cách đặt mỗi quyết định vào nơi sở hữu đúng context và ổn định hơn trước thay đổi. UI biết cách trình bày; domain biết quy tắc; data biết nguồn dữ liệu; platform biết API Android.',
'Một boundary tốt giảm số chi tiết lan truyền. Khi API đổi field, mapper và data layer chịu tác động; UI vẫn dùng domain/UI model ổn định. Khi UI đổi layout, repository không cần sửa.',
'Dependency direction phải phản ánh ownership: lớp cấp cao phụ thuộc contract, lớp thấp cung cấp implementation. Tuy nhiên không cần ép mọi function thành interface; abstraction chỉ có giá trị khi bảo vệ một biến động hoặc hỗ trợ test/substitution thực tế.',
'Luồng dữ liệu thường đi theo request xuống và result/state đi lên. Side effect được đặt ở owner có lifecycle phù hợp; state có một nguồn sở hữu rõ để tránh hai concern cùng ghi cùng dữ liệu.',
'Boundary bị phá khi model transport được dùng thẳng trong UI, Context đi vào domain, ViewModel tự viết SQL, repository điều hướng màn hình hoặc composable chứa retry/backoff nghiệp vụ.'
],[("Ví dụ tách policy khỏi mechanism","class SendMessageUseCase(\n    private val conversationRepo: ConversationRepository,\n    private val messageGateway: MessageGateway\n) {\n    suspend operator fun invoke(chatId: String, text: String): Result<Message> {\n        require(text.isNotBlank())\n        if (!conversationRepo.canSend(chatId)) return Result.failure(BlockedChat())\n        return messageGateway.send(chatId, text.trim())\n    }\n}")]))
sections.append(sec(5,'purpose','Mục đích của kỹ thuật',[
'Mục tiêu chính là làm thay đổi cục bộ: yêu cầu mới hoặc lỗi ở một concern không buộc sửa dây chuyền các phần không liên quan.',
'SoC giúp tăng khả năng đọc, test, thay thế implementation, chia ownership trong team và quan sát dependency. Nó không nhằm tối đa số lớp hay đạt sơ đồ kiến trúc đẹp.',
'Trong Android, SoC đặc biệt quan trọng vì UI lifecycle, process death, network, persistence và platform API có nhịp thay đổi khác nhau.'
]))
sections.append(sec(6,'problem','Vấn đề kỹ thuật được giải quyết',[
'God Activity hoặc God ViewModel thường vừa parse Intent, gọi API, map JSON, validate nghiệp vụ, cập nhật database, điều hướng và gửi analytics. Mỗi thay đổi nhỏ có thể làm hỏng nhiều hành vi.',
'Model dùng chung toàn app khiến field nullable, annotation serialization và UI formatting trộn lẫn. Một sửa đổi backend có thể lan tới Compose và test.',
'Không có owner rõ dẫn tới duplicate state, race condition, lifecycle leak và lỗi khó tái hiện: UI và repository cùng giữ loading, nhiều nơi tự retry, hoặc callback platform cập nhật trực tiếp state toàn cục.',
'Test khó vì muốn kiểm tra một policy phải khởi tạo Android framework, database, network và analytics cùng lúc.'
]))
sections.append(sec(7,'when-to-use','Dấu hiệu cần dùng',[
'Cần xem lại boundary khi một class có nhiều nhóm dependency không liên quan, tên method trải rộng nhiều domain, test setup quá lớn hoặc thay đổi một yêu cầu chạm nhiều layer.',
'Dùng SoC khi feature có UI, cache, network, auth, analytics, background work hoặc nhiều entry point như deep link và notification.',
'Dấu hiệu mạnh khác là cùng logic nghiệp vụ bị lặp ở ViewModel, Worker và Service; logic này nên được đưa về owner dùng chung không phụ thuộc lifecycle cụ thể.',
'Cũng cần dùng khi team chia ownership hoặc module cần phát triển độc lập, nhưng boundary phải bám business capability thay vì chia theo loại class máy móc.'
]))
sections.append(sec(8,'when-not-to-use','Khi không nên dùng',[
'Không tạo interface, use case và mapper cho mọi hàm một dòng chỉ để đạt “clean”. Với feature nhỏ, một ViewModel gọi repository trực tiếp có thể đủ nếu trách nhiệm vẫn rõ.',
'Không tách đến mức luồng đọc bị phân mảnh qua hàng chục lớp pass-through không thêm policy, mapping, lifecycle hoặc error semantics.',
'Không dùng SoC làm lý do cấm chia sẻ hoàn toàn. Shared kernel nhỏ như Money, UserId hoặc Result type có thể hợp lý nếu semantics ổn định và ownership rõ.',
'Không refactor toàn bộ hệ thống cùng lúc. Chọn seam quanh thay đổi có giá trị và bảo vệ bằng test trước.'
]))
sections.append(sec(9,'requirement','Yêu cầu sản phẩm cụ thể',[
'Feature đăng bài phải cho phép thay đổi UI chọn media mà không sửa upload engine; thay đổi provider upload không sửa validation caption; analytics failure không làm thất bại việc đăng bài.',
'Chat phải dùng chung policy gửi tin giữa màn chat, quick reply notification và retry worker; mỗi entry point chỉ cung cấp input và lifecycle context của nó.',
'Feed phải đổi API hoặc cache strategy mà không làm composable phụ thuộc DTO. UI chỉ render UiState và phát intent người dùng.',
'Acceptance criteria gồm dependency graph không có vòng, domain code không import Android framework, lỗi được map tại boundary, unit test policy không cần emulator và integration test kiểm tra contract giữa layer.'
]))
sections.append(sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: UI phụ thuộc state/action contract; ViewModel điều phối; use case giữ policy; repository contract mô tả nhu cầu domain; data source xử lý protocol cụ thể. Composition root nối implementation.',
'Error policy cũng là concern. Transport error được data layer chuẩn hóa; domain quyết định retryable hay business failure; UI quyết định thông điệp và affordance. Không để Retrofit exception tràn thẳng tới composable.',
'Lifecycle concern thuộc boundary Android. ViewModel giữ screen state; Worker xử lý durable work; repository không sở hữu Activity scope. Callback SDK phải được adapter chuyển thành Flow hoặc typed event với cleanup rõ.',
'Resource limit cần owner: image loader quản cache byte, uploader quản concurrency, database quản transaction, UI quản viewport. Nếu nhiều layer cùng retry hoặc prefetch, tải có thể nhân lên.',
'Test strategy theo boundary: unit test policy bằng fake contract; contract/integration test mapper và repository; UI test state rendering; end-to-end chỉ dành cho journey trọng yếu.',
'Đánh giá abstraction bằng câu hỏi: nó che biến động nào, ai sở hữu contract, semantics có ổn định không, chi phí navigation/debug là gì và failure có quan sát được không.'
]))
sections.append(sec(11,'minimal-code','Ví dụ code tối giản',[
'Ví dụ tối giản tách UI intent, ViewModel orchestration và repository contract. ViewModel không biết Retrofit hay Room; composable không biết coroutine retry.',
'UiState là model trình bày, không phải DTO. Mapper sang UiState có thể nằm ở presentation nếu chứa formatting phụ thuộc locale hoặc design requirement.'
],[("UI contract và ViewModel","data class ProfileUiState(val loading: Boolean=false, val name: String=\"\", val error: String?=null)\n\nclass ProfileViewModel(private val loadProfile: LoadProfileUseCase): ViewModel() {\n    private val _state = MutableStateFlow(ProfileUiState())\n    val state: StateFlow<ProfileUiState> = _state\n\n    fun refresh() = viewModelScope.launch {\n        _state.value = _state.value.copy(loading=true, error=null)\n        _state.value = loadProfile().fold(\n            onSuccess = { ProfileUiState(name=it.displayName) },\n            onFailure = { ProfileUiState(error=\"Không thể tải hồ sơ\") }\n        )\n    }\n}")]))
sections.append(sec(12,'upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng single-activity Compose, ViewModel, Flow, Paging, Koin, Retrofit/Room và các module feed, chat, deep link. Đây là nền tảng phù hợp để áp dụng SoC theo feature và lifecycle owner.',
'inferred: Chat có socket, paging, optimistic message, ack, typing/read state; nếu tất cả nằm trong một ViewModel hoặc socket manager thì nguy cơ trộn transport, policy và presentation cao, nhưng chưa có đủ code để kết luận implementation hiện tại.',
'proposed: tách ChatUiState/intent, SendMessageUseCase, MessageRepository, SocketTransport, MessageStore, AckPolicy và ChatAnalytics; worker retry dùng lại use case hoặc domain service thay vì copy logic.',
'needs-confirmation: cần đối chiếu package/module thực tế, ownership repository, mapper, error model và dependency graph trước khi mô tả như kinh nghiệm đã triển khai production.'
]))
sections.append(sec(13,'alternatives','Phương án thay thế',[
'Có thể tổ chức theo layer toàn app, theo feature dọc hoặc hybrid. Feature-first thường giảm coupling giữa domain khác nhau; layer-first dễ chuẩn hóa nhưng có thể tạo package khổng lồ.',
'Một modular monolith với package boundary và convention có thể đủ; chưa cần multi-module Gradle nếu build time và ownership chưa đòi hỏi.',
'Functional core–imperative shell là biến thể mạnh: policy thuần ở core, I/O và framework ở shell. Hexagonal/Clean Architecture formalize dependency boundary sâu hơn nhưng chi phí cao hơn.',
'Facade hoặc adapter có thể tạo seam quanh legacy SDK mà không cần refactor toàn bộ feature.'
]))
sections.append(sec(14,'tradeoffs','Lý do lựa chọn và trade-off',[
'Tách concern tăng số type, mapping và navigation trong code; đổi lại giảm blast radius và test dễ hơn. Giá trị tăng khi feature sống lâu và nhiều biến động.',
'Interface giúp đảo dependency nhưng quá nhiều interface một implementation tạo noise. Có thể bắt đầu bằng concrete class có API nhỏ rồi trích interface khi cần seam.',
'Mapper bảo vệ domain/UI khỏi DTO nhưng thêm CPU và boilerplate. Với dữ liệu nhỏ chi phí thường chấp nhận; với list lớn cần đo và map theo page/incremental.',
'Feature module độc lập cải thiện ownership và build cache nhưng tăng cấu hình, dependency API và nguy cơ duplicate shared code.',
'Centralized error model nhất quán nhưng dễ mất chi tiết; typed error theo boundary giữ semantics tốt hơn nhưng cần mapping rõ.'
]))
sections.append(sec(15,'edge-cases','Edge cases',[
'Một concern có thể cắt ngang nhiều feature, như auth hoặc analytics. Giải pháp là contract nhỏ và adapter, không cho module trung tâm sở hữu business flow của mọi feature.',
'Offline-first khiến repository vừa phối hợp local và remote; đây vẫn là một concern orchestration dữ liệu nếu contract và source ownership rõ, không nhất thiết vi phạm SoC.',
'Transaction nghiệp vụ chạm nhiều repository cần coordinator/use case hoặc transaction boundary, không để UI gọi tuần tự rồi tự rollback.',
'Formatting đôi khi là domain, đôi khi là presentation: tiền tệ tính toán thuộc domain, chuỗi theo locale thuộc presentation. Phải xét semantics chứ không dựa tên.',
'Shared model giữa modules có thể hợp lý nếu là value object ổn định; DTO hoặc UiState không nên trở thành shared kernel.',
'Legacy callback SDK có thể đòi Context; adapter platform giữ Context và expose contract thuần, nhưng cần lifecycle cleanup và thread policy.'
]))
sections.append(sec(16,'mistakes','Sai lầm thường gặp',[
'Đồng nhất SoC với “mỗi class một việc” rồi tạo lớp pass-through không có semantics.',
'Đưa business logic vào extension/util để tránh God class nhưng vẫn không có owner hoặc dependency rõ.',
'Repository làm mọi thứ từ network, database, validation, navigation, analytics đến formatting; tên Repository không tự tạo boundary tốt.',
'Dùng DTO xuyên UI, domain và database; annotation serialization làm model lõi phụ thuộc transport.',
'ViewModel phụ thuộc Context, NavController, Retrofit service và DAO trực tiếp; test buộc chạy Android.',
'Tạo event bus/global singleton để các concern nói chuyện tự do, khiến dependency ẩn và thứ tự xử lý khó kiểm soát.',
'Tách module theo package nhưng dùng implementation dependency và public type tràn lan, nên coupling thực tế không giảm.'
]))
sections.append(sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',[
'Separation of Concerns là gì và khác Single Responsibility Principle thế nào? Concern được nhận diện bằng cách nào?',
'Vì sao tách file hoặc package chưa đủ? Cohesion và coupling liên quan gì?',
'UI, ViewModel, use case và repository nên sở hữu trách nhiệm nào? Error mapping đặt ở đâu?',
'Khi nào cần interface? Khi nào mapper là cần thiết?',
'Một câu trả lời tốt phải dùng ví dụ thay đổi thực tế và chỉ ra blast radius trước/sau, không chỉ đọc định nghĩa.'
]))
sections.append(sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Nếu một use case chỉ gọi đúng một repository method, có nên giữ không? Trả lời phụ thuộc nó có policy, orchestration, reuse hoặc boundary value hay chỉ pass-through.',
'Repository có được gọi repository khác không? Có thể, nhưng cần tránh graph mơ hồ; orchestration business thường rõ hơn ở use case/domain service.',
'Analytics đặt ở UI, ViewModel hay use case? Event impression gắn UI lifecycle; event business success nên phát ở nơi biết kết quả nghiệp vụ; adapter analytics là concern riêng.',
'Một model dùng chung giảm mapping, tại sao không luôn tốt? Vì coupling schema và lý do thay đổi khác nhau lan xuyên layer.',
'SoC có làm giảm performance không? Mapping và abstraction có chi phí, nhưng cần đo; thiết kế tốt còn tránh duplicate work, retry storm và lifecycle leak.',
'Làm sao phát hiện over-engineering? Nhiều layer không thêm semantics, thay đổi đơn giản phải sửa hàng loạt pass-through và debugging call chain khó hơn lợi ích.'
]))
sections.append(sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm người học',[
'Mẫu trung thực: “Ở Upzi, confirmed là ứng dụng dùng Compose, ViewModel, Flow, Paging và Koin. Tôi xem SoC theo ownership: UI render state, ViewModel điều phối lifecycle, data layer xử lý nguồn dữ liệu. Với chat socket, inferred là cần tách transport, optimistic state và ack policy; tôi chỉ kể phần đã xác nhận, còn cấu trúc chi tiết cần kiểm tra.”',
'Mẫu phân tích: “Khi một thay đổi UI làm tôi phải sửa API model hoặc khi Worker copy logic từ ViewModel, đó là dấu hiệu boundary sai. Tôi đưa policy vào use case thuần Kotlin, adapter hóa platform và giữ typed error ở từng boundary.”',
'Mẫu trade-off: “Tôi không tạo interface cho mọi class. Tôi tạo abstraction khi có biến động, cần fake trong test, nhiều implementation hoặc muốn ngăn framework tràn vào core.”'
]))
sections.append(sec(20,'practice','Bài tập thực hành',[
'Chọn một ViewModel trên 300 dòng, nhóm từng method/dependency theo concern và ghi reason to change. Không refactor ngay.',
'Tách một policy thuần Kotlin ra khỏi ViewModel, viết ít nhất 5 unit test gồm success, business failure, transport failure, cancellation và duplicate action.',
'Tạo mapper DTO -> domain -> UiState; thay đổi một field API và chứng minh UI không cần sửa ngoài mapper nếu semantics không đổi.',
'Bọc một SDK callback bằng adapter trả Flow, bảo đảm unregister và test fake adapter.',
'Vẽ dependency graph trước/sau và liệt kê abstraction nào thực sự bảo vệ biến động.'
]))
sections.append(sec(21,'scenario','Bài tập tình huống',[
'Tình huống 1: màn đăng bài vừa validate caption, nén ảnh, upload, ghi draft, điều hướng và analytics trong ViewModel. Hãy đề xuất boundary, lifecycle owner và failure policy.',
'Tình huống 2: quick reply notification và màn chat dùng logic gửi tin khác nhau. Hãy thiết kế contract dùng chung mà không phụ thuộc Activity hoặc Notification API.',
'Tình huống 3: backend đổi field salary từ String sang object. Hãy xác định layer bị ảnh hưởng và cách bảo vệ domain/UI.',
'Tình huống 4: team muốn tách 20 Gradle module để “clean”. Hãy đặt tiêu chí ownership, build time, public API và dependency cycle trước khi quyết định.'
]))
sections.append(sec(22,'checklist','Checklist tự đánh giá',[
'Tôi xác định được concern bằng reason to change thay vì tên layer.',
'Mỗi state và side effect có owner rõ; không có hai nơi cùng ghi nguồn dữ liệu.',
'Domain policy không import Android, Retrofit, Room hoặc Compose.',
'UI không biết DTO, DAO, socket protocol hay retry/backoff chi tiết.',
'Error được map theo boundary và vẫn giữ đủ semantics để quyết định.',
'Abstraction có lý do cụ thể; không tạo interface pass-through máy móc.',
'Test policy không cần emulator và integration test kiểm tra contract quan trọng.',
'Dependency graph không vòng và public API của module đủ nhỏ.',
'Tôi phân biệt rõ confirmed/inferred/proposed/needs-confirmation khi nói về Upzi.'
]))
sections.append(sec(23,'summary','Tóm tắt cần nhớ',[
'SoC là phân chia theo trách nhiệm, semantics và lý do thay đổi; không phải đếm file hoặc layer.',
'Boundary tốt giảm blast radius, làm dependency hiện rõ và đặt state/side effect vào đúng lifecycle owner.',
'Policy nên tách khỏi mechanism; framework và protocol được giữ ở adapter/data/platform boundary.',
'Tối ưu kiến trúc cho thay đổi thực tế: abstraction vừa đủ, test đúng seam và tránh cả God class lẫn pass-through architecture.',
'SoC là nền cho MVVM, MVI, Clean Architecture, repository, use case, mapping và modularization ở các bài tiếp theo.'
]))

quiz=[
('Mục tiêu cốt lõi của SoC là gì?',['Tăng số class','Làm thay đổi cục bộ theo trách nhiệm','Luôn tạo interface','Chia mỗi package một layer'],1,'SoC giảm blast radius bằng boundary theo concern và lý do thay đổi.'),
('Dấu hiệu nào cho thấy chỉ tách file nhưng chưa tách concern?',['Class ngắn','Nhiều package','UI vẫn dùng DTO và repository điều hướng','Có unit test'],2,'Dependency và ownership vẫn trộn dù code nằm ở file khác.'),
('Policy khác mechanism thế nào?',['Policy là UI','Policy là quyết định, mechanism là cách thực thi','Không khác','Mechanism luôn ở domain'],1,'Tách quyết định nghiệp vụ khỏi công nghệ thực thi giúp thay đổi cục bộ.'),
('Khi nào interface có giá trị rõ nhất?',['Mọi class','Khi bảo vệ biến động hoặc cần substitution/test seam','Khi code dưới 10 dòng','Chỉ khi có hai module'],1,'Interface nên phục vụ boundary thực, không phải nghi thức.'),
('Transport error nên đi thẳng tới Compose không?',['Có','Không, cần chuẩn hóa/map theo boundary','Chỉ production','Chỉ Retrofit'],1,'UI không nên phụ thuộc exception của protocol cụ thể.'),
('Ai nên sở hữu durable retry sau process death?',['Composable','Activity','Worker/WorkManager orchestration với logic dùng chung','NavController'],2,'Durable work thuộc lifecycle platform phù hợp, policy nên tái sử dụng.'),
('Một use case pass-through luôn cần giữ không?',['Có','Không, chỉ giữ khi thêm policy/orchestration/reuse hoặc boundary value','Chỉ debug','Chỉ Compose'],1,'Layer không thêm semantics có thể là over-engineering.'),
('DTO dùng thẳng làm UiState có rủi ro gì?',['Không có','Coupling schema transport với presentation','Chỉ chậm build','Không test được coroutine'],1,'Lý do thay đổi của API và UI khác nhau.'),
('Cross-cutting concern nên xử lý thế nào?',['Global mutable singleton','Contract nhỏ và ownership rõ','Đưa hết vào ViewModel','Bỏ qua'],1,'Dùng rộng không đồng nghĩa không có boundary.'),
('SoC có đồng nghĩa multi-module không?',['Có','Không, package/module chỉ là cơ chế enforcement','Chỉ Android','Chỉ Kotlin'],1,'Có thể tách concern tốt trong modular monolith.'),
('Cách thực dụng tìm concern là gì?',['Đếm method','Hỏi các reason to change và semantics','Theo alphabet','Theo số dependency'],1,'Reason to change giúp nhóm trách nhiệm có cùng ownership.'),
('Phát biểu trung thực về Upzi nên thế nào?',['Mọi đề xuất đều là confirmed','Phân biệt confirmed, inferred, proposed, needs-confirmation','Không nhắc trade-off','Chỉ kể kiến trúc lý tưởng'],1,'Quy tắc handbook yêu cầu không biến suy luận thành kinh nghiệm đã triển khai.')
]
sections.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[{'type':'quiz','question':q,'options':o,'answerIndex':a,'explanation':e} for q,o,a,e in quiz]})

lesson={'id':'f01','code':'F01','title':'Separation of Concerns','summary':'Phân chia Android app theo trách nhiệm, lý do thay đổi và ownership để giảm coupling, tăng cohesion, testability và khả năng thay đổi cục bộ.','estimatedMinutes':360,'sections':sections}
(DATA/'lessons'/'f').mkdir(parents=True,exist_ok=True)
(DATA/'lessons'/'f'/'f01.json').write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text())
for ch in catalog['chapters']:
    for l in ch['lessons']:
        if l['id']=='f01': l['status']='published'; l['estimatedMinutes']=360
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')

plan=json.loads((DATA/'book-plan.json').read_text())
if 'f01' not in plan['completed']: plan['completed'].append('f01')
plan['current']='f02'
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')

idx=json.loads((DATA/'search-index.json').read_text())
idx=[x for x in idx if x.get('id')!='f01']
idx.append({'id':'f01','code':'F01','title':'Separation of Concerns','chapter':'Architecture','path':'data/lessons/f/f01.json','keywords':['separation of concerns','cohesion','coupling','responsibility','boundary','policy mechanism','architecture','god class','dependency direction']})
(DATA/'search-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')

ids=[s['id'] for s in sections]
canonical=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
paras=sum(1 for s in sections for b in s['blocks'] if b['type']=='paragraph')
chars=sum(len(b['content']) for s in sections for b in s['blocks'] if b['type']=='paragraph')
codes=sum(1 for s in sections for b in s['blocks'] if b['type']=='code')
report={'id':'f01','sections':len(sections),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==canonical,'paragraphs':paras,'paragraphCharacters':chars,'codeBlocks':codes,'quizQuestions':len(quiz),'quizAnswersValid':all(0<=a<len(o) and e for q,o,a,e in quiz),'truthfulnessLabelsPresent':all(x in json.dumps(lesson,ensure_ascii=False) for x in ['confirmed','inferred','proposed','needs-confirmation']),'nextLesson':'f02'}
(DATA/'validation-f01.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
assert report['sections']==24 and report['uniqueSectionIds']==24 and report['exactSectionOrder'] and report['quizQuestions']>=10 and report['quizAnswersValid'] and report['truthfulnessLabelsPresent']
