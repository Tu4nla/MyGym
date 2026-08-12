import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const system=`Bạn là AI Coach của MyGym Personal PT. Trả lời bằng tiếng Việt, ưu tiên hành động cụ thể. Chỉ sử dụng context được cung cấp; nếu thiếu dữ liệu phải nói rõ. Không chẩn đoán bệnh/chấn thương. Đau bất thường, chóng mặt, khó thở hoặc triệu chứng đáng lo phải ưu tiên dừng bài và đánh giá y tế phù hợp. Không đề xuất nhịn ăn cực đoan, cardio trừng phạt, ghép hai buổi tập để trả nợ, hoặc ép tập xuyên đau. Deterministic safety rules trong context luôn có ưu tiên cao hơn gợi ý của AI. Mục tiêu là body recomposition bền vững, adherence, progressive overload hợp lý, đủ protein và phục hồi.`;
const out=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return out({error:"method_not_allowed"},405);
  const apiKey=Deno.env.get("OPENAI_API_KEY");
  if(!apiKey)return out({configured:false,error:"ai_not_configured",message:"OPENAI_API_KEY is missing"},503);
  const body=await req.json().catch(()=>({}));
  const mode=String(body.mode||"daily");
  const message=String(body.message||"").slice(0,4000);
  const context=body.context||{};
  const task=mode==="chat"?"Trả lời câu hỏi của người dùng như PT cá nhân có toàn bộ context fitness.":mode==="weekly"?"Tạo weekly review: xu hướng, adherence, recovery, training progression và 3 ưu tiên tuần tới.":mode==="workout_review"?"Đánh giá buổi tập mới nhất và gợi ý progression an toàn cho lần sau.":mode==="meal_estimate"?"Ước tính bữa ăn từ mô tả; nêu khoảng calories/protein hợp lý và mức độ bất định thay vì giả vờ chính xác.":"Tạo daily briefing: readiness, next best action, workout, nutrition và recovery.";
  const client=new OpenAI({apiKey});
  try{
    const response=await client.responses.create({model:Deno.env.get("OPENAI_MODEL")||"gpt-5-mini",instructions:system,input:JSON.stringify({task,userInput:message||null,context}),store:false,max_output_tokens:mode==="chat"?900:1200});
    return out({configured:true,mode,text:response.output_text,model:response.model});
  }catch(error){
    console.error("pt-ai-coach",error);
    return out({configured:true,error:"openai_request_failed",message:error instanceof Error?error.message:"OpenAI request failed"},502);
  }
});