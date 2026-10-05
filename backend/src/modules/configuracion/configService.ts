import mongoose,{Schema,type Model} from 'mongoose';
import {AppError} from '../../errors/AppError.js';
export type ModuleConfig={companyId:string;module:string;enabled:boolean;config:Record<string,unknown>;updatedAt:string};
type ConfigDocument=Omit<ModuleConfig,'updatedAt'>&{updatedAt:Date};
const schema=new Schema<ConfigDocument>({companyId:{type:String,required:true},module:{type:String,required:true,trim:true,maxlength:80},enabled:{type:Boolean,required:true,default:true},config:{type:Schema.Types.Mixed,required:true,default:{}}},{timestamps:true});
schema.index({companyId:1,module:1},{unique:true});
export function getModuleConfigModel():Model<ConfigDocument>{return mongoose.models.ModuleConfig??mongoose.model<ConfigDocument>('ModuleConfig',schema);}
function serialize(row:ConfigDocument):ModuleConfig{return {companyId:row.companyId,module:row.module,enabled:row.enabled,config:row.config,updatedAt:new Date(row.updatedAt).toISOString()};}
export async function listModuleConfigs(companyId:string):Promise<ModuleConfig[]>{const rows=await getModuleConfigModel().find({companyId}).sort({module:1}).lean().exec();return rows.map(serialize);}
export async function getModuleConfig(companyId:string,module:string):Promise<ModuleConfig>{
 if(!/^[a-z][a-z0-9-]{0,79}$/.test(module))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid module',friendlyMessage:'Revisa el identificador del módulo.',statusCode:400});
 const row=await getModuleConfigModel().findOne({companyId,module}).lean().exec();
 if(!row)throw new AppError({code:'NOT_FOUND',message:'Module config unavailable',friendlyMessage:'No hay configuración registrada para este módulo en tu empresa.',statusCode:404});
 return serialize(row);
}
