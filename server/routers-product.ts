import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
  searchCategories,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandById,
  getAllBrands,
  searchBrands,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
  getUnitOfMeasureById,
  getAllUnitOfMeasures,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getProductsByBrand,
  getLowStockProducts,
} from "./db-product";
import {
  createProduct,
  getProductById,
  getProductBySku,
  getProductByBarcode,
  getAllProducts,
} from "./db";
import { createAuditLog } from "./db";
import { requirePermission } from "./auth";

/**
 * Category Router
 */
const categoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getAllCategories();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getCategoryById(input.id);
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await searchCategories(input.query);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "create");
      const result = await createCategory({
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
      });
      await createAuditLog({
        userId: ctx.user!.id,
        action: "CREATE_CATEGORY",
        entityType: "categories",
        changes: { created: input },
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "edit");
      const { id, ...data } = input;
      await updateCategory(id, data);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "UPDATE_CATEGORY",
        entityType: "categories",
        entityId: id,
        changes: { updated: data },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "delete");
      await deleteCategory(input.id);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "DELETE_CATEGORY",
        entityType: "categories",
        entityId: input.id,
        changes: { deleted: true },
      });
      return { success: true };
    }),
});

/**
 * Brand Router
 */
const brandRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getAllBrands();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getBrandById(input.id);
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await searchBrands(input.query);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "create");
      const result = await createBrand({
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
      });
      await createAuditLog({
        userId: ctx.user!.id,
        action: "CREATE_BRAND",
        entityType: "brands",
        changes: { created: input },
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "edit");
      const { id, ...data } = input;
      await updateBrand(id, data);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "UPDATE_BRAND",
        entityType: "brands",
        entityId: id,
        changes: { updated: data },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "delete");
      await deleteBrand(input.id);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "DELETE_BRAND",
        entityType: "brands",
        entityId: input.id,
        changes: { deleted: true },
      });
      return { success: true };
    }),
});

/**
 * Unit of Measure Router
 */
const uomRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getAllUnitOfMeasures();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getUnitOfMeasureById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "create");
      const result = await createUnitOfMeasure({
        code: input.code,
        name: input.name,
        description: input.description,
      });
      await createAuditLog({
        userId: ctx.user!.id,
        action: "CREATE_UOM",
        entityType: "unitOfMeasures",
        changes: { created: input },
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "edit");
      const { id, ...data } = input;
      await updateUnitOfMeasure(id, data);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "UPDATE_UOM",
        entityType: "unitOfMeasures",
        entityId: id,
        changes: { updated: data },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "delete");
      await deleteUnitOfMeasure(input.id);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "DELETE_UOM",
        entityType: "unitOfMeasures",
        entityId: input.id,
        changes: { deleted: true },
      });
      return { success: true };
    }),
});

/**
 * Product Router
 */
const productRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getAllProducts();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getProductById(input.id);
    }),

  getBySku: protectedProcedure
    .input(z.object({ sku: z.string() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getProductBySku(input.sku);
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getProductByBarcode(input.barcode);
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        categoryId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await searchProducts(input.query, input.categoryId);
    }),

  getByCategory: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getProductsByCategory(input.categoryId);
    }),

  getByBrand: protectedProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getProductsByBrand(input.brandId);
    }),

  getLowStock: protectedProcedure
    .input(z.object({ minimumLevel: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getLowStockProducts(input.minimumLevel);
    }),

  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().min(1),
        barcode: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number(),
        brandId: z.number().optional(),
        uomId: z.number(),
        cost: z.string(),
        price: z.string(),
        attributes: z.record(z.string(), z.any()).optional(),
        imageUrls: z.array(z.string()).optional(),
        minimumStockLevel: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "create");
      await createProduct({
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        brandId: input.brandId,
        uomId: input.uomId,
        cost: input.cost as any,
        price: input.price as any,
        attributes: input.attributes,
        imageUrls: input.imageUrls,
        minimumStockLevel: input.minimumStockLevel,
      });
      await createAuditLog({
        userId: ctx.user!.id,
        action: "CREATE_PRODUCT",
        entityType: "products",
        changes: { created: input },
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        brandId: z.number().optional(),
        uomId: z.number().optional(),
        cost: z.string().optional(),
        price: z.string().optional(),
        attributes: z.record(z.string(), z.any()).optional(),
        imageUrls: z.array(z.string()).optional(),
        minimumStockLevel: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "edit");
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.cost) updateData.cost = data.cost as any;
      if (data.price) updateData.price = data.price as any;
      await updateProduct(id, updateData);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "UPDATE_PRODUCT",
        entityType: "products",
        entityId: id,
        changes: { updated: data },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "delete");
      await deleteProduct(input.id);
      await createAuditLog({
        userId: ctx.user!.id,
        action: "DELETE_PRODUCT",
        entityType: "products",
        entityId: input.id,
        changes: { deleted: true },
      });
      return { success: true };
    }),
});

export { categoryRouter, brandRouter, uomRouter, productRouter };
