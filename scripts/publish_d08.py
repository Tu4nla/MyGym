import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'

def section(i,sid,title,topics,code=None):
    blocks=[]
    for j,t in enumerate(topics,1):
        blocks.append({'type':'paragraph','content':t})
    if code:
        blocks.append({'type':'code','language':'kotlin','label':code[0],'content':code[1]})
    return {'id':sid,'title':f'{i}. {title}','blocks':blocks}

spec=[
('objectives','Mục tiêu bài học',[
'Modifier là pipeline mô tả cách một composable được đo, đặt vị trí, vẽ, nhận input, cung cấp semantics và truyền parent data. Người học phải giải thích được vì sao thứ tự modifier thay đổi kết quả và nhận diện phase mà từng modifier tác động.',
'Mục tiêu thực hành là thiết kế chain có size, padding, background, clip, click, scroll, focus và accessibility đúng thứ tự; viết custom Modifier.Node khi thật sự cần; tránh allocation, stale capture và measurement loop gây jank.']),
('prerequisites','Kiến thức nền',[
'Bài này kế thừa composition, layout, draw, Snapshot State, side effect, stability và LazyColumn. Constraints đi từ parent xuống child, size đi từ child lên parent, còn placement diễn ra sau measurement.',
'Composable function tạo UI tree; Modifier gắn hành vi vào node. Modifier là immutable chain, không phải mutable builder. Reuse chain an toàn khi nó không giữ state hoặc callback đã lỗi thời.']),
('terminology','Định nghĩa và chú giải thuật ngữ',[
'Modifier.Element là đơn vị chain truyền thống; Modifier.Node là kiến trúc node-based cho phép runtime reuse node và update field. LayoutModifierNode tham gia measure, DrawModifierNode tham gia draw, PointerInputModifierNode xử lý pointer, SemanticsModifierNode cung cấp accessibility.',
'Constraint gồm minWidth, maxWidth, minHeight và maxHeight. Parent data modifier truyền metadata cho parent layout, ví dụ weight trong RowScope hoặc align trong BoxScope. Inspector information chỉ phục vụ tooling.']),
('mechanism','Cơ chế hoạt động bên trong',[
'Runtime materialize chain thành chuỗi node theo đúng thứ tự khai báo. Constraints và input thường đi từ ngoài vào trong; size và draw result đi từ trong ra ngoài. Vì vậy padding().background() và background().padding() tạo vùng tô khác nhau.',
'Layout modifier nhận constraints, biến đổi chúng, measure child rồi trả layout size và placement. size tôn trọng constraints; requiredSize có thể ép child vượt preference của parent. Draw modifier có thể vẽ trước hoặc sau content bằng drawBehind hoặc drawWithContent.',
'Khi element tương thích, node được giữ lại và chỉ update property, giảm allocation. Lambda hoặc object mới mỗi recomposition vẫn có thể gây churn; cost thực tế phải đo thay vì suy luận từ độ dài chain.'],('Thứ tự làm thay đổi kết quả','Modifier\n    .background(Color.Gray)\n    .padding(16.dp)\n    .clickable(onClick = onClick)')),
('purpose','Mục đích của kỹ thuật',[
'Modifier tách behavior chéo khỏi nội dung composable, giúp caller cấu hình layout, interaction và semantics mà không cần wrapper cho từng concern. API modifier hỗ trợ composition thay vì inheritance.',
'Contract tốt là caller kiểm soát placement bên ngoài, composable sở hữu nội dung, internal modifier chỉ áp hành vi bắt buộc. Kết quả là UI dễ reuse, preview, test và hỗ trợ accessibility hơn.']),
('problem','Vấn đề kỹ thuật được giải quyết',[
'Không có modifier chain, padding, click, focus, shadow và semantics dễ tạo hierarchy lồng sâu, API cứng và khó tối ưu. Modifier ghép behavior theo pipeline xác định.',
'Sai order gây hit target nhỏ, ripple bị clip sai, background thiếu vùng, scroll xung đột, focus không tới hoặc semantics bị ghi đè. Custom measure sai còn có thể đo child nhiều lần hoặc tạo layout loop.']),
('when-to-use','Dấu hiệu cần dùng',[
'Dùng modifier để caller kiểm soát size, spacing, placement, interaction, focus, semantics và test tag. Dùng custom modifier khi behavior lặp ở nhiều composable hoặc cần can thiệp phase cụ thể.',
'Modifier.Node phù hợp cho draw, pointer, layout hoặc observer hot-path cần lifecycle attach/detach và reuse node. Modifier.composed chỉ dùng khi thật sự cần composable APIs.']),
('when-not-to-use','Khi không nên dùng',[
'Không chứa repository, navigation decision, network call hoặc business rule trong modifier. Side effect dài hạn thuộc ViewModel, effect API hoặc owner khác.',
'Không viết custom layout nếu Row, Box hoặc built-in modifier đã đủ. Không dùng pointerInput cho click đơn giản vì clickable đã xử lý semantics, focus, touch target và indication.']),
('requirement','Yêu cầu sản phẩm cụ thể',[
'Job card cần click toàn card, ripple nằm trong shape, bookmark có semantics riêng và không kích hoạt mở card. Chain phải bảo đảm clip, indication, padding, minimum touch target và test tag ổn định.',
'Chat bubble cần max width theo màn hình, align trái/phải bằng parent data, long-press mở menu, link vẫn click được, selection không xung đột scroll và status icon giữ baseline. Acceptance criteria gồm TalkBack, keyboard focus và RTL.']),
('analysis','Phân tích dependency, error policy, lifecycle và resource limits',[
'Dependency: custom modifier chỉ nhận dữ liệu UI nhỏ và callback; không giữ Activity, NavController hoặc repository. Callback nên idempotent và không throw làm hỏng input pipeline.',
'Lifecycle: Modifier.Node có onAttach, onDetach và update; listener phải đăng ký và dọn đúng vòng đời. pointerInput coroutine bị cancel khi key đổi hoặc node rời tree. remember trong composed theo composition, không theo node lifecycle.',
'Resource: drawWithCache chỉ có lợi khi cache object đắt theo size hoặc state ít đổi. graphicsLayer có memory/offscreen cost; blur, alpha và shadow có thể tạo layer. pointer loop không được block main thread.',
'Concurrency: state đọc ở draw có thể invalidate draw mà không cần recomposition, nhưng mutation vẫn theo Snapshot contract. Chain dài không tự động chậm; work trong node và phase invalidation mới là thứ cần profiler.']),
('minimal-code','Ví dụ code tối giản',[
'Public composable nên nhận modifier sau các required parameter và áp dụng lên root đúng một lần. Internal modifier nối theo contract; caller modifier thường nằm ngoài để kiểm soát placement.',
'Nested clickable phải có role rõ. Action phụ nên có semantics riêng và callback chỉ mang ID để tránh capture object mutable.'],('API composable chuẩn','@Composable\nfun JobCard(job: JobUi, onOpen: (String) -> Unit, modifier: Modifier = Modifier) {\n    Row(modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).clickable { onOpen(job.id) }.padding(16.dp)) {\n        Text(job.title)\n    }\n}')),
('upzi-case','Ví dụ thực tế Upzi',[
'confirmed: Upzi dùng Jetpack Compose và có job card, chat, rich text, deep link cùng các danh sách tương tác. Modifier trực tiếp quyết định click area, layout, semantics và testability của các màn này.',
'inferred: một số màn có thể dùng nested clickable, zIndex hoặc custom rich text modifier nhưng chưa xác nhận chain. proposed: chuẩn hóa order cho card, bubble và media picker; thêm semantics/testTag tại boundary; đo graphicsLayer và draw cost. needs-confirmation: cần đọc source trước khi mô tả custom Modifier.Node như kinh nghiệm đã triển khai.']),
('alternatives','Phương án thay thế',[
'Wrapper composable phù hợp khi cần semantic structure hoặc nhiều child, ví dụ Surface, Card hay custom Layout. CompositionLocal dành cho ambient data, không thay modifier cho behavior cục bộ.',
'RecyclerView ItemDecoration hoặc View interop có thể cần trong legacy. Chuyển behavior đơn giản sang wrapper View thường làm tăng hierarchy và mất lợi thế Compose node pipeline.']),
('tradeoffs','Lý do lựa chọn và trade-off',[
'Built-in modifier có accessibility và interaction contract đã được kiểm thử nhưng ít linh hoạt hơn. Custom Modifier.Node tối ưu và lifecycle rõ, đổi lại cần hiểu invalidation, update semantics và node coordinator.',
'graphicsLayer có thể giảm redraw khi transform nhưng tăng memory. drawWithCache giảm allocation khi dependency đúng nhưng tăng complexity. Reuse chain giảm churn nhưng stale callback có thể gây bug.']),
('edge-cases','Edge cases',[
'Order giữa clip, background, border, shadow và clickable tạo kết quả trực quan khác nhau. Shadow vẽ ngoài bounds có thể bị parent clip; alpha trên graphicsLayer có thể cần offscreen buffer.',
'Pointer events có pass Initial, Main và Final; consume quá sớm có thể chặn child. transformable, draggable và scrollable phải phối hợp nested scroll. Keyboard và rotary input đi theo pipeline khác pointer.',
'Intrinsic measurement có thể đắt và custom LayoutModifier phải hỗ trợ hợp lý. Baseline alignment cần alignment lines. start/end phản ứng RTL còn left/right thì không.',
'Local state của modifier trong LazyColumn phụ thuộc stable item key. Key đổi có thể detach node và mất gesture state. clearAndSetSemantics có thể vô tình xóa semantics descendants.'],('Draw cache','Modifier.drawWithCache {\n    val stroke = Stroke(2.dp.toPx())\n    onDrawBehind { drawRoundRect(Color.Gray, style = stroke) }\n}')),
('mistakes','Sai lầm thường gặp',[
'Lỗi phổ biến: bỏ modifier parameter, áp dụng modifier nhiều lần, đặt padding ngoài clickable làm hit target nhỏ, dùng requiredSize không hiểu constraints, click icon quá nhỏ và gắn testTag khắp tree.',
'Lỗi sâu: dùng Modifier.composed theo thói quen, remember callback sai key, giữ Context trong node, gọi invalidateDraw liên tục, measure child nhiều lần và dùng graphicsLayer cho mọi animation.']),
('interview-basic','Câu hỏi phỏng vấn cơ bản',[
'Câu hỏi nền: Modifier là gì, vì sao order quan trọng, padding trước background khác sau background thế nào, size khác requiredSize ra sao, clickable khác pointerInput thế nào và parent data modifier là gì.',
'Câu trả lời tốt mô tả pipeline constraints, measure, placement, draw, input và semantics thay vì chỉ nói modifier là chuỗi thuộc tính.']),
('interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',[
'Câu xoáy: constraints đi qua hai layout modifier thế nào; state đọc trong draw invalidates phase nào; Modifier.Node update ra sao; composed có chi phí gì; graphicsLayer khi nào tạo offscreen layer.',
'Câu bẫy: chain dài có luôn chậm không? Không. requiredSize có tuyệt đối không? Không hoàn toàn; parent vẫn coerce reported size và placement có thể làm child bị center hoặc clip.']),
('experience-answer','Mẫu trả lời gắn với kinh nghiệm',[
'Mẫu trả lời: “Tôi cho composable nhận modifier từ caller, áp lên root một lần và review order theo hit target, clip, indication và padding. Với gesture/draw hot-path, tôi ưu tiên built-in và chỉ viết Modifier.Node sau khi đo.”',
'Khi nói Upzi, chỉ dùng confirmed cho Compose và màn tương tác đã biết. Chain cụ thể, custom node và profiler result phải gắn inferred, proposed hoặc needs-confirmation.']),
('practice','Bài tập thực hành',[
'Xây JobCard click toàn card, bookmark riêng, ripple đúng shape, minimum touch target, TalkBack role và test tag. Viết test chứng minh bookmark không mở card.',
'Viết Modifier.Node vẽ debug bounds, log onAttach/onDetach và so sánh allocation với Modifier.composed trong danh sách 100 item.']),
('scenario','Bài tập tình huống',[
'Media picker có grid ba cột, selection badge và press animation. Sau khi thêm graphicsLayer từng cell, memory tăng và scroll jank. Hãy xác định layer cần thiết, order và phép đo frame time.',
'Chat bubble có long press, link click và selection. Thiết kế input priority, semantics và fallback để scroll mượt, link không bị nuốt và TalkBack có action rõ.']),
('checklist','Checklist tự đánh giá',[
'Tôi giải thích được order outer-to-inner; phân biệt layout, draw, input, semantics và parent data; biết khi dùng clickable, pointerInput, graphicsLayer, drawWithCache và Modifier.Node.',
'Tôi kiểm tra touch target, TalkBack, focus, RTL, stable key, lifecycle cleanup, allocation và profiler trước khi tối ưu.']),
('summary','Tóm tắt cần nhớ',[
'Modifier là pipeline hành vi có thứ tự, không phải danh sách style độc lập. Caller modifier áp lên root một lần; built-in được ưu tiên; custom node chỉ dùng khi có contract rõ.',
'Hiệu năng phụ thuộc phase và work: constraints, measurement, layer, draw, pointer loop, semantics và allocation. Correctness, accessibility và đo đạc quan trọng hơn rút ngắn chain.']),
('quiz-guide','Quiz có giải thích đáp án',[
'Quiz kiểm tra order, constraint, hit target, draw, node lifecycle, semantics và performance. Mỗi đáp án có giải thích để tránh học thuộc tên API.',
'Hãy tự trả lời trước khi xem đáp án và mô tả runtime pipeline cho ít nhất ba câu.'])]

sections=[]
for i,item in enumerate(spec,1):
    sid,title,paras=item[:3]
    code=item[3] if len(item)>3 else None
    sections.append(section(i,sid,title,paras,code))

questions=[
('Vì sao thứ tự Modifier quan trọng?','Mỗi element biến đổi pipeline phía sau','Chỉ là metadata','Compiler tự sắp xếp','Chỉ ảnh hưởng preview'),
('padding trước clickable thường gây gì?','Vùng padding ngoài không click','Crash','Network call','Không khác'),
('Khi nào ưu tiên clickable?','Click chuẩn cần semantics và focus','Raw multi-touch','Event pass custom','Gesture phức tạp'),
('requiredSize khác size thế nào?','Có thể ép child vượt preference constraints','Luôn nhỏ hơn','Chỉ dùng Text','Không measure'),
('Modifier.Node có lợi ích gì?','Reuse node và update field','Gọi repository','Lưu process death','Thay ViewModel'),
('drawWithCache phù hợp khi nào?','Resource draw đắt, dependency ít đổi','Mọi draw','Network','Navigation'),
('Parent data modifier làm gì?','Truyền metadata cho parent layout','Gọi API','Lưu DB','Tạo coroutine'),
('graphicsLayer luôn nhanh hơn?','Không, có memory/offscreen cost','Luôn có','Chỉ debug','Chỉ XML'),
('clearAndSetSemantics có rủi ro gì?','Xóa semantics descendants','Tăng minSdk','Mất coroutine','Đổi constraints'),
('Public composable áp modifier thế nào?','Nhận default và áp root một lần','Bỏ modifier','Áp mọi child','Singleton'),
('Chain dài có chắc chậm?','Không, phụ thuộc work và reuse','Có','Chỉ release','Chỉ emulator'),
('pointerInput key đổi thì sao?','Coroutine cancel và restart','Lưu Bundle','Chạy background','Không đổi')]
quiz=[]
for i,(q,a,b,c,d) in enumerate(questions,1):
    quiz.append({'id':f'd08-q{i:02}','question':q,'options':[{'id':'a','text':a},{'id':'b','text':b},{'id':'c','text':c},{'id':'d','text':d}],'correctOptionIds':['a'],'explanation':f'Đáp án a đúng vì {a.lower()}; các phương án còn lại không phản ánh contract của Compose Modifier.'})

lesson={'id':'d08','code':'D08','title':'Modifier','summary':'Hiểu Modifier như pipeline layout, draw, input và semantics; nắm order, constraints, Modifier.Node, accessibility và tối ưu dựa trên đo đạc.','estimatedMinutes':360,'sections':sections,'quiz':quiz}
lesson_path=DATA/'lessons'/'d'/'d08.json'
lesson_path.parent.mkdir(parents=True,exist_ok=True)
lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':'))+'\n')
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in sections]
paras=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']
codes=[b for s in sections for b in s['blocks'] if b['type']=='code']
assert ids==required and len(set(ids))==24
assert len(paras)>=40 and sum(map(len,paras))>=9000 and len(codes)>=3 and len(quiz)>=10
text=lesson_path.read_text()
for label in ['confirmed:','inferred:','proposed:','needs-confirmation:']: assert label in text
catalog_path=DATA/'catalog.json'; catalog=json.loads(catalog_path.read_text())
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='d08': item['status']='published'; item['estimatedMinutes']=360
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text())
if 'd08' not in plan['completed']: plan['completed'].append('d08')
plan['current']='d09'; plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text())
entry={'lessonId':'d08','code':'D08','title':'Modifier','keywords':['Modifier','Modifier.Node','LayoutModifierNode','DrawModifierNode','PointerInputModifierNode','SemanticsModifierNode','constraints','modifier order','clickable','pointerInput','graphicsLayer','drawWithCache','parent data'],'headings':['Modifier chain và thứ tự','Layout constraints','Draw và layer','Pointer input','Semantics và accessibility','Modifier.Node','Custom modifier','Upzi case study']}
assert isinstance(index,list)
index[:]=[x for x in index if x.get('lessonId')!='d08']+[entry]
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'d08','sections':24,'uniqueSectionIds':24,'exactSectionOrder':True,'paragraphs':len(paras),'paragraphCharacters':sum(map(len,paras)),'codeBlocks':len(codes),'quizQuestions':len(quiz),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'d09'}
(ROOT/'validation-d08.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
