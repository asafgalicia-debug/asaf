import { AppError } from '../../errors/AppError.js';
import { getCategoryModel } from './models/Category.js';
import { getProductModel } from './models/Product.js';
export type ProductRecord = { id: string; companyId: string; categoryId: string; name: string; sku: string; price: number; status: 'ACTIVE' | 'INACTIVE' };
export async function listProducts(companyId: string): Promise<ProductRecord[]> {
  const rows = await getProductModel().find({ companyId }).sort({ name: 1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createProduct(input: { companyId: string; categoryId: string; name: string; sku: string; price: number }): Promise<ProductRecord> {
  const categoryId = input.categoryId.trim();
  const category = await getCategoryModel().findOne({ _id: categoryId, companyId: input.companyId, status: 'ACTIVE' }).lean().exec();
  if (!category) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Category not found for company', friendlyMessage: 'La categoria no existe o no pertenece a esta empresa.', statusCode: 400 });
  try {
    const row = await getProductModel().create({ ...input, categoryId, name: input.name.trim(), sku: input.sku.trim().toUpperCase(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, categoryId: row.categoryId, name: row.name, sku: row.sku, price: row.price, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate product SKU', friendlyMessage: 'Ya existe un producto con ese SKU en la empresa.', statusCode: 409 });
    throw error;
  }
}