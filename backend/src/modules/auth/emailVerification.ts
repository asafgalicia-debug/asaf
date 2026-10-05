import {createHash,randomBytes} from 'node:crypto';
import {AppError} from '../../errors/AppError.js';
import {getUserModel} from '../usuarios/models/User.js';
import {sendResendEmail} from './resendEmail.js';
export const verificationDigest=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function requestEmailVerification(scope:{id:string;companyId:string;branchId:string},config:{apiKey?:string;from:string;baseUrl:string},send:typeof sendResendEmail=sendResendEmail){
 if(!config.apiKey?.trim())throw new AppError({code:'INTERNAL',message:'Email not configured',friendlyMessage:'El envío de correo aún no está configurado.',statusCode:503});
 const base=new URL(config.baseUrl);if(base.protocol!=='https:')throw new Error('Verification requires HTTPS');
 const now=new Date(),token=randomBytes(32).toString('hex'),digest=verificationDigest(token);const model=getUserModel();
 const filter={_id:scope.id,companyId:scope.companyId,branchId:scope.branchId,isActive:true};const current=await model.findOne(filter).lean().exec();
 if(!current)throw new AppError({code:'UNAUTHORIZED',message:'User unavailable',friendlyMessage:'Inicia sesión con una cuenta activa.',statusCode:401});
 if(current.emailVerifiedAt)return {status:'verified' as const};
 const row=await model.findOneAndUpdate({...filter,emailVerifiedAt:null,$or:[{emailVerificationSentAt:{$exists:false}},{emailVerificationSentAt:{$lte:new Date(now.getTime()-60000)}}]},{$set:{emailVerificationHash:digest,emailVerificationEmail:current.email,emailVerificationExpiresAt:new Date(now.getTime()+15*60000),emailVerificationSentAt:now}},{new:true}).lean().exec();
 if(!row)throw new AppError({code:'RATE_LIMITED',message:'Verification cooldown',friendlyMessage:'Espera un minuto antes de pedir otro correo.',statusCode:429});
 const link=config.baseUrl.replace(/\/+$/,'')+'/auth/email-verification/confirm?token='+token;
 try{await send(config,{to:current.email,subject:'Verifica tu correo de Núcleo ERP',text:'Confirma tu correo abriendo este enlace y pulsando Confirmar correo. Caduca en 15 minutos y solo se puede usar una vez.\n\n'+link+'\n\nSi no solicitaste este correo, puedes ignorarlo.'});}
 catch(error){await model.updateOne({...filter,emailVerificationHash:digest},{$unset:{emailVerificationHash:1,emailVerificationEmail:1,emailVerificationExpiresAt:1}});throw error;}
 return {status:'sent' as const};
}
export async function confirmEmailVerification(token:unknown){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid verification token',friendlyMessage:'El enlace no es válido. Solicita uno nuevo.',statusCode:400});
 const row=await getUserModel().findOneAndUpdate({emailVerificationHash:verificationDigest(token),emailVerificationExpiresAt:{$gt:new Date()},emailVerifiedAt:null,isActive:true,$expr:{$eq:['$email','$emailVerificationEmail']}},{$set:{emailVerifiedAt:new Date()},$unset:{emailVerificationHash:1,emailVerificationEmail:1,emailVerificationExpiresAt:1}},{new:true}).lean().exec();
 if(!row)throw new AppError({code:'VALIDATION_ERROR',message:'Expired or used verification token',friendlyMessage:'El enlace caducó o ya fue usado. Solicita uno nuevo si tu correo sigue pendiente.',statusCode:400});
 return {status:'verified' as const};
}
