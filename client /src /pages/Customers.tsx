import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit2, Trash2, Gift, History } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers, isLoading } = trpc.customers.list.useQuery();
  const { data: searchResults } = trpc.customers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create customer");
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated successfully");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete customer");
    },
  });

  const handleCreate = (formData: any) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (formData: any) => {
    if (selectedCustomer) {
      updateMutation.mutate({
        id: selectedCustomer.id,
        ...formData,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate({ id });
    }
  };

  const displayCustomers = searchQuery && searchResults ? searchResults : customers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer profiles and loyalty</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            {displayCustomers?.length || 0} customers
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading customers...
          </div>
        ) : displayCustomers && displayCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Loyalty Points</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayCustomers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onEdit={() => {
                      setSelectedCustomer(customer);
                      setIsEditOpen(true);
                    }}
                    onDelete={() => handleDelete(customer.id)}
                    onViewDetails={() => {
                      setSelectedCustomer(customer);
                      setIsDetailsOpen(true);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No customers found. Create your first customer.
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              initialData={selectedCustomer}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetailsView customer={selectedCustomer} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CustomerRowProps {
  customer: any;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

function CustomerRow({ customer, onEdit, onDelete, onViewDetails }: CustomerRowProps) {
  const { data: totalPoints } = trpc.customers.getTotalPoints.useQuery({
    customerId: customer.id,
  });

  const tierColors: Record<string, string> = {
    standard: "bg-gray-100 text-gray-800",
    silver: "bg-slate-100 text-slate-800",
    gold: "bg-yellow-100 text-yellow-800",
    vip: "bg-purple-100 text-purple-800",
  };

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email || "-"}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{customer.phone || "-"}</td>
      <td className="px-6 py-4 text-sm">
        <Badge className={tierColors[customer.tier] || tierColors.standard}>
          {customer.tier}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm font-semibold">{totalPoints || 0} pts</td>
      <td className="px-6 py-4 text-right">
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onViewDetails}
            className="gap-1"
          >
            <History className="w-3 h-3" />
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface CustomerDetailsViewProps {
  customer: any;
}

function CustomerDetailsView({ customer }: CustomerDetailsViewProps) {
  const { data: purchaseHistory } = trpc.customers.getPurchaseHistory.useQuery({
    customerId: customer.id,
  });
  const { data: totalSpent } = trpc.customers.getTotalSpent.useQuery({
    customerId: customer.id,
  });
  const { data: purchaseCount } = trpc.customers.getPurchaseCount.useQuery({
    customerId: customer.id,
  });
  const { data: totalPoints } = trpc.customers.getTotalPoints.useQuery({
    customerId: customer.id,
  });

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-semibold">{customer.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-semibold">{customer.email || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Phone</p>
          <p className="font-semibold">{customer.phone || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tier</p>
          <Badge className="w-fit">{customer.tier}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold">${totalSpent?.toFixed(2) || "0.00"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Purchases</p>
          <p className="text-2xl font-bold">{purchaseCount || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Loyalty Points</p>
          <p className="text-2xl font-bold">{totalPoints || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="text-sm font-semibold">
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </Card>
      </div>

      {/* Purchase History */}
      <div>
        <h3 className="font-semibold mb-3">Recent Purchases</h3>
        {purchaseHistory && purchaseHistory.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {purchaseHistory.slice(0, 5).map((purchase: any) => (
              <div key={purchase.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                <span className="font-semibold">${parseFloat(purchase.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No purchase history</p>
        )}
      </div>
    </div>
  );
}

interface CustomerFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function CustomerForm({ initialData, onSubmit, isLoading, isEdit }: CustomerFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      email: "",
      phone: "",
      tier: "standard",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Customer Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., John Doe"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Phone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Customer Tier</label>
        <Select
          value={formData.tier || "standard"}
          onValueChange={(value) => setFormData({ ...formData, tier: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
