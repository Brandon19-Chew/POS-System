import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Tag, TrendingUp, Clock, Users, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Promotions() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("active");
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: "percentage" | "fixed" | "buy_x_get_y" | "member_only" | "happy_hour";
    discountValue: number;
    buyQuantity: number;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    memberOnly: boolean;
    isActive: boolean;
    priority: number;
  }>({
    name: "",
    description: "",
    type: "percentage",
    discountValue: 0,
    buyQuantity: 0,
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    memberOnly: false,
    isActive: true,
    priority: 0,
  });

  // Queries
  const { data: activePromotions } = trpc.promotions.getActive.useQuery();
  const { data: allPromotions } = trpc.promotions.getAll.useQuery();
  const { data: upcomingPromotions } = trpc.promotions.getUpcoming.useQuery({ days: 30 });
  const { data: expiredPromotions } = trpc.promotions.getExpired.useQuery();

  // Mutations
  const createPromoMutation = trpc.promotions.create.useMutation({
    onSuccess: () => {
      toast.success("Promotion created successfully");
      setIsOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "percentage",
        discountValue: 0,
        buyQuantity: 0,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        memberOnly: false,
        isActive: true,
        priority: 0,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create promotion: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPromoMutation.mutate({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      discountValue: formData.discountValue,
      buyQuantity: formData.buyQuantity || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      memberOnly: formData.memberOnly,
      isActive: formData.isActive,
      priority: formData.priority,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <TrendingUp className="h-4 w-4" />;
      case "fixed":
        return <Tag className="h-4 w-4" />;
      case "buy_x_get_y":
        return <Zap className="h-4 w-4" />;
      case "member_only":
        return <Users className="h-4 w-4" />;
      case "happy_hour":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage Discount";
      case "fixed":
        return "Fixed Discount";
      case "buy_x_get_y":
        return "Buy X Get Y";
      case "member_only":
        return "Member Only";
      case "happy_hour":
        return "Happy Hour";
      default:
        return type;
    }
  };

  const PromotionCard = ({ promo }: { promo: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {getTypeIcon(promo.type)}
              {promo.name}
            </CardTitle>
            <CardDescription>{promo.description}</CardDescription>
          </div>
          <Badge variant={promo.isActive ? "default" : "secondary"}>
            {promo.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{getTypeLabel(promo.type)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Discount</p>
            <p className="font-medium">
              {promo.type === "fixed" ? `$${promo.discountValue}` : `${promo.discountValue}%`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium text-sm">
              {new Date(promo.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium text-sm">
              {new Date(promo.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(promo.type as string) === "buy_x_get_y" && promo.buyQuantity && (
          <div className="bg-blue-50 p-2 rounded text-sm">
            <p className="text-blue-900">
              Buy {promo.buyQuantity} units, get {promo.discountValue}% off
            </p>
          </div>
        )}

        {(promo.type as string) === "happy_hour" && (promo.startTime || promo.endTime) && (
          <div className="bg-amber-50 p-2 rounded text-sm">
            <p className="text-amber-900">
              {promo.startTime} - {promo.endTime}
            </p>
          </div>
        )}

        {promo.memberOnly && (
          <div className="bg-purple-50 p-2 rounded text-sm">
            <p className="text-purple-900">Members only</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground mt-1">Manage discounts and special offers</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Create Promotion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
              <DialogDescription>
                Set up a new promotion with flexible rules and discount types
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="name">Promotion Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the promotion..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Type and Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Promotion Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="fixed">Fixed Discount</SelectItem>
                      <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                      <SelectItem value="member_only">Member Only</SelectItem>
                      <SelectItem value="happy_hour">Happy Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Value *</Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder={(formData.type as string) === "fixed" ? "Amount" : "Percentage"}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Buy X Get Y specific */}
              {(formData.type as string) === "buy_x_get_y" && (
                <div className="space-y-2">
                  <Label htmlFor="buyQty">Buy Quantity</Label>
                  <Input
                    id="buyQty"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.buyQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, buyQuantity: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Happy Hour specific */}
              {(formData.type as string) === "happy_hour" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (higher = applied first)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createPromoMutation.isPending}>
                  {createPromoMutation.isPending ? "Creating..." : "Create Promotion"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activePromotions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingPromotions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({expiredPromotions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all">All ({allPromotions?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active">
          {activePromotions && activePromotions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activePromotions.map((promo: any) => (
                <PromotionCard key={promo.id} promo={promo} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No active promotions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming">
          {upcomingPromotions && upcomingPromotions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingPromotions.map((promo: any) => (
                <PromotionCard key={promo.id} promo={promo} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No upcoming promotions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expired Tab */}
        <TabsContent value="expired">
          {expiredPromotions && expiredPromotions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiredPromotions.map((promo: any) => (
                <PromotionCard key={promo.id} promo={promo} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No expired promotions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          {allPromotions && allPromotions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPromotions.map((promo: any) => (
                <PromotionCard key={promo.id} promo={promo} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No promotions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
