export async function askGemini({apiKey,model,systemPrompt,analysis,question}:{apiKey:string;model:string;systemPrompt:string;analysis:unknown;question:string}){
 const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
 const body={contents:[{role:'user',parts:[{text:`${systemPrompt}\n\nANÁLISIS DEL SISTEMA:\n${JSON.stringify(analysis,null,2)}\n\nPREGUNTA:\n${question}\n\nResponde completa, máximo 900 palabras.`}]}],generationConfig:{temperature:0.2,topP:0.85,topK:40,maxOutputTokens:4096,responseMimeType:'text/plain'}};
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),45000);
 try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});if(!r.ok)throw new Error(await r.text());const d=await r.json();const t=(d?.candidates?.[0]?.content?.parts||[]).map((p:any)=>p?.text||'').join('\n').trim();if(!t)throw new Error('Sin contenido');return t;}finally{clearTimeout(timer)}
}
