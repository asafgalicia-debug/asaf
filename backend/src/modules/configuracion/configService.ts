import {z} from 'zod';
import {getAuditEventModel} from '../auditoria/models/AuditEvent.js';
import mongoose,{Schema,type Model} from 'mongoose';
import {AppError} from '../../errors/AppError.js';
export type ModuleConfig={companyId:string;module:string;enabled:boolean;config:Record<string,unknown>;updatedAt:string;version:number};
type ConfigDocument=Omit<ModuleConfig,'updatedAt'>&{updatedAt:Date};
const schema=new Schema<ConfigDocument>({companyId:{type:String,required:true},module:{type:String,required:true,trim:true,maxlength:80},version:{type:Number,required:true,default:0},enabled:{type:Boolean,required:true,default:true},config:{type:Schema.Types.Mixed,required:true,default:{}}},{timestamps:true});
schema.index({companyId:1,module:1},{unique:true});
export function getModuleConfigModel():Model<ConfigDocument>{return mongoose.models.ModuleConfig??mongoose.model<ConfigDocument>('ModuleConfig',schema);}
function serialize(row:ConfigDocument):ModuleConfig{return {companyId:row.companyId,module:row.module,enabled:row.enabled,config:row.config,version:row.version??0,updatedAt:new Date(row.updatedAt).toISOString()};}
export async function listModuleConfigs(companyId:string):Promise<ModuleConfig[]>{const rows=await getModuleConfigModel().find({companyId}).sort({module:1}).lean().exec();return rows.map(serialize);}
export async function getModuleConfig(companyId:string,module:string):Promise<ModuleConfig>{
 if(!/^[a-z][a-z0-9-]{0,79}$/.test(module))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid module',friendlyMessage:'Revisa el identificador del módulo.',statusCode:400});
 const row=await getModuleConfigModel().findOne({companyId,module}).lean().exec();
 if(!row)throw new AppError({code:'NOT_FOUND',message:'Module config unavailable',friendlyMessage:'No hay configuración registrada para este módulo en tu empresa.',statusCode:404});
 return serialize(row);
}

export const inventoryConfigInput=z.object({expectedVersion:z.number().int().nonnegative().nullable(),stockAlertThreshold:z.number().finite().int().min(0).max(1000000)}).strict();
export async function updateInventoryConfig(scope:{companyId:string;branchId:string;userId:string},raw:unknown){
 const parsed=inventoryConfigInput.safeParse(raw);if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid inventory preferences',friendlyMessage:'Revisa el umbral entero entre 0 y 1000000 y la versión.',statusCode:400});
 const input=parsed.data,model=getModuleConfigModel();await Promise.all([model.init(),getAuditEventModel().init()]);const session=await mongoose.startSession();
 const conflict=()=>new AppError({code:'CONFLICT',message:'Configuration changed',friendlyMessage:'La configuración cambió. Actualiza antes de guardar.',statusCode:409});
 try{return await session.withTransaction(async()=>{
  const key={companyId:scope.companyId,module:'inventario'};const previous=await model.findOne(key).session(session).lean().exec();
  if((previous?(previous.version??0):null)!==input.expectedVersion)throw conflict();
  const config={...previous?.config,stockAlertThreshold:input.stockAlertThreshold};let row;
  if(previous){row=await model.findOneAndUpdate({...key,_id:previous._id,...(input.expectedVersion===0?{$or:[{version:0},{version:{$exists:false}}]}:{version:input.expectedVersion})},{$set:{config},$inc:{version:1}},{new:true,session}).lean().exec();if(!row)throw conflict();}
  else{const [created]=await model.create([{...key,enabled:true,config,version:1}],{session});row=created.toObject();}
  await getAuditEventModel().create([{...scope,action:previous?'UPDATE':'CREATE',module:'configuracion',entityId:String(row._id),previousState:previous?{config:previous.config,version:previous.version??0}:null,newState:{config,version:row.version}}],{session});return serialize(row);
 });}catch(e){if(typeof e==='object'&&e!==null&&'code'in e&&e.code===11000)throw conflict();throw e;}finally{await session.endSession();}
}
