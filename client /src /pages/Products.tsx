import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Queries
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: brands } = trpc.brands.list.useQuery();
  const { data: uoms } = trpc.uom.list.useQuery();

  // Mutations
  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory = selectedCategory === "all-categories" || !selectedCategory || product.categoryId.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateProduct = (formData: any) => {
    createProductMutation.mutate(formData);
  };

  const handleUpdateProduct = (formData: any) => {
    if (selectedProduct) {
      updateProductMutation.mutate({
        id: selectedProduct.id,
        ...formData,
      });
    }
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              categories={categories || []}
              brands={brands || []}
              uoms={uoms || []}
              onSubmit={handleCreateProduct}
              isLoading={createProductMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory || "all-categories"} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground flex items-center">
            {filteredProducts?.length || 0} products
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        {productsLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading products...</div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-elegant">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Cost</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const category = categories?.find((c) => c.id === product.categoryId);
                  const brand = brands?.find((b) => b.id === product.brandId);

                  return (
                    <tr key={product.id}>
                      <td className="font-mono text-sm">{product.sku}</td>
                      <td className="font-medium">{product.name}</td>
                      <td className="text-sm text-muted-foreground">{category?.name || "-"}</td>
                      <td className="text-sm text-muted-foreground">{brand?.name || "-"}</td>
                      <td className="text-sm">${product.cost}</td>
                      <td className="text-sm font-semibold text-accent">${product.price}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditOpen(true);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No products found. Create your first product to get started.
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              initialData={selectedProduct}
              categories={categories || []}
              brands={brands || []}
              uoms={uoms || []}
              onSubmit={handleUpdateProduct}
              isLoading={updateProductMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  brands: any[];
  uoms: any[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function ProductForm({
  initialData,
  categories,
  brands,
  uoms,
  onSubmit,
  isLoading,
  isEdit,
}: ProductFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      sku: "",
      barcode: "",
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      uomId: "",
      cost: "",
      price: "",
      minimumStockLevel: 0,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      categoryId: parseInt(formData.categoryId),
      brandId: formData.brandId ? parseInt(formData.brandId) : undefined,
      uomId: parseInt(formData.uomId),
      minimumStockLevel: parseInt(formData.minimumStockLevel) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">SKU *</label>
          <Input
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="e.g., PROD-001"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Barcode</label>
          <Input
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="e.g., 1234567890"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Product Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Product name"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Product description"
          className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Category *</label>
          <Select value={formData.categoryId?.toString() || "category-placeholder"} onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="form-group">
          <label className="form-label">Brand</label>
          <Select value={formData.brandId?.toString() || "brand-none"} onValueChange={(value) => setFormData({ ...formData, brandId: value === "brand-none" ? undefined : parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brand-none">None</SelectItem>
              {brands && brands.length > 0 ? (
                brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))
              ) : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Unit of Measure *</label>
          <Select value={formData.uomId?.toString() || "uom-placeholder"} onValueChange={(value) => setFormData({ ...formData, uomId: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Select UOM" />
            </SelectTrigger>
            <SelectContent>
              {uoms && uoms.length > 0 ? (
                uoms.map((uom) => (
                  <SelectItem key={uom.id} value={uom.id.toString()}>
                    {uom.name} ({uom.code})
                  </SelectItem>
                ))
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="form-group">
          <label className="form-label">Minimum Stock Level</label>
          <Input
            type="number"
            value={formData.minimumStockLevel}
            onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Cost Price *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Selling Price *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
