from pathlib import Path
p=Path('scripts/publish_f06.py')
s=p.read_text()
old="""{'id':'minimal-code','title':'11. Ví dụ code tối giản','blocks':p(
'Use case nên thể hiện policy có ý nghĩa. Ví dụ dưới kiểm tra nội dung, tạo identity ổn định và persist trước khi enqueue gửi.',
'Output typed giúp ViewModel cập nhật state mà không biết chi tiết local/socket.'),
code('Use case command có input/output typed', '''data class SendMessageInput(val conversationId:String,val text:String)\nsealed interface SendMessageResult { data class Accepted(val clientId:String):SendMessageResult; data class Rejected(val reason:String):SendMessageResult }\nclass SendMessageUseCase(private val repo:ChatRepository, private val ids:IdGenerator){\n suspend operator fun invoke(input:SendMessageInput):SendMessageResult {\n   val text=input.text.trim()\n   if(text.isEmpty()) return SendMessageResult.Rejected(\"empty_message\")\n   val clientId=ids.next()\n   repo.persistPending(input.conversationId,clientId,text)\n   repo.enqueueSend(clientId)\n   return SendMessageResult.Accepted(clientId)\n }\n}'''),
p('Use case query có thể trả Flow từ source of truth và giữ mapping ngoài UI.'),
code('Query use case', '''class ObserveConversationUseCase(private val repo:ChatRepository){\n operator fun invoke(id:String):Flow<List<Message>> =\n   repo.observeMessages(id).map { items -> items.sortedBy(Message::createdAt) }\n}''')},"""
new="""{'id':'minimal-code','title':'11. Ví dụ code tối giản','blocks':p(
'Use case nên thể hiện policy có ý nghĩa. Ví dụ dưới kiểm tra nội dung, tạo identity ổn định và persist trước khi enqueue gửi.',
'Output typed giúp ViewModel cập nhật state mà không biết chi tiết local/socket.') + [
code('Use case command có input/output typed', '''data class SendMessageInput(val conversationId:String,val text:String)\nsealed interface SendMessageResult { data class Accepted(val clientId:String):SendMessageResult; data class Rejected(val reason:String):SendMessageResult }\nclass SendMessageUseCase(private val repo:ChatRepository, private val ids:IdGenerator){\n suspend operator fun invoke(input:SendMessageInput):SendMessageResult {\n   val text=input.text.trim()\n   if(text.isEmpty()) return SendMessageResult.Rejected(\"empty_message\")\n   val clientId=ids.next()\n   repo.persistPending(input.conversationId,clientId,text)\n   repo.enqueueSend(clientId)\n   return SendMessageResult.Accepted(clientId)\n }\n}''')] + p(
'Use case query có thể trả Flow từ source of truth và giữ mapping ngoài UI.') + [
code('Query use case', '''class ObserveConversationUseCase(private val repo:ChatRepository){\n operator fun invoke(id:String):Flow<List<Message>> =\n   repo.observeMessages(id).map { items -> items.sortedBy(Message::createdAt) }\n}''')]},"""
if old not in s:
    raise SystemExit('target not found')
p.write_text(s.replace(old,new))
