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
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Brands() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: brands, isLoading } = trpc.brands.list.useQuery();

  const createMutation = trpc.brands.create.useMutation({
    onSuccess: () => {
      toast.success("Brand created successfully");
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create brand");
    },
  });

  const updateMutation = trpc.brands.update.useMutation({
    onSuccess: () => {
      toast.success("Brand updated successfully");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update brand");
    },
  });

  const deleteMutation = trpc.brands.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete brand");
    },
  });

  const handleCreate = (formData: any) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (formData: any) => {
    if (selectedBrand) {
      updateMutation.mutate({
        id: selectedBrand.id,
        ...formData,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Brand</DialogTitle>
            </DialogHeader>
            <BrandForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Loading brands...
          </div>
        ) : brands && brands.length > 0 ? (
          brands.map((brand) => (
            <Card key={brand.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {brand.logoUrl && (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-full h-24 object-cover rounded"
                  />
                )}
                <h3 className="font-semibold text-lg">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBrand(brand);
                      setIsEditOpen(true);
                    }}
                    className="gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(brand.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No brands found. Create your first brand.
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>
          {selectedBrand && (
            <BrandForm
              initialData={selectedBrand}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BrandFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function BrandForm({ initialData, onSubmit, isLoading, isEdit }: BrandFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      description: "",
      logoUrl: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Brand Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Apple"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brand description"
          className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Logo URL</label>
        <Input
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Update Brand" : "Create Brand"}
        </Button>
      </div>
    </form>
  );
}
