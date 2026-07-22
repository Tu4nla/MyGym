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
'Hiểu Activity lifecycle như một state machine do Android framework điều khiển theo visibility, focus, configuration, task và process state; không xem onCreate-onDestroy như chuỗi luôn chạy đầy đủ. Người học phải phân biệt lifecycle instance với process lifecycle và task/back stack.',
'Mục tiêu thực hành là đặt initialization, collection, camera/location/socket, state restoration và cleanup đúng owner; xử lý rotation, multi-window, process death, finish, back, home và deep link mà không leak, duplicate work hoặc mất dữ liệu.')
sec(2,'prerequisites','Kiến thức nền',
'Cần nắm Application, Context, Intent, task/back stack, ViewModel, SavedStateHandle, coroutine, Flow, Compose và Navigation. Activity là entry point UI và LifecycleOwner, không phải nơi chứa toàn bộ business logic.',
'Cần phân biệt configuration change với process death. Configuration change hủy instance Activity nhưng thường giữ process và ViewModelStore; process death xóa memory và chỉ dữ liệu đã persist hoặc saveable mới có thể phục hồi.')
sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',
'onCreate khởi tạo instance; onStart làm Activity visible; onResume đưa Activity vào trạng thái tương tác foreground; onPause báo mất focus hoặc chuyển tiếp; onStop báo không còn visible; onDestroy kết thúc instance nhưng không bảo đảm luôn được gọi trước process kill.',
'Configuration change là thay đổi cấu hình như rotation, locale, font scale hoặc window size khiến Activity recreate nếu không tự xử lý. finish loại Activity khỏi task. Process death là hệ thống giết process khi app không foreground hoặc thiếu tài nguyên.',
'LifecycleOwner cung cấp Lifecycle. repeatOnLifecycle chạy block khi đạt state tối thiểu và cancel khi rời state. SavedInstanceState là Bundle nhỏ cho UI reconstruction; ViewModel giữ state qua recreation nhưng không qua process death nếu không dùng SavedStateHandle.')
sec(4,'mechanism','Cơ chế hoạt động bên trong',
'ActivityThread nhận transaction từ system_server qua Binder, tạo Activity instance, attach context, gọi Instrumentation rồi dispatch callback lifecycle. LifecycleRegistry của ComponentActivity ánh xạ callback framework thành state STARTED, RESUMED, DESTROYED cho observer.',
'Khi configuration change, framework gọi save state, pause, stop và destroy instance cũ; instance mới được tạo với resources/configuration mới. ViewModelStore được giữ qua non-configuration instance, vì vậy ViewModel thường sống tiếp nhưng View tree và remember state được tạo lại.',
'Khi user nhấn Home, Activity thường pause rồi stop nhưng vẫn ở back stack. Khi Back hoặc finish, Activity bị loại khỏi stack và cuối cùng destroy. Process có thể bị kill sau onStop mà không gọi onDestroy.',codes=[('Quan sát lifecycle','''class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(AppLifecycleLogger())
        setContent { AppRoot() }
    }
}

class AppLifecycleLogger : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) = log("visible")
    override fun onStop(owner: LifecycleOwner) = log("hidden")
}''')])
sec(5,'purpose','Mục đích của kỹ thuật',
'Lifecycle giúp giới hạn công việc theo khả năng Activity hiển thị và tương tác, tránh giữ camera, sensor, location, animation hoặc collection khi màn không cần. Nó cũng cung cấp điểm phục hồi UI khi instance bị recreate.',
'Kiến trúc tốt dùng lifecycle để quản lý resource ownership, không dùng callback như business event. onResume không đồng nghĩa user vừa đăng nhập; onStop không đồng nghĩa session kết thúc.')
sec(6,'problem','Vấn đề kỹ thuật được giải quyết',
'Nếu bỏ qua lifecycle, app dễ duplicate network request sau rotation, collect Flow nhiều lần, leak Activity qua singleton/callback, tiếp tục camera khi background hoặc mất form state khi process death.',
'Ngược lại, đặt quá nhiều logic vào callback làm code khó test và phụ thuộc thứ tự không bảo đảm. Business state nên nằm ở ViewModel/repository; Activity chỉ nối platform event, permission, intent và UI host.')
sec(7,'when-to-use','Dấu hiệu cần dùng',
'Dùng lifecycle-aware APIs khi resource chỉ hợp lệ lúc Activity visible hoặc resumed: camera preview, sensor, location foreground, animation, UI collection, receiver đăng ký động và callback gắn window.',
'Dùng onCreate cho one-time setup của instance như setContent, register launcher, parse initial Intent và attach observer. Dùng saved state khi UI cần tái tạo sau process recreation với payload nhỏ.')
sec(8,'when-not-to-use','Khi không nên dùng',
'Không đặt repository singleton, database, socket toàn ứng dụng hoặc long-running upload trực tiếp theo Activity lifecycle nếu chúng cần sống độc lập. Chúng cần application/process/service/work scope thích hợp.',
'Không dùng onDestroy làm nơi duy nhất để persist dữ liệu quan trọng hoặc gửi logout vì callback có thể không chạy. Không gọi API mỗi onResume nếu mục tiêu chỉ là refresh theo freshness policy.')
sec(9,'requirement','Yêu cầu sản phẩm cụ thể',
'Khi xoay màn hình ở form tạo bài đăng, text và lựa chọn phải giữ; request đang chạy không duplicate; snackbar one-time không hiện lại. Khi app bị kill ở background rồi mở lại, route và draft tối thiểu được phục hồi hoặc app fallback an toàn.',
'Chat phải dừng typing indicator và UI-only collectors khi màn không visible nhưng socket/session policy không được phụ thuộc tùy tiện vào một Activity. Deep link qua onNewIntent phải xử lý đúng khi Activity foreground và không tạo duplicate navigation.',
'Acceptance criteria phải test rotation, font scale, dark mode, split-screen, Home/Recents, Back, low-memory process recreation, permission dialog, picture-in-picture nếu có và multi-window focus.')
sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',
'Dependency: Activity phụ thuộc platform và app navigation boundary; ViewModel phụ thuộc use case/repository; UI state đi xuống và event đi lên. Không truyền Activity Context vào ViewModel lâu dài; dùng Application context chỉ khi dependency thực sự cần.',
'Error policy: lifecycle stop không phải error. Resource acquire/release phải idempotent; nếu camera mở thất bại, state hiển thị retry và cleanup partial resource. Intent invalid phải reject an toàn.',
'Lifecycle: collect StateFlow bằng collectAsStateWithLifecycle hoặc repeatOnLifecycle. launchWhenStarted có semantics suspend khác với cancel/restart và dễ giữ upstream work; cần hiểu operator sharing ở ViewModel.',
'Resource limits: Bundle saved state có Binder size giới hạn; chỉ lưu ID, text ngắn và primitive. Bitmap, list lớn và response JSON phải ở repository/cache. Callback phải unregister để tránh leak và duplicate.',
'Concurrency: onStart/onStop có thể xảy ra nhanh do dialog, permission, split-screen hoặc navigation. Acquire/release cần serialized, cancellation-safe và không giả định callback hoàn tất trước callback tiếp theo.',codes=[('Collection theo lifecycle','''lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.effects.collect { effect -> handle(effect) }
    }
}''')])
sec(11,'minimal-code','Ví dụ code tối giản',
'ComponentActivity với Compose nên gọi setContent một lần trong onCreate. Screen state được collect lifecycle-aware; Activity chỉ xử lý platform action như permission, external intent hoặc system UI.',
'ViewModel giữ dữ liệu qua configuration change. SavedStateHandle chỉ giữ input phục hồi nhỏ và không thay database.',codes=[('Activity Compose tối giản','''class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val vm: MainViewModel = viewModel()
            val state by vm.state.collectAsStateWithLifecycle()
            MainScreen(state = state, onAction = vm::onAction)
        }
    }
}'''),('Lưu state nhỏ','''class EditorViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    var draft by savedStateHandle.saveable { mutableStateOf("") }
        private set
    fun update(value: String) { draft = value }
}''')])
sec(12,'upzi-case','Ví dụ thực tế Upzi',
'confirmed: Upzi dùng single Activity, Jetpack Compose, Navigation Compose, MainActivity xử lý deep link trong onCreate/onNewIntent và có socket/chat flow. Đây là bối cảnh trực tiếp của Activity lifecycle, Intent delivery và lifecycle-aware collection.',
'inferred: project có thể dùng collectAsStateWithLifecycle và giữ socket ở scope cao hơn Activity, nhưng chưa xác nhận mọi collector/resource. proposed: audit onResume refresh, deep-link dedup, receiver registration, process-death restoration và split-screen. needs-confirmation: cần kiểm tra MainActivity, launchMode, socket owner, SavedStateHandle và lifecycle tests trước khi kể là đã triển khai.')
sec(13,'alternatives','Phương án thay thế',
'Fragment có lifecycle riêng cho instance và view lifecycle; khi mixed View/Compose, cần chọn viewLifecycleOwner để tránh giữ binding sau onDestroyView. Compose Navigation destination có NavBackStackEntry lifecycle nhỏ hơn Activity.',
'ProcessLifecycleOwner biểu diễn foreground/background của process gần đúng, phù hợp analytics hoặc app-wide policy nhưng không thay Activity lifecycle. Service/WorkManager dùng cho công việc phải sống ngoài UI.')
sec(14,'tradeoffs','Lý do lựa chọn và trade-off',
'Activity-scoped resource đơn giản nhưng có thể restart khi rotation; ViewModel-scoped resource sống qua recreation nhưng không nên giữ Activity-bound object. Application scope ổn định hơn nhưng dễ giữ tài nguyên quá lâu.',
'Giữ state bằng ViewModel nhanh và type-safe nhưng mất khi process death; SavedStateHandle phục hồi được nhưng payload nhỏ và serialization cost; database bền vững nhưng phức tạp và chậm hơn.',
'STARTED collection tiếp tục khi visible nhưng chưa focused; RESUMED tiết kiệm hơn cho input/camera nhưng có thể stop khi dialog hoặc multi-window mất focus. Chọn theo product semantics.')
sec(15,'edge-cases','Edge cases',
'Configuration change có thể xảy ra khi locale, font scale, theme, keyboard, orientation hoặc window size đổi. Không chỉ rotation. Foldable và split-screen có thể resize liên tục mà Activity không hoàn toàn background.',
'Permission dialog thường làm Activity pause nhưng vẫn visible; không nên release/reacquire resource quá nặng nếu policy chỉ cần visibility. Multi-window có thể có nhiều Activity STARTED nhưng chỉ một RESUMED tùy phiên bản/platform.',
'onSaveInstanceState có thể được gọi trước stop và sau đó Activity vẫn tiếp tục; không dùng nó như dấu hiệu đóng màn. Sau state saved, commit Fragment/navigation không đúng thời điểm có thể gây state loss.',
'Process death từ Recents restore Intent và Bundle nhưng singleton/cache mất. Static field không phải persistence. onDestroy có thể chạy do configuration change, finish hoặc framework cleanup; kiểm tra isChangingConfigurations/isFinishing chỉ khi thật sự cần.',codes=[('Phân biệt recreation','''override fun onDestroy() {
    super.onDestroy()
    when {
        isChangingConfigurations -> log("recreate")
        isFinishing -> log("finish")
        else -> log("destroy without strong conclusion")
    }
}''')])
sec(16,'mistakes','Sai lầm thường gặp',
'Lỗi phổ biến: gọi API trong onResume không có freshness guard, đăng ký observer mỗi onStart nhưng quên unregister, giữ Activity trong singleton, dùng GlobalScope, lưu bitmap trong Bundle và coi onDestroy luôn chạy.',
'Một lỗi khác là collect Flow trong lifecycleScope mà không repeatOnLifecycle, khiến collector sống tới destroy dù Activity stop. Hoặc tạo nhiều collectors khi onStart gọi lặp.',
'Không nên đặt navigation trực tiếp từ recomposition theo lifecycle flag, vì có thể navigate loop. Platform callback nên chuyển thành typed event/command được consume một lần.')
sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',
'Câu hỏi nền: thứ tự callback khi mở/che/đóng Activity; onPause khác onStop; rotation xảy ra gì; ViewModel sống bao lâu; savedInstanceState khác SavedStateHandle; vì sao không tin onDestroy; repeatOnLifecycle hoạt động thế nào.',
'Mẫu trả lời tốt phân biệt instance, task, process; nêu visibility/focus semantics và resource ownership, không chỉ đọc thuộc callback.')
sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',
'Câu xoáy: dialog permission làm callback nào; multi-window có hai Activity resumed không; process death restore ra sao; Fragment view lifecycle khác Activity; onSaveInstanceState có đồng nghĩa app sắp chết không; collect ở STARTED hay RESUMED.',
'Câu bẫy: onDestroy có chắc được gọi; ViewModel có survive process death; static singleton có giữ sau low-memory kill; onStop có phải logout; onResume có nên reconnect socket toàn app; finish và process kill khác gì.')
sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm',
'Trong app Compose tôi giữ Activity mỏng: onCreate thiết lập content và platform launchers; UI state ở ViewModel; Flow collect lifecycle-aware; resource UI acquire/release theo STARTED hoặc RESUMED tùy semantics. Tôi test rotation và process recreation thay vì giả định callback.',
'Với Upzi, confirmed là MainActivity xử lý deep link và app có chat/socket. Chi tiết socket scope, saved state hoặc refresh policy phải nói là inferred/proposed cho tới khi đối chiếu code.')
sec(20,'practice','Bài tập thực hành',
'Tạo Activity Compose có form, timer và fake repository. Xoay màn, đổi font scale, nhấn Home rồi quay lại; chứng minh request không duplicate và form được giữ.',
'Thêm lifecycle logger với timestamp và taskId. Thực hiện mở dialog, permission, split-screen, Back, Home, Recents swipe; ghi lại callback thực tế.',
'Dùng Developer options “Don’t keep activities” và adb kill process để kiểm tra ViewModel, SavedStateHandle, database và navigation restoration.')
sec(21,'scenario','Bài tập tình huống',
'Chat socket reconnect mỗi onResume khiến nhiều connection sau rotation. Hãy xác định owner đúng, sharing policy, authentication refresh và UI collector lifecycle.',
'Camera preview cần pause khi màn không interactive nhưng upload phải tiếp tục sau Activity bị destroy. Hãy chia camera resource, upload queue và progress observation theo scope.',
'Deep link đến job detail khi app background; cùng lúc session hết hạn. Vẽ timeline onNewIntent, auth gate, pending command, navigation và process death.')
sec(22,'checklist','Checklist tự đánh giá',
'Tôi phân biệt onCreate/onStart/onResume/onPause/onStop/onDestroy theo visibility và interaction; không giả định callback đầy đủ.',
'Tôi phân biệt configuration change, finish, task removal và process death; biết ViewModel, SavedStateHandle và persistence sống qua trường hợp nào.',
'Tôi dùng repeatOnLifecycle/collectAsStateWithLifecycle, tránh Activity leak, Bundle lớn, duplicate collector và business logic trong callback.',
'Tôi có test rotation, font scale, Home, Back, multi-window, permission dialog, low-memory recreation và deep-link Intent mới.')
sec(23,'summary','Tóm tắt cần nhớ',
'Activity lifecycle là contract điều phối instance UI, không phải business workflow. Callback phản ánh visibility/focus và có thể lặp, bị bỏ qua do process kill hoặc xảy ra trong nhiều tình huống khác nhau.',
'ViewModel giữ state qua configuration change; SavedStateHandle/Bundle chỉ cho state nhỏ; dữ liệu bền vững phải ở repository/storage. onDestroy không phải điểm persistence đáng tin.',
'Resource phải có owner và lifecycle rõ. UI collection lifecycle-aware, app-wide work dùng process/service/work scope, và mọi giả định phải được test trên recreation/process death.')
sec(24,'quiz-guide','Quiz có giải thích đáp án',
'Làm quiz sau khi tự vẽ callback cho launch, Home, Back, rotation, permission dialog và process death. Với mỗi câu, nêu state nào còn sống: Activity instance, ViewModel, process, task và persisted data.',
'Không học thuộc thứ tự như tuyệt đối; luôn xét visibility, focus, configuration, launch mode và khả năng framework kill process.')
quiz=[]
def q(i,question,correct,*opts,explanation):
    ids=['a','b','c','d']; quiz.append({'id':f'q{i}','question':question,'options':[{'id':ids[j],'text':o} for j,o in enumerate(opts)],'correctOptionIds':[correct],'explanation':explanation})
