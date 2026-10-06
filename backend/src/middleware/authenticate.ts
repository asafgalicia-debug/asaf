import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { verifyToken } from '../security/jwt.js';
import {getUserModel} from '../modules/usuarios/models/User.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
 const unauthorized=()=>new AppError({code:'UNAUTHORIZED',message:'Invalid, revoked or inactive session',friendlyMessage:'Tu sesión ha expirado. Inicia sesión de nuevo.',statusCode:401});
 const header=req.headers.authorization;
 if(!header?.startsWith('Bearer ')){next(unauthorized());return;}
 let payload;
 try{payload=verifyToken(header.slice(7));if(!/^[a-f0-9]{24}$/i.test(payload.sub)||!payload.companyId||!payload.branchId||!Number.isSafeInteger(payload.sessionVersion??0)||(payload.sessionVersion??0)<0)throw unauthorized();}
 catch{next(unauthorized());return;}
 try{
  const user=await getUserModel().findOne({_id:payload.sub,companyId:payload.companyId,branchId:payload.branchId,isActive:true}).select('email companyId branchId roleId permissions +sessionVersion').lean().exec();
  if(!user||(user.sessionVersion??0)!==(payload.sessionVersion??0)){next(unauthorized());return;}
  req.user={id:String(user._id),email:user.email,companyId:user.companyId,branchId:user.branchId,roleId:user.roleId,permissions:user.permissions??[]};
  next();
 }catch{next(new AppError({code:'INTERNAL',message:'Session validation unavailable',friendlyMessage:'No se pudo validar tu sesión temporalmente. Inténtalo de nuevo.',statusCode:503}));}
}
