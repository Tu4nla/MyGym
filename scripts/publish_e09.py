import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'android-learning' / 'data'
sections = []

def sec(i, sid, title, *paras, codes=None):
    blocks = [{'type':'paragraph','content':p} for p in paras]
    for code in codes or []:
        blocks.append({'type':'code','language':'kotlin','label':code[0],'content':code[1]})
    sections.append({'id':sid,'title':f'{i}. {title}','blocks':blocks})

sec(1,'objectives','Mục tiêu bài học',
'Phân biệt deep link, web link và verified Android App Link; hiểu đầy đủ pipeline từ trình duyệt hoặc ứng dụng nguồn, Android intent resolver, domain verification, Activity, parser, auth gate đến destination nội bộ. Người học phải giải thích được vì sao App Link không chỉ là một intent-filter và vì sao domain verification không thay thế authorization.',
'Thiết kế contract URL bền vững cho nhiều môi trường, xử lý cold start, warm start và onNewIntent, chống xử lý trùng, dựng back stack đúng, hỗ trợ deferred deep link và kiểm thử bằng adb, App Links Assistant, domain verification state cùng instrumentation test.')
sec(2,'prerequisites','Kiến thức nền',
'Cần nắm Intent, intent-filter, Activity launch mode, task và back stack, PendingIntent, process death, Navigation Compose, SavedStateHandle, authentication state và nguyên tắc coi mọi input từ bên ngoài là dữ liệu không tin cậy.',
'D10 đã trình bày deep link trong Compose Navigation. Bài này mở rộng ở tầng platform và vận hành: Digital Asset Links, assetlinks.json, signing certificate, domain ownership, verification lifecycle, fallback web, analytics attribution và compatibility giữa Android version.')
sec(3,'terminology','Định nghĩa và chú giải thuật ngữ',
'Deep link là URI hoặc Intent đưa người dùng đến nội dung cụ thể. Custom scheme dùng scheme riêng như upzi://; web deep link dùng http hoặc https; Android App Link là web URL đã được hệ điều hành xác minh quan hệ giữa domain và ứng dụng.',
'Digital Asset Links là cơ chế công bố quan hệ tin cậy. File /.well-known/assetlinks.json trên domain chứa package name và SHA-256 fingerprint của signing certificate. android:autoVerify yêu cầu hệ thống thử xác minh các host trong intent-filter.',
'Deferred deep link là link được mở khi app chưa cài; sau cài đặt, attribution provider hoặc Play Install Referrer có thể khôi phục mục tiêu. Verified link state là trạng thái theo thiết bị, user và package, không phải thuộc tính bất biến của APK.')
sec(4,'mechanism','Cơ chế hoạt động bên trong',
'Khi người dùng mở URL, Android resolver tìm Activity có intent-filter phù hợp theo action, category, scheme, host và path. Với App Link đã verified và user chưa override, hệ thống có thể mở app trực tiếp; nếu chưa verified, URL có thể mở browser hoặc chooser tùy phiên bản Android và thiết lập người dùng.',
'Package manager tải assetlinks.json, kiểm tra package name và certificate fingerprint, rồi ghi domain verification state. Verification có thể thất bại do redirect, MIME type, TLS, CDN cache, file không public, fingerprint sai hoặc host được khai báo nhưng không có statement tương ứng.',
'Activity nhận Intent ở onCreate hoặc onNewIntent. App phải chuẩn hóa URI, validate allowlist, map sang typed command, chờ session/bootstrap/navigation ready, consume đúng một lần rồi destination tải dữ liệu thật từ repository.',
 codes=[('Intent filter App Link','''<activity
    android:name=".MainActivity"
    android:exported="true">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="www.upzi.vn" android:pathPrefix="/opportunity/" />
    </intent-filter>
</activity>''')])
sec(5,'purpose','Mục đích của kỹ thuật',
'App Link tạo một URL duy nhất hoạt động trên web và app, rút ngắn hành trình từ email, notification, QR, social post, campaign hoặc trang tìm kiếm tới nội dung cụ thể. Verified link giảm chooser và giảm nguy cơ ứng dụng khác chiếm custom scheme.',
'Một contract URL ổn định còn là API công khai của sản phẩm. Nó cho phép web, backend, marketing và mobile phối hợp mà không phụ thuộc trực tiếp vào route nội bộ hoặc cấu trúc NavGraph.')
sec(6,'problem','Vấn đề kỹ thuật được giải quyết',
'Không có contract và verification rõ ràng sẽ dẫn tới link mở browser thay vì app, mở nhầm flavor, crash vì argument thiếu, back stack lạ, duplicate destination, mất link qua login hoặc link cũ hỏng sau khi refactor navigation.',
'Deep link cũng là attack surface: host gần giống, path traversal logic, double decoding, query độc hại, token trong URL, open redirect hoặc route đặc quyền. Verification chỉ chứng minh domain liên kết với app; nó không chứng minh người dùng có quyền xem resource.')
sec(7,'when-to-use','Dấu hiệu cần dùng',
'Dùng App Link khi doanh nghiệp sở hữu domain và cần cùng URL mở web hoặc app, muốn trải nghiệm không chooser, hỗ trợ SEO/campaign/share và có khả năng vận hành assetlinks.json theo từng môi trường.',
'Dùng coordinator riêng khi có auth, onboarding, remote config/bootstrap, nhiều nguồn link, deferred deep link, nhiều account hoặc yêu cầu khôi phục pending destination qua process recreation.')
sec(8,'when-not-to-use','Khi không nên dùng',
'Không public deep link cho dialog, debug screen, màn phụ thuộc transient state hoặc thao tác đặc quyền không thể tái xác minh. Không truyền access token, dữ liệu cá nhân, object lớn hoặc command tùy ý trong URL.',
'Không dùng custom scheme làm lựa chọn mặc định khi đã sở hữu domain và cần chống hijacking. Không dùng App Link để thay navigation nội bộ đơn giản; public URL contract và internal route contract nên tách biệt.')
sec(9,'requirement','Yêu cầu sản phẩm cụ thể',
'Link https://www.upzi.vn/opportunity/{id} và /chat/{id} phải mở đúng nội dung ở cold start, warm start và foreground. Nếu chưa đăng nhập, app giữ pending command đúng một lần, mở login rồi tiếp tục; back không quay về splash hoặc tạo hai bản destination.',
'Dev, staging và production phải có host, package name và fingerprint riêng; assetlinks.json hỗ trợ certificate hiện tại và certificate rotation. Link không hợp lệ, resource đã xóa hoặc user không có quyền phải hiển thị fallback phục hồi được.',
'Acceptance criteria gồm verified state trên device matrix, browser fallback, analytics không chứa PII/token, TTL cho pending link, account binding, duplicate-tap protection và test update app khi route contract thay đổi.')
sec(10,'analysis','Phân tích dependency, error policy, lifecycle và resource limits',
'Dependency: domain/CDN và assetlinks.json thuộc platform operations; manifest thuộc app shell; parser/validator thuộc boundary; coordinator quản lý readiness và consumption; navigator nhận sealed command; ViewModel nhận ID nhỏ và repository xác minh dữ liệu cùng authorization.',
'Error policy: malformed URI, unsupported version, host sai hoặc path không hợp lệ phải fail closed và ghi telemetry đã sanitize. Auth failure đi qua auth gate; not-found và forbidden là domain error; network failure cho retry tại destination.',
'Lifecycle: Intent có thể đến trước NavHost và session. Coordinator cần trạng thái Pending, Ready, Consumed; onNewIntent phải setIntent hoặc submit intent mới. Pending command chỉ persist dữ liệu tối thiểu, có TTL và gắn account/session generation.',
'Resource limits: giới hạn độ dài URI, số query, kích thước extras và cardinality analytics. Không lưu raw URL nhạy cảm trong log, crash report hoặc SavedStateHandle nếu chứa dữ liệu cá nhân.',
 codes=[('Typed parser','''sealed interface DeepLinkCommand {
    data class Opportunity(val id: String) : DeepLinkCommand
    data class Chat(val id: String) : DeepLinkCommand
}

fun parseUpziLink(uri: Uri): DeepLinkCommand? {
    if (uri.scheme != "https" || uri.host !in setOf("www.upzi.vn", "www.dev.upzi.vn")) return null
    val segments = uri.pathSegments
    val id = segments.getOrNull(1)?.takeIf { it.matches(Regex("[A-Za-z0-9_-]{1,128}")) } ?: return null
    return when (segments.firstOrNull()) {
        "opportunity" -> DeepLinkCommand.Opportunity(id)
        "chat" -> DeepLinkCommand.Chat(id)
        else -> null
    }
}''')])
sec(11,'minimal-code','Ví dụ code tối giản',
'Manifest chỉ khai báo URL public. Activity không ghép raw URI thành route; nó chuyển URI sang candidate command. Coordinator chờ auth và NavHost ready, deduplicate theo stable key rồi navigator tạo internal route typed.',
'assetlinks.json phải được phục vụ trực tiếp qua HTTPS, không redirect và đúng JSON. Khi dùng Play App Signing, fingerprint cần lấy từ app signing certificate, không phải upload certificate.',
 codes=[('assetlinks.json mẫu','''[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "vn.upzi.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:...:FF"]
    }
  }
]''')])
sec(12,'upzi-case','Ví dụ thực tế Upzi',
'confirmed: Upzi dùng single-activity Compose Navigation; có deep link /opportunity/{id} và /chat/{id}; MainActivity có processDeepLink, consumedDeepLink và xử lý onNewIntent. Dev từng dùng host www.dev.upzi.vn và Adjust link upzidev.go.link.',
'inferred: Adjust có thể resolve attribution/deferred link trước khi app map sang internal command, nhưng chưa xác nhận đầy đủ assetlinks.json, domain verification state, launchMode, certificate matrix và fallback web.',
'proposed: tách pipeline thành resolver -> parser allowlist -> auth/bootstrap gate -> typed navigator; thêm verification CI cho từng host/fingerprint, dedup key, TTL/account binding và test cold/warm/foreground/deferred.',
'needs-confirmation: cần đối chiếu manifest từng flavor, file assetlinks.json thực tế, Play App Signing fingerprint, Adjust callback, task flags và implementation hiện tại trước khi kể như kinh nghiệm đã triển khai.')
sec(13,'alternatives','Phương án thay thế',
'Custom scheme dễ thiết lập và phù hợp callback OAuth nội bộ nhưng có nguy cơ collision/hijacking. Universal web URL với App Link tốt hơn cho public content. Explicit PendingIntent phù hợp notification trong app nhưng không thay URL chia sẻ.',
'Firebase Dynamic Links đã từng cung cấp deferred link nhưng kiến trúc không nên phụ thuộc một provider đã thay đổi vòng đời sản phẩm. Adjust hoặc Branch hỗ trợ attribution/deferred linking, song vẫn phải validate URL và authorization tại app.',
'Navigation Compose có thể match URI trực tiếp; parser trung tâm nhiều boilerplate hơn nhưng kiểm soát versioning, auth, telemetry, migration và security tốt hơn.')
sec(14,'tradeoffs','Lý do lựa chọn và trade-off',
'App Link cho UX liền mạch và chống scheme hijacking tốt hơn, đổi lại cần domain operations, certificate management, kiểm thử từng flavor và xử lý user override. Verification failure thường là lỗi liên hệ nhiều đội.',
'Một intent-filter rộng giảm số khai báo nhưng tăng attack surface; filter hẹp an toàn hơn nhưng dễ thiếu path mới. Parser thủ công tách URL khỏi NavGraph nhưng thêm mapping và test.',
'Persist pending link giúp qua login/process death nhưng tăng privacy và stale-command risk. Không persist đơn giản hơn nhưng có thể mất ý định người dùng. TTL, account binding và dữ liệu tối thiểu là điểm cân bằng.')
sec(15,'edge-cases','Edge cases',
'assetlinks.json bị CDN cache bản cũ, redirect www sang apex, nhiều subdomain, certificate rotation, debug/release fingerprint, Play App Signing, work profile và user manually chọn browser đều có thể làm verified state khác kỳ vọng.',
'URI có trailing slash, percent-encoding, Unicode, duplicate query key, fragment, mixed case host hoặc double encoding cần contract rõ. Không decode hai lần và không kiểm tra host bằng contains hoặc endsWith thiếu dấu chấm biên.',
'App đang ở đúng destination nhưng ID khác; notification tap hai lần; onNewIntent đến trong lúc logout; account B mở pending link của account A; resource private; app update đổi route; multi-window có hai Activity đều nhận intent.',
'Deferred link có thể đến sau initial navigation hoặc attribution callback bị gọi lại. Command phải idempotent, có source/timestamp và không được ghi nhận conversion hai lần.',
 codes=[('Nhận Intent mới','''override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    deepLinkCoordinator.submit(intent.data, source = "intent")
}''')])
sec(16,'mistakes','Sai lầm thường gặp',
'Sai lầm phổ biến: cho rằng autoVerify bảo đảm luôn verified; dùng fingerprint upload key; đặt assetlinks.json sau redirect; khai báo host nhưng quên subdomain; tin mọi https URL; truyền token trong query; ghép route từ raw string.',
'Xử lý cùng link ở Activity, Adjust callback và NavController.handleDeepLink khiến navigate trùng. launchSingleTop không tự giải quyết cùng route khác argument hoặc duplicate analytics.',
'Cho rằng verified link đồng nghĩa authorization. App vẫn phải kiểm tra session, account và quyền resource ở backend/repository. Không nên dùng browser fallback để lộ dữ liệu private.')
sec(17,'interview-basic','Câu hỏi phỏng vấn cơ bản',
'Câu hỏi nền: deep link khác App Link thế nào; assetlinks.json chứa gì; android:autoVerify làm gì; vì sao cần SHA-256 certificate; cold start khác onNewIntent; intent-filter match theo thành phần nào; browser fallback hoạt động ra sao.',
'Mẫu trả lời tốt mô tả pipeline resolver -> verification -> Activity Intent -> validation -> auth/bootstrap gate -> typed navigation -> repository authorization, đồng thời nêu verified domain không thay quyền truy cập.')
sec(18,'interview-deep','Câu hỏi xoáy sâu và câu hỏi bẫy',
'Tại sao assetlinks đúng nhưng link vẫn mở browser; Play App Signing ảnh hưởng fingerprint ra sao; nhiều statement/certificate rotation thế nào; user override verified link ở đâu; deferred link khác normal App Link; duplicate onNewIntent xử lý ra sao.',
'Câu bẫy: autoVerify có chạy mỗi lần click không; pathPrefix có phải regex không; extras có tham gia Intent filter matching không; custom scheme có an toàn hơn https không; App Link có đảm bảo resource thuộc user không; launchSingleTop có chống mọi duplicate không.')
sec(19,'experience-answer','Mẫu trả lời gắn với kinh nghiệm',
'Tôi thiết kế deep link như public contract chứ không navigate trực tiếp từ raw URL. Tôi validate scheme/host/path, map sang sealed command, chờ session và NavHost sẵn sàng, deduplicate rồi destination tải dữ liệu theo ID và kiểm tra quyền.',
'Với Upzi, phần confirmed là các route /opportunity/{id}, /chat/{id}, MainActivity processDeepLink/onNewIntent và dev/Adjust links. Asset Links, fingerprint matrix và deferred behavior phải nói là inferred hoặc needs-confirmation nếu chưa kiểm tra repository và domain thực tế.')
sec(20,'practice','Bài tập thực hành',
'Tạo hai App Link /opportunity/{id} và /chat/{id}; viết parser typed, giới hạn ID, reject host/path sai; xử lý cold start và onNewIntent; dùng adb am start để test valid, invalid và encoded URI.',
'Tạo assetlinks.json cho debug và release package giả lập; viết checklist xác minh MIME, redirect, certificate; dùng pm get-app-links và pm verify-app-links để quan sát state trên thiết bị.',
'Viết instrumentation test cho login gate, duplicate tap, same route same/different ID, process recreation và account switch. Ghi rõ expected back stack cho từng source.')
sec(21,'scenario','Bài tập tình huống',
'Marketing phát hành hàng triệu URL cũ /jobs/{id}, trong app route đã đổi thành opportunity/{id}. Hãy thiết kế versioning/migration mà không phá URL cũ, đồng thời giữ web fallback và analytics campaign.',
'Sau khi bật Play App Signing, production App Link mở browser còn debug hoạt động. Hãy lập quy trình điều tra từ fingerprint, assetlinks, redirect, CDN cache, package state đến user override.',
'Adjust callback và Activity Intent cùng trả một destination khiến chat mở hai lần. Hãy thiết kế stable command key, source priority, TTL và single-consumer coordinator.')
sec(22,'checklist','Checklist tự đánh giá',
'Tôi phân biệt được custom scheme, web deep link, verified App Link và deferred link; giải thích được assetlinks.json, package name, signing fingerprint và autoVerify.',
'Tôi thiết kế được URL contract, parser allowlist, auth gate, dedup, pending TTL/account binding, back-stack policy, browser fallback và route migration.',
'Tôi biết kiểm tra verified state, test cold/warm/foreground, process death, user override, certificate rotation, multiple flavors và analytics privacy.')
sec(23,'summary','Tóm tắt cần nhớ',
'App Link là sự phối hợp giữa domain, certificate, manifest, package manager, user settings và app navigation. Chỉ thêm intent-filter không đủ để tạo pipeline đáng tin cậy.',
'Mọi URI bên ngoài đều không tin cậy. Hãy validate tại boundary, chỉ truyền ID nhỏ, kiểm tra authorization ở data layer, consume command đúng một lần và thiết kế back stack theo product intent.',
'Asset Links và certificate là concern vận hành. Cần automation, matrix theo flavor, fallback web, telemetry sanitize và test trên thiết bị thật.')

