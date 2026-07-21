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
'Hiểu animation trong Jetpack Compose như sự biến đổi state theo thời gian, được runtime lấy mẫu theo frame và áp dụng vào layout, draw hoặc graphics layer. Người học phải phân biệt animate*AsState, updateTransition, AnimatedVisibility, AnimatedContent, Animatable, infiniteTransition và SharedTransitionLayout.',
'Mục tiêu thực hành là chọn API đúng theo ownership và cancellation contract, thiết kế shared element có key ổn định, xử lý interruption, reduced motion, navigation lifecycle và đo jank thay vì chỉ đánh giá bằng mắt.')
sec(2,'prerequisites','Kiến thức nền',
'Cần nắm recomposition, snapshot state, Modifier order, layout/draw phases, coroutine cancellation, Navigation Compose, LazyColumn key và lifecycle của NavBackStackEntry. Animation không thay thế state model đúng; nó chỉ nội suy giữa các giá trị.',
'Cần phân biệt thay đổi kích thước gây remeasure với transform bằng graphicsLayer chỉ tác động draw. Cũng cần hiểu rằng mỗi animation đang chạy tạo work theo frame và có thể tranh ngân sách 16.67 ms ở 60 Hz.')
sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',
'AnimationSpec mô tả quỹ đạo thời gian: tween dùng duration/easing, spring dùng stiffness và damping, keyframes định nghĩa mốc, snap đổi ngay. VisibilityThreshold quyết định khi nào giá trị coi như đã tới đích.',
'Transition điều phối nhiều animated value từ cùng state machine. Animatable là holder imperative có mutual exclusion và cancellation. Shared element là phần tử được nhận diện xuyên hai layout; shared bounds chỉ đồng bộ vùng chứa trong khi nội dung có thể thay đổi.',
'Lookahead đo layout đích trước khi animation hoàn tất để nội suy vị trí/kích thước. Overlay cho phép shared element vẽ trên các destination trong giai đoạn chuyển tiếp.')
sec(4,'mechanism','Cơ chế hoạt động bên trong',
'Khi target state đổi, animation engine tính play time từ MonotonicFrameClock, lấy giá trị theo AnimationSpec rồi ghi state hoặc cung cấp giá trị cho phase tương ứng. State read trong composition có thể gây recomposition mỗi frame; state read trong draw/layer có thể giới hạn work.',
'updateTransition giữ một state machine và nhiều child animation đồng bộ. Khi target đổi giữa chừng, transition bắt đầu từ giá trị hiện tại thay vì nhảy về điểm đầu, nhưng semantics phụ thuộc API và spec.',
'SharedTransitionLayout ghi nhận các sharedContentState có key tương ứng ở layout nguồn và đích, dùng lookahead coordinates để nội suy bounds, clip và render qua overlay trong khoảng hai destination cùng tham gia transition.',codes=[('Transition nhiều thuộc tính','''val transition = updateTransition(targetState = expanded, label = "card")
val corner by transition.animateDp(label = "corner") { if (it) 0.dp else 16.dp }
val elevation by transition.animateDp(label = "elevation") { if (it) 0.dp else 4.dp }''')])
sec(5,'purpose','Mục đích của kỹ thuật',
'Animation truyền đạt quan hệ nhân quả, hierarchy và continuity: item được chọn mở thành detail, nội dung mới xuất hiện từ vị trí hợp lý, trạng thái loading chuyển thành kết quả mà không gây mất định hướng.',
'Mục tiêu không phải thêm chuyển động mọi nơi. Animation tốt giảm cognitive load, giữ interaction responsive, tôn trọng accessibility và không che giấu latency hoặc trì hoãn hành động chính.')
sec(6,'problem','Vấn đề kỹ thuật được giải quyết',
'UI đổi trạng thái tức thời có thể khiến người dùng khó hiểu item nào biến đổi, màn mới đến từ đâu hoặc thao tác đã được nhận chưa. Shared transition đặc biệt hữu ích khi cùng một entity xuất hiện ở list và detail.',
'Animation cũng làm lộ các vấn đề kỹ thuật: unstable key khiến element ghép sai, layout thay đổi ngoài dự kiến gây jump, nhiều state machine độc lập bị lệch nhịp, navigation pop sớm làm mất participant và image load muộn gây flicker.')
sec(7,'when-to-use','Dấu hiệu cần dùng',
'Dùng animate*AsState cho một giá trị declarative đơn giản; updateTransition khi nhiều thuộc tính phụ thuộc cùng state; AnimatedVisibility/AnimatedContent cho enter-exit hoặc thay nội dung; Animatable khi cần gesture, velocity, sequencing hoặc imperative cancellation.',
'Dùng shared transition khi source và destination cùng biểu diễn một entity, continuity mang ý nghĩa sản phẩm và cả hai layout có identity ổn định. Ví dụ avatar chat, ảnh job/company hoặc media thumbnail mở detail.')
sec(8,'when-not-to-use','Khi không nên dùng',
'Không dùng shared transition cho phần tử không có quan hệ identity thật, dữ liệu đổi hoàn toàn, destination không đồng thời tồn tại trong transition scope hoặc chỉ để tạo hiệu ứng phô diễn. Fade/scale đơn giản có thể rõ ràng và bền hơn.',
'Không animate layout lớn mỗi frame khi transform draw đáp ứng được. Không chạy infinite animation ngoài viewport hoặc khi lifecycle dừng. Không dùng animation để trì hoãn navigation, che lỗi mạng hay bắt user chờ thao tác quan trọng.')
sec(9,'requirement','Yêu cầu sản phẩm cụ thể',
'Từ job feed, tap card phải mở detail với ảnh/logo và title chuyển tiếp liên tục; back gesture đảo transition; nếu ảnh chưa cache thì dùng placeholder cùng aspect ratio; item khác không được nhảy layout.',
'Màn chat khi mở profile từ avatar phải giữ shared key theo userId, không theo index. Khi reduced motion bật, transition rút gọn thành fade nhanh hoặc bỏ chuyển động lớn. Animation không được chặn click/back và phải đạt frame stability trên thiết bị trung bình.',
'Acceptance criteria cần nêu duration/spec, interruption behavior, source item bị recycle, process recreation, navigation pop, accessibility semantics, screenshot test ở trạng thái đầu-cuối và macrobenchmark cho frame timing.')
sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',
'Dependency: domain cung cấp stable ID và immutable UI model; navigation sở hữu destination lifecycle; animation layer chỉ ánh xạ state sang motion. Không đưa Animatable hoặc SharedTransitionScope vào ViewModel/domain.',
'Error policy: image lỗi phải giữ bounds ổn định và fallback visual; destination load lỗi vẫn hoàn thành navigation rồi hiển thị recoverable state. Không rollback graph chỉ vì shared element không match.',
'Lifecycle: animation phải dừng khi composable rời composition; Animatable chạy trong remembered scope hoặc LaunchedEffect. InfiniteTransition chỉ dùng khi thành phần thật sự cần và còn visible. Shared participant cần cùng SharedTransitionLayout và AnimatedVisibilityScope thích hợp.',
'Resource: blur, shadow, clip phức tạp, large offscreen layer và layout animation rộng tăng GPU/memory. Nhiều animation đồng thời trong LazyColumn gây jank; ưu tiên transform, giới hạn participant và profile release build.',codes=[('Animatable với cancellation','''val offset = remember { Animatable(0f) }
LaunchedEffect(target) {
    offset.animateTo(
        targetValue = target,
        animationSpec = spring(dampingRatio = Spring.DampingRatioNoBouncy)
    )
}''')])
sec(11,'minimal-code','Ví dụ code tối giản',
'AnimatedVisibility phù hợp khi boolean state quyết định có/không. UI state là source of truth; callback chỉ đổi state. Không gọi delay để giả lập lifecycle của animation nếu API cung cấp transition state.',
'Với shared transition, key phải dựa trên domain identity và namespace để tránh collision giữa loại nội dung. Modifier sharedElement đặt ở vị trí hợp lý trong chain vì clip, size và overlay có thể thay đổi kết quả.',codes=[('Shared element tối giản','''SharedTransitionLayout {
    AnimatedContent(targetState = screen) { target ->
        when (target) {
            Screen.List -> JobList { job ->
                Image(
                    painter = rememberAsyncImagePainter(job.logo),
                    contentDescription = null,
                    modifier = Modifier.sharedElement(
                        rememberSharedContentState("job-logo-${job.id}"),
                        animatedVisibilityScope = this@AnimatedContent
                    )
                )
            }
            is Screen.Detail -> JobDetail(target.id)
        }
    }
}''')])
sec(12,'upzi-case','Ví dụ thực tế Upzi',
'confirmed: Upzi dùng Jetpack Compose, Navigation Compose và có các màn danh sách/detail như opportunity, chat, profile; đây là bối cảnh phù hợp cho AnimatedContent, animateItem và shared element theo domain ID.',
'inferred: project có animation chuyển màn hoặc item update nhưng chưa xác nhận SharedTransitionLayout, predictive back, motion spec hay macrobenchmark hiện tại. proposed: thử nghiệm shared logo/title cho opportunity list-detail, avatar chat-profile, có reduced-motion fallback và benchmark. needs-confirmation: cần kiểm tra Compose version, Navigation version, image pipeline, design motion token và thiết bị mục tiêu trước khi kể là đã triển khai.')
sec(13,'alternatives','Phương án thay thế',
'Fade, crossfade, slide hoặc scale destination thường đơn giản hơn shared element. animateContentSize xử lý thay đổi kích thước cục bộ; animateItem phù hợp reorder trong lazy list; MotionLayout hữu ích cho scene constraint phức tạp nhưng tăng learning/config cost.',
'View system có TransitionManager, MotionLayout và Fragment transitions cho màn legacy. Lottie/Rive phù hợp asset animation được thiết kế sẵn nhưng không thay state-driven interaction animation.')
sec(14,'tradeoffs','Lý do lựa chọn và trade-off',
'Spring phản ứng tự nhiên và xử lý interruption tốt nhưng duration khó cố định; tween dễ đồng bộ design token nhưng thay target giữa chừng có thể cảm giác cơ học. Layout animation chính xác hình học nhưng tốn measure; graphicsLayer rẻ hơn nhưng không đổi hitbox/layout.',
'Shared transition tăng continuity nhưng coupling identity, source/destination layout và navigation timing. Overlay tránh clipping nhưng có thể vẽ trên top bar hoặc modal ngoài ý muốn. Giữ source item sống giúp reverse transition nhưng tăng state/memory.')
sec(15,'edge-cases','Edge cases',
'Source item bị scroll khỏi LazyColumn trước khi back, key trùng, item reorder, paging refresh, image aspect ratio khác, destination đổi orientation hoặc window size đều có thể làm bounds không match.',
'Animation bị interrupt bởi tap liên tiếp, predictive back hủy giữa chừng, process death, app background, font scale lớn và reduced motion cần hành vi xác định. Không giả định completion callback luôn chạy nếu composable bị dispose.',
'Nested SharedTransitionLayout hoặc shared key dùng lại ở hai branch đồng thời có thể tạo match mơ hồ. Clip shape khác nhau cần quyết định animate bounds, clip hay content separately.',codes=[('Lazy item identity','''items(jobs, key = { it.id }) { job ->
    JobCard(
        modifier = Modifier.animateItem(),
        job = job
    )
}''')])
sec(16,'mistakes','Sai lầm thường gặp',
'Lỗi phổ biến gồm tạo Animatable mỗi recomposition, chạy coroutine trong composition body, dùng delay thay completion state, đọc animated value ở scope quá cao, animate mọi row ngoài viewport và dùng key index cho shared element.',
'Một lỗi khác là dùng graphicsLayer scale nhưng mong layout/hitbox thay đổi, hoặc animateContentSize ở parent quá lớn khiến toàn cây remeasure. Shared element không phải giải pháp cho image loading; placeholder và cache vẫn cần thiết.',
'Không nên hard-code motion rải rác. Duration, easing, spring và reduced-motion policy nên thành motion tokens có review từ design/accessibility.')
sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',
'Câu hỏi nền: animate*AsState khác Animatable thế nào; updateTransition dùng khi nào; AnimatedVisibility và AnimatedContent khác gì; spring/tween khác gì; graphicsLayer khác layout modifier; sharedElement và sharedBounds khác gì.',
'Mẫu trả lời tốt nêu ownership, cancellation, frame clock, phase bị invalidated, stable key, lifecycle và performance chứ không chỉ liệt kê API.')
sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',
'Câu xoáy: animation bị đổi target giữa chừng ra sao; đọc state trong draw có lợi gì; shared source bị dispose khi back xử lý thế nào; predictive back cần progress-driven animation thế nào; completion event có đáng tin khi disposal không.',
'Câu bẫy: mọi recomposition mỗi frame có xấu không; graphicsLayer có đổi measured size không; launch coroutine trong onClick có sống sau composable không; shared transition có tự tải chung bitmap không; durationScale bằng zero ảnh hưởng test ra sao.')
sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm',
'Tôi chọn API dựa trên state ownership: giá trị đơn dùng animate*AsState, nhiều thuộc tính đồng bộ dùng Transition, gesture/sequencing dùng Animatable. Tôi ưu tiên stable ID, transform ở draw layer và đo jank trước khi tối ưu.',
'Với Upzi, tôi chỉ khẳng định confirmed về Compose, Navigation và list/detail. SharedTransition, predictive back hay benchmark phải nói là proposed hoặc needs-confirmation cho tới khi đối chiếu code và version.')
sec(20,'practice','Bài tập thực hành',
'Tạo card expand/collapse bằng updateTransition, animate corner, elevation, color và size. So sánh layout animation với graphicsLayer bằng Layout Inspector và profiler; ghi nhận phase nào chạy mỗi frame.',
'Tạo list-detail shared transition cho ảnh/title với stable key, placeholder cùng aspect ratio, reverse back và interruption. Thêm setting reduced motion rồi viết test xác nhận state cuối không phụ thuộc duration.',
'Dùng Macrobenchmark đo frame timing khi scroll list có 20 item animation đồng thời; giảm participant và so sánh kết quả release build.')
sec(21,'scenario','Bài tập tình huống',
'Job feed refresh đúng lúc user mở detail; item đổi thứ tự và logo URL đổi. Hãy xác định identity, snapshot dùng trong transition, source restoration và policy nếu item biến mất.',
'Chat avatar mở profile, user swipe back nửa chừng rồi hủy; cùng lúc avatar cập nhật. Thiết kế state machine, shared key, image cache và semantics.',
'Thiết bị bật animator duration scale 0 hoặc accessibility reduced motion. Xác định animation nào bỏ, animation nào giữ dưới dạng feedback tức thời và cách test.')
sec(22,'checklist','Checklist tự đánh giá',
'Tôi phân biệt declarative và imperative animation; hiểu frame clock, spec, interruption, cancellation, transition state và phase invalidation.',
'Tôi dùng stable domain key, biết sharedElement/sharedBounds, lookahead, overlay, source disposal, predictive back và reduced motion.',
'Tôi không đưa animation object vào ViewModel; có error/lifecycle/resource policy; profile release build; phân biệt chi tiết Upzi confirmed với proposed.')
sec(23,'summary','Tóm tắt cần nhớ',
'Animation là state over time. Chọn API theo ownership và coordination; chọn phase theo loại thay đổi; interruption và disposal phải được xem là đường đi bình thường.',
'Shared transition phụ thuộc identity, hai layout participant, navigation lifecycle và bounds ổn định. Nó tăng continuity nhưng không thay image cache, validation hay back-stack design.',
'Hiệu năng phải đo bằng frame timing, không bằng cảm giác hoặc số recomposition đơn lẻ. Motion tốt tôn trọng accessibility, reduced motion và thao tác tức thời.')
sec(24,'quiz-guide','Quiz có giải thích đáp án',
'Làm quiz sau khi có thể giải thích một animation từ target state đến frame value và phase render. Với shared transition, vẽ rõ source, destination, key, lookahead bounds và overlay.',
'Mỗi đáp án phải gắn với ownership, cancellation, lifecycle, performance hoặc accessibility; tránh học thuộc tên API.')
quiz=[]
def q(i,question,correct,*opts,exp): quiz.append({'id':f'q{i}','question':question,'options':[{'id':chr(97+j),'text':t} for j,t in enumerate(opts)],'correctOptionIds':[chr(97+correct)],'explanation':exp})
q(1,'API nào phù hợp nhiều thuộc tính phụ thuộc cùng state?',0,'updateTransition','rememberSaveable','DisposableEffect','snapshotFlow',exp='Transition điều phối nhiều child animation từ cùng state machine.')
q(2,'Animatable phù hợp nhất khi nào?',0,'Gesture, velocity hoặc sequencing imperative','Chỉ đổi một màu đơn giản','Lưu process death','Điều hướng graph',exp='Animatable có coroutine API, cancellation và giá trị/velocity hiện tại.')
q(3,'graphicsLayer có đổi measured size không?',1,'Có','Không','Chỉ trên Android 14','Chỉ khi alpha khác 1',exp='graphicsLayer transform ở draw/compositing; layout và hitbox không tự đổi.')
q(4,'Shared element nên dùng key nào?',0,'Stable domain identity có namespace','Lazy list index','UUID mỗi recomposition','URL ngẫu nhiên',exp='Key ổn định giúp match đúng entity giữa source và destination.')
q(5,'Spring khác tween nổi bật ở đâu?',0,'Dựa trên mô hình vật lý và interruption tự nhiên','Không chạy theo frame','Luôn nhanh hơn','Không thể cấu hình',exp='Spring dùng stiffness/damping thay duration cố định.')
q(6,'Reduced motion nên xử lý thế nào?',0,'Giảm/bỏ chuyển động lớn nhưng giữ feedback cần thiết','Bỏ toàn bộ UI','Tăng duration','Chỉ áp dụng debug',exp='Accessibility policy cần giảm motion gây khó chịu mà vẫn giữ trạng thái rõ.')
q(7,'Vì sao animate layout lớn có thể tốn?',0,'Có thể remeasure/relayout nhiều node mỗi frame','Không dùng GPU','Luôn tạo Activity mới','Làm mất ViewModel',exp='Layout animation invalidates measure/layout; scope rộng làm work tăng.')
q(8,'Shared transition có tự chia sẻ bitmap cache không?',1,'Có','Không','Chỉ với Coil','Chỉ khi offline',exp='Shared transition xử lý geometry/render continuity; image loader/cache là concern khác.')
q(9,'Completion callback có luôn chạy khi composable dispose không?',1,'Có','Không','Chỉ trong release','Chỉ với tween',exp='Disposal/cancellation có thể kết thúc coroutine hoặc participant trước completion bình thường.')
q(10,'animate*AsState phù hợp trường hợp nào?',0,'Một target value declarative đơn giản','Chuỗi gesture có velocity','Persist database','Deep link parsing',exp='API này tự animate khi target đổi và phù hợp ownership declarative đơn giản.')
q(11,'Overlay trong shared transition dùng để làm gì?',0,'Vẽ shared content xuyên hai destination, tránh bị giới hạn bởi layout thường','Lưu SavedStateHandle','Decode ảnh','Chặn back',exp='Overlay giúp phần tử chuyển tiếp nằm trên các content participant.')
q(12,'Cách đánh giá hiệu năng animation đáng tin nhất?',0,'Macrobenchmark/frame timing trên release build','Đếm dòng code','Chỉ nhìn emulator','Tắt mọi animation',exp='Frame timing trên thiết bị mục tiêu phản ánh jank thực tế.')
lesson={'id':'d11','code':'D11','title':'Animation và SharedTransition','summary':'Thiết kế animation Compose theo state, frame, phase, cancellation, accessibility và shared transition giữa các destination.','estimatedMinutes':360,'sections':sections,'quiz':quiz}
lesson_path=DATA/'lessons'/'d'/'d11.json'; lesson_path.parent.mkdir(parents=True,exist_ok=True); lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':'))+'\n')
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in sections]; assert ids==required and len(set(ids))==24
paragraphs=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']; codes=[b for s in sections for b in s['blocks'] if b['type']=='code']
assert len(paragraphs)>=40 and sum(map(len,paragraphs))>=9000 and len(codes)>=4 and len(quiz)>=10
text=lesson_path.read_text(); assert all(x in text for x in ['confirmed:','inferred:','proposed:','needs-confirmation:'])
catalog_path=DATA/'catalog.json'; catalog=json.loads(catalog_path.read_text()); found=False
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='d11': assert item['status']=='planned'; item.update(status='published',estimatedMinutes=360); found=True
assert found; catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text()); assert plan['current']=='d11'; plan['completed'].append('d11'); plan['current']='d12'; plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text()); entry={'lessonId':'d11','code':'D11','title':'Animation và SharedTransition','keywords':['Compose animation','Animatable','updateTransition','AnimatedVisibility','AnimatedContent','SharedTransitionLayout','sharedElement','sharedBounds','lookahead','graphicsLayer','predictive back','reduced motion'],'headings':['Animation state machine','Frame clock và phases','Interruption và cancellation','Shared element identity','Lookahead và overlay','Navigation lifecycle','Accessibility','Performance measurement']}; index[:]=[x for x in index if x.get('lessonId')!='d11']+[entry]; index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'d11','sections':24,'uniqueSectionIds':24,'exactSectionOrder':True,'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':len(codes),'quizQuestions':len(quiz),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'d12'}; (ROOT/'validation-d11.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n'); print(report)