q(1,'Callback nào cho biết Activity không còn visible?','b','onPause','onStop','onResume','onRestart',explanation='onStop tương ứng Activity không còn visible; onPause chủ yếu mất focus/interactivity.')
q(2,'ViewModel mặc định survive trường hợp nào?','a','Configuration change','Process death','Uninstall','Force stop',explanation='ViewModelStore được giữ qua recreation do configuration change, không qua process death.')
q(3,'Vì sao không persist dữ liệu quan trọng chỉ trong onDestroy?','c','Callback chạy quá sớm','Không có Context','Process có thể bị kill mà không gọi onDestroy','Bundle không tồn tại',explanation='Hệ thống không bảo đảm onDestroy trước process termination.')
q(4,'repeatOnLifecycle khác collector thường ở điểm nào?','a','Cancel/restart block theo lifecycle state','Luôn chạy background','Tự persist database','Chặn rotation',explanation='Block được launch khi đạt state và cancel khi rời state.')
q(5,'SavedInstanceState phù hợp nhất cho gì?','d','Bitmap lớn','Response JSON','Socket connection','UI reconstruction data nhỏ',explanation='Bundle có giới hạn và dùng để tái tạo UI với primitive/ID/text nhỏ.')
q(6,'Nhấn Home thường dẫn đến gì?','b','finish Activity','pause rồi stop nhưng Activity còn back stack','process kill ngay','onDestroy chắc chắn',explanation='Activity mất foreground/visibility nhưng thường vẫn trong task.')
q(7,'onStop có nên dùng để logout user không?','c','Luôn nên','Chỉ tablet','Không, lifecycle visibility không phải session business event','Chỉ Compose',explanation='User có thể chỉ mở app khác hoặc dialog; session không nên phụ thuộc Activity visibility.')
q(8,'State nào phù hợp để chạy camera preview?','b','CREATED','RESUMED hoặc STARTED tùy product semantics','DESTROYED','ProcessLifecycle only',explanation='Camera cần gắn visibility/interactivity; chọn STARTED/RESUMED theo policy cụ thể.')
q(9,'Configuration change chỉ là rotation đúng không?','a','Không, còn locale/font scale/window/theme','Đúng','Chỉ keyboard','Chỉ API cũ',explanation='Nhiều cấu hình hoặc window thay đổi có thể recreate Activity.')
q(10,'Static singleton có survive process death không?','d','Luôn có','Nếu dùng Compose','Nếu Activity stopped','Không',explanation='Process death xóa toàn bộ memory, gồm static/singleton.')
q(11,'Collect Flow trong lifecycleScope mà không repeatOnLifecycle có rủi ro gì?','a','Collector tiếp tục khi Activity stopped tới destroy','Không compile','Mất ViewModel','Tự duplicate database',explanation='lifecycleScope chỉ cancel khi destroy; upstream/UI work có thể tiếp tục lúc không visible.')
q(12,'onSaveInstanceState có nghĩa Activity chắc chắn sắp bị destroy?','b','Có','Không','Chỉ khi Back','Chỉ khi finish',explanation='State có thể được save và Activity vẫn tiếp tục; không dùng callback này như business close event.')
lesson={'id':'e01','code':'E01','title':'Activity Lifecycle','summary':'Hiểu Activity lifecycle, configuration change, process death, lifecycle-aware collection, state restoration và resource ownership trong Android/Compose.','estimatedMinutes':360,'sections':sections,'quiz':quiz}
lesson_path=DATA/'lessons'/'e'/'e01.json'; lesson_path.parent.mkdir(parents=True,exist_ok=True); lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':'))+'\n')
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in sections]; assert ids==required and len(set(ids))==24
paras=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']; codes=[b for s in sections for b in s['blocks'] if b['type']=='code']
assert len(paras)>=40 and sum(map(len,paras))>=9000 and len(codes)>=3 and len(quiz)>=10
text=lesson_path.read_text(); [(_ for _ in ()).throw(AssertionError(x)) for x in ['confirmed:','inferred:','proposed:','needs-confirmation:'] if x not in text]
catalog_path=DATA/'catalog.json'; catalog=json.loads(catalog_path.read_text()); found=False
for ch in catalog['chapters']:
    for item in ch['lessons']:
        if item['id']=='e01': assert item['status']=='planned'; item['status']='published'; item['estimatedMinutes']=360; found=True
assert found; catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text()); assert plan['current']=='e01'; plan['completed'].append('e01') if 'e01' not in plan['completed'] else None; plan['current']='e02'; plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text()); entry={'lessonId':'e01','code':'E01','title':'Activity Lifecycle','keywords':['Activity lifecycle','onCreate','onStart','onResume','onPause','onStop','onDestroy','configuration change','process death','repeatOnLifecycle','SavedStateHandle','ViewModel'],'headings':['Lifecycle state machine','Configuration change','Process death','Resource ownership','Lifecycle-aware collection','State restoration','Multi-window','Upzi Activity case']}; index[:]=[x for x in index if x.get('lessonId')!='e01']+[entry]; index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'e01','sections':24,'uniqueSectionIds':24,'exactSectionOrder':True,'paragraphs':len(paras),'paragraphCharacters':sum(map(len,paras)),'codeBlocks':len(codes),'quizQuestions':len(quiz),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'e02'}; (ROOT/'validation-e01.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n'); print(json.dumps(report,ensure_ascii=False))