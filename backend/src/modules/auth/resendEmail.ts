import {AppError} from '../../errors/AppError.js';
export async function sendResendEmail(config:{apiKey?:string;from:string},input:{to:string;subject:string;text:string},request:typeof fetch=fetch){
 const fail=()=>new AppError({code:'INTERNAL',message:'Email delivery could not be confirmed',friendlyMessage:'No se pudo confirmar el envío del correo. Inténtalo más tarde.',statusCode:503});
 if(!config.apiKey?.trim())throw fail();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await request('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'},body:JSON.stringify({from:config.from,to:[input.to],subject:input.subject,text:input.text}),signal:controller.signal});
  if(!response.ok)throw fail();const result:unknown=await response.json();if(!result||typeof result!=='object'||!('id' in result)||typeof result.id!=='string'||!result.id.trim())throw fail();return {id:result.id};
 }catch{throw fail();}finally{clearTimeout(timer);}
}
