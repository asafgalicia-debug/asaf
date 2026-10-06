import mongoose,{Schema,type Model} from 'mongoose';
export type OpportunityDocument={companyId:string;branchId:string;customerId:string;name:string;amount:number;stage:'QUALIFICATION'|'PROPOSAL'|'NEGOTIATION'|'CLOSED_WON'|'CLOSED_LOST';status:'OPEN'|'WON'|'LOST';createdAt:Date;updatedAt:Date};
const schema=new Schema<OpportunityDocument>({companyId:{type:String,required:true},branchId:{type:String,required:true},customerId:{type:String,required:true},name:{type:String,required:true,trim:true,maxlength:120},amount:{type:Number,required:true,min:0.01},stage:{type:String,required:true,enum:['QUALIFICATION','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST']},status:{type:String,required:true,enum:['OPEN','WON','LOST']}},{timestamps:true});
schema.index({companyId:1,branchId:1,_id:-1});
export function getOpportunityModel():Model<OpportunityDocument>{return mongoose.models.Opportunity??mongoose.model<OpportunityDocument>('Opportunity',schema);}
