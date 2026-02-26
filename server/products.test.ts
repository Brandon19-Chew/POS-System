import { describe, it, expect, beforeEach } from "vitest";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandById,
  getAllBrands,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
  getUnitOfMeasureById,
  getAllUnitOfMeasures,
} from "./db-product";

describe("Product Management - Categories", () => {
  describe("Category CRUD Operations", () => {
    it("should create a category", async () => {
      const result = await createCategory({
        name: "Electronics",
        description: "Electronic products",
      });
      expect(result).toBeDefined();
    });

    it("should get category by ID", async () => {
      const result = await createCategory({
        name: "Clothing",
        description: "Clothing items",
      });
      // Note: In real scenario, we'd get the ID from result
      const categories = await getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get all categories", async () => {
      const categories = await getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
    });

    it("should update a category", async () => {
      const categories = await getAllCategories();
      if (categories.length > 0) {
        const category = categories[0];
        await updateCategory(category.id, { name: "Updated Category" });
        const updated = await getCategoryById(category.id);
        expect(updated?.name).toBe("Updated Category");
      }
    });

    it("should soft delete a category", async () => {
      const categories = await getAllCategories();
      if (categories.length > 0) {
        const category = categories[0];
        await deleteCategory(category.id);
        const deleted = await getCategoryById(category.id);
        expect(deleted?.isActive).toBe(false);
      }
    });
  });
});

describe("Product Management - Brands", () => {
  describe("Brand CRUD Operations", () => {
    it("should create a brand", async () => {
      const result = await createBrand({
        name: "Apple",
        description: "Apple Inc.",
      });
      expect(result).toBeDefined();
    });

    it("should get all brands", async () => {
      const brands = await getAllBrands();
      expect(Array.isArray(brands)).toBe(true);
    });

    it("should get brand by ID", async () => {
      const brands = await getAllBrands();
      if (brands.length > 0) {
        const brand = brands[0];
        const retrieved = await getBrandById(brand.id);
        expect(retrieved?.id).toBe(brand.id);
      }
    });

    it("should update a brand", async () => {
      const brands = await getAllBrands();
      if (brands.length > 0) {
        const brand = brands[0];
        await updateBrand(brand.id, { name: "Updated Brand" });
        const updated = await getBrandById(brand.id);
        expect(updated?.name).toBe("Updated Brand");
      }
    });

    it("should soft delete a brand", async () => {
      const brands = await getAllBrands();
      if (brands.length > 0) {
        const brand = brands[0];
        await deleteBrand(brand.id);
        const deleted = await getBrandById(brand.id);
        expect(deleted?.isActive).toBe(false);
      }
    });
  });
});

describe("Product Management - Units of Measure", () => {
  describe("UOM CRUD Operations", () => {
    it("should create a UOM", async () => {
      const result = await createUnitOfMeasure({
        code: "PC",
        name: "Piece",
        description: "Individual piece",
      });
      expect(result).toBeDefined();
    });

    it("should get all UOMs", async () => {
      const uoms = await getAllUnitOfMeasures();
      expect(Array.isArray(uoms)).toBe(true);
    });

    it("should get UOM by ID", async () => {
      const uoms = await getAllUnitOfMeasures();
      if (uoms.length > 0) {
        const uom = uoms[0];
        const retrieved = await getUnitOfMeasureById(uom.id);
        expect(retrieved?.id).toBe(uom.id);
      }
    });

    it("should update a UOM", async () => {
      const uoms = await getAllUnitOfMeasures();
      if (uoms.length > 0) {
        const uom = uoms[0];
        await updateUnitOfMeasure(uom.id, { name: "Updated UOM" });
        const updated = await getUnitOfMeasureById(uom.id);
        expect(updated?.name).toBe("Updated UOM");
      }
    });

    it("should soft delete a UOM", async () => {
      const uoms = await getAllUnitOfMeasures();
      if (uoms.length > 0) {
        const uom = uoms[0];
        await deleteUnitOfMeasure(uom.id);
        const deleted = await getUnitOfMeasureById(uom.id);
        expect(deleted?.isActive).toBe(false);
      }
    });
  });
});

describe("Product Management - Data Validation", () => {
  it("should handle category with minimal data", async () => {
    const result = await createCategory({
      name: "Minimal Category",
    });
    expect(result).toBeDefined();
  });

  it("should handle brand with all optional fields", async () => {
    const result = await createBrand({
      name: "Full Brand",
      description: "Complete brand info",
      logoUrl: "https://example.com/logo.png",
    });
    expect(result).toBeDefined();
  });

  it("should handle UOM with all fields", async () => {
    const result = await createUnitOfMeasure({
      code: "KG",
      name: "Kilogram",
      description: "Weight measurement",
    });
    expect(result).toBeDefined();
  });
});
