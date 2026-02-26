import React, { useState, useEffect } from "react";
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
import { Plus, Minus, Trash2, ShoppingCart, DollarSign, Search } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "ewallet" | "mixed">("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { data: searchResults } = trpc.pos.searchProducts.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createTransactionMutation = trpc.pos.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction completed successfully");
      setCart([]);
      setSearchQuery("");
      setAmountPaid(0);
      setDiscountPercent(0);
      setIsCheckoutOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete transaction");
    },
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.1; // 10% tax
  const total = taxableAmount + taxAmount;
  const changeAmount = amountPaid - total;

  const handleAddToCart = (product: any) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice * (1 - item.discountPercent / 100),
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: parseFloat(product.price),
          discountPercent: 0,
          subtotal: parseFloat(product.price),
        },
      ]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice * (1 - item.discountPercent / 100),
            }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (amountPaid < total) {
      toast.error("Amount paid is less than total");
      return;
    }

    createTransactionMutation.mutate({
      branchId: 1, // Default branch
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      amountPaid: amountPaid.toFixed(2),
      changeAmount: Math.max(0, changeAmount).toFixed(2),
      paymentMethod,
      pointsEarned: Math.floor(total / 10), // 1 point per $10
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        discountAmount: (item.subtotal * (item.discountPercent / 100)).toFixed(2),
        taxAmount: (item.subtotal * 0.1).toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      })),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen overflow-hidden">
      {/* Products Section */}
      <div className="lg:col-span-2 flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold mb-4">Point of Sale</h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery && searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleAddToCart(product)}
                >
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-bold">${parseFloat(product.price).toFixed(2)}</span>
                    <Button size="sm" className="gap-1">
                      <Plus className="w-3 h-3" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center text-muted-foreground py-12">
              No products found
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Start typing to search for products
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="flex flex-col overflow-hidden border-l bg-muted/50">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart ({cart.length})
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length > 0 ? (
            cart.map((item) => (
              <Card key={item.productId} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromCart(item.productId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    className="w-12 h-8 text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-right text-sm font-semibold">
                  ${item.subtotal.toFixed(2)}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Cart is empty
            </div>
          )}
        </div>

        {/* Totals and Checkout */}
        <div className="p-4 border-t space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({discountPercent}%):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" disabled={cart.length === 0}>
                <DollarSign className="w-4 h-4" />
                Checkout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="ewallet">E-wallet</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Amount Paid</label>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-muted p-3 rounded">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Total:</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Change:</span>
                    <span className="font-bold text-green-600">${Math.max(0, changeAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={createTransactionMutation.isPending || amountPaid < total}
                    className="flex-1"
                  >
                    {createTransactionMutation.isPending ? "Processing..." : "Complete Payment"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