quiz = [
('Điểm khác biệt cốt lõi của Android App Link là gì?',['Dùng HTTPS và được xác minh quan hệ domain-app','Luôn dùng custom scheme','Không cần manifest','Tự cấp quyền resource'],0,'App Link là web URL HTTPS có Digital Asset Links verification.'),
('assetlinks.json thường nằm ở đâu?',['/robots.txt','/.well-known/assetlinks.json','/android/manifest.json','/api/app-links'],1,'Digital Asset Links dùng đường dẫn chuẩn dưới .well-known.'),
('Fingerprint nào quan trọng khi dùng Play App Signing?',['Upload key duy nhất','App signing certificate','Debug keystore bất kỳ','API key'],1,'APK người dùng nhận được ký bằng app signing certificate.'),
('autoVerify có đảm bảo link luôn mở app không?',['Có','Không, verification hoặc user override có thể thay đổi','Chỉ trên debug','Chỉ khi offline'],1,'Verification có thể fail và user có thể override association.'),
('Verified App Link có đảm bảo user được xem resource không?',['Có','Không, vẫn cần authorization','Chỉ với chat','Chỉ với HTTPS'],1,'Domain verification không thay thế kiểm tra quyền nghiệp vụ.'),
('Nên truyền gì trong public deep link?',['Access token','Toàn bộ object JSON','Identifier tối thiểu','Password tạm'],2,'URL chỉ nên mang dữ liệu tối thiểu, không nhạy cảm.'),
('onNewIntent nên làm gì với Intent mới?',['Bỏ qua','setIntent hoặc submit trực tiếp vào coordinator','Restart process','Gọi System.gc'],1,'Activity reuse cần cập nhật hoặc chuyển Intent mới vào pipeline.'),
('Vì sao extras không nên dùng để phân biệt App Link intent-filter?',['Extras không tham gia URI filter matching','Extras luôn encrypted','Extras quá nhanh','Extras chỉ dành cho Service'],0,'Resolver match action/category/data, không dựa vào extras.'),
('Deferred deep link xảy ra khi nào?',['App đã foreground','Link được mở trước khi app được cài và mục tiêu được khôi phục sau cài','Chỉ khi rotate','Chỉ với notification'],1,'Deferred linking phục hồi ý định sau install.'),
('Cách chống navigate trùng tốt nhất là gì?',['delay 1 giây','Stable command key và single-consumer coordinator','launchSingleTop cho mọi route','Xóa back stack'],1,'Dedup phải dựa trên identity và ownership rõ.'),
('Kiểm tra host nào an toàn hơn?',['contains("upzi.vn")','host == allowlistedHost','endsWith("upzi.vn") không biên','Regex .*upzi.*'],1,'So sánh host chính xác với allowlist tránh lookalike domain.'),
('Pending link qua login cần thêm policy gì?',['Không cần','TTL, single consumption và account binding','Chỉ lưu raw URL mãi mãi','Luôn bỏ auth'],1,'Pending command có thể stale hoặc thuộc account khác.')
]
sections.append({'id':'quiz-guide','title':'24. Quiz có giải thích đáp án','blocks':[{'type':'quiz','questions':[{'question':q,'options':o,'answer':a,'explanation':e} for q,o,a,e in quiz]}]})
lesson = {'id':'e09','code':'E09','title':'App Link và Deep Link','summary':'Thiết kế App Link và deep-link pipeline an toàn từ domain verification đến typed navigation, auth, dedup, back stack, deferred linking và kiểm thử nhiều môi trường.','estimatedMinutes':360,'sections':sections}
lesson_path = DATA/'lessons'/'e'/'e09.json'; lesson_path.parent.mkdir(parents=True,exist_ok=True)
lesson_path.write_text(json.dumps(lesson,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

catalog=json.loads((DATA/'catalog.json').read_text())
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='e09': item.update(status='published',estimatedMinutes=360)
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan=json.loads((DATA/'book-plan.json').read_text())
if 'e09' not in plan['completed']: plan['completed'].append('e09')
plan['current']='e10'
(DATA/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index=json.loads((DATA/'search-index.json').read_text())
index=[x for x in index if x.get('id')!='e09']
index.append({'id':'e09','code':'E09','title':'App Link và Deep Link','summary':lesson['summary'],'path':'data/lessons/e/e09.json','keywords':['app link','deep link','assetlinks.json','digital asset links','autoVerify','intent-filter','domain verification','deferred deep link','Adjust','Compose Navigation']})
(DATA/'search-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
ids=[s['id'] for s in sections]
expected=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
paras=[b['content'] for s in sections for b in s['blocks'] if b['type']=='paragraph']
report={'id':'e09','sections':len(sections),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==expected,'paragraphs':len(paras),'paragraphCharacters':sum(map(len,paras)),'codeBlocks':sum(1 for s in sections for b in s['blocks'] if b['type']=='code'),'quizQuestions':len(quiz),'quizAnswersValid':all(0<=a<len(o) and bool(e) for _,o,a,e in quiz),'truthfulnessLabelsPresent':all(label in ' '.join(paras) for label in ['confirmed','inferred','proposed','needs-confirmation']),'nextLesson':'e10'}
(DATA/'validation-e09.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
assert report['exactSectionOrder'] and report['quizQuestions']>=10 and report['quizAnswersValid'] and report['truthfulnessLabelsPresent']
