import mongoose, { Schema, type Model } from 'mongoose';
export type BankAccountDoc = { companyId: string; branchId: string; name: string; bankName: string; iban: string; status: 'ACTIVE' | 'INACTIVE'; createdAt: Date; updatedAt: Date };
const accountSchema = new Schema<BankAccountDoc>({ companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, name: { type: String, required: true, trim: true, maxlength: 100 }, bankName: { type: String, required: true, trim: true, maxlength: 100 }, iban: { type: String, required: true, trim: true, uppercase: true, maxlength: 34 }, status: { type: String, enum: ['ACTIVE','INACTIVE'], default: 'ACTIVE', required: true } }, { timestamps: true });
accountSchema.index({ companyId: 1, branchId: 1, iban: 1 }, { unique: true });
export type MoneyEntryDoc = { companyId: string; branchId: string; accountId: string; concept: string; amount: number; date?: string; type?: 'INFLOW' | 'OUTFLOW'; status?: 'PENDIENTE' | 'PAGADA' | 'RECIBIDO' | 'CANCELADA'; createdAt: Date; updatedAt: Date };
const entrySchema = new Schema<MoneyEntryDoc>({ companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, accountId: { type: String, required: true, trim: true }, concept: { type: String, required: true, trim: true, maxlength: 200 }, amount: { type: Number, required: true, min: 0.000001 }, date: { type: String }, type: { type: String, enum: ['INFLOW','OUTFLOW'] }, status: { type: String, enum: ['PENDIENTE','PAGADA','RECIBIDO','CANCELADA'] } }, { timestamps: true });
entrySchema.index({ companyId: 1, branchId: 1, createdAt: -1 });
let BankAccountModel: Model<BankAccountDoc> | undefined;
let CashMovementModel: Model<MoneyEntryDoc> | undefined;
let ExpenseModel: Model<MoneyEntryDoc> | undefined;
let IncomeModel: Model<MoneyEntryDoc> | undefined;
export function getBankAccountModel(): Model<BankAccountDoc> { if (!BankAccountModel) BankAccountModel = mongoose.models.BankAccount ?? mongoose.model<BankAccountDoc>('BankAccount', accountSchema); return BankAccountModel; }
export function getCashMovementModel(): Model<MoneyEntryDoc> { if (!CashMovementModel) CashMovementModel = mongoose.models.CashMovement ?? mongoose.model<MoneyEntryDoc>('CashMovement', entrySchema); return CashMovementModel; }
export function getExpenseModel(): Model<MoneyEntryDoc> { if (!ExpenseModel) ExpenseModel = mongoose.models.Expense ?? mongoose.model<MoneyEntryDoc>('Expense', entrySchema); return ExpenseModel; }
export function getIncomeModel(): Model<MoneyEntryDoc> { if (!IncomeModel) IncomeModel = mongoose.models.Income ?? mongoose.model<MoneyEntryDoc>('Income', entrySchema); return IncomeModel; }