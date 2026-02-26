import { eq, and, like, desc } from "drizzle-orm";
import {
  categories,
  brands,
  unitOfMeasures,
  products,
  InsertCategory,
  InsertBrand,
  InsertUnitOfMeasure,
  InsertProduct,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Category Management
 */
export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).where(eq(categories.isActive, true));
}

export async function searchCategories(query: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(categories)
    .where(and(eq(categories.isActive, true), like(categories.name, `%${query}%`)))
    .limit(50);
}

/**
 * Brand Management
 */
export async function createBrand(data: InsertBrand) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(brands).values(data);
  return result;
}

export async function updateBrand(id: number, data: Partial<InsertBrand>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(brands).set(data).where(eq(brands.id, id));
}

export async function deleteBrand(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(brands).set({ isActive: false }).where(eq(brands.id, id));
}

export async function getBrandById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBrands() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(brands).where(eq(brands.isActive, true));
}

export async function searchBrands(query: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(brands)
    .where(and(eq(brands.isActive, true), like(brands.name, `%${query}%`)))
    .limit(50);
}

/**
 * Unit of Measure Management
 */
export async function createUnitOfMeasure(data: InsertUnitOfMeasure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(unitOfMeasures).values(data);
  return result;
}

export async function updateUnitOfMeasure(id: number, data: Partial<InsertUnitOfMeasure>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(unitOfMeasures).set(data).where(eq(unitOfMeasures.id, id));
}

export async function deleteUnitOfMeasure(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(unitOfMeasures).set({ isActive: false }).where(eq(unitOfMeasures.id, id));
}

export async function getUnitOfMeasureById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(unitOfMeasures)
    .where(eq(unitOfMeasures.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUnitOfMeasures() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(unitOfMeasures).where(eq(unitOfMeasures.isActive, true));
}

/**
 * Product Management
 */
export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

export async function searchProducts(query: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];

  let whereClause = and(
    eq(products.isActive, true),
    like(products.name, `%${query}%`)
  );

  if (categoryId) {
    whereClause = and(whereClause, eq(products.categoryId, categoryId));
  }

  return await db.select().from(products).where(whereClause).limit(100);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));
}

export async function getProductsByBrand(brandId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(and(eq(products.brandId, brandId), eq(products.isActive, true)));
}

export async function getLowStockProducts(minimumLevel: number = 0) {
  const db = await getDb();
  if (!db) return [];
  // This would need to join with branchStock table in production
  return await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.minimumStockLevel, minimumLevel)))
    .limit(100);
}
