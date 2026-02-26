import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  AlertCircle,
  BarChart3,
  Clock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Inventory() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || 1);

  // Inventory queries
  const { data: inventoryItems, isLoading: inventoryLoading } = trpc.warehouse.getInventoryByBranch.useQuery({
    branchId: selectedBranch,
  });

  const { data: lowStockItems } = trpc.warehouse.getLowStockItems.useQuery({
    branchId: selectedBranch,
  });

  const { data: outOfStockItems } = trpc.warehouse.getOutOfStockItems.useQuery({
    branchId: selectedBranch,
  });

  const { data: overstockedItems } = trpc.warehouse.getOverstockedItems.useQuery({
    branchId: selectedBranch,
  });

  const { data: inventorySummary } = trpc.warehouse.getInventorySummary.useQuery({
    branchId: selectedBranch,
  });

  const { data: totalValue } = trpc.warehouse.getTotalInventoryValue.useQuery({
    branchId: selectedBranch,
  });

  const { data: averageLevel } = trpc.warehouse.getAverageInventoryLevel.useQuery({
    branchId: selectedBranch,
  });

  const { data: movements } = trpc.warehouse.getStockMovementsByBranch.useQuery({
    branchId: selectedBranch,
    limit: 20,
  });

  const { data: movementSummary } = trpc.warehouse.getStockMovementSummary.useQuery({
    branchId: selectedBranch,
    days: 30,
  });

  const { data: turnoverRate } = trpc.warehouse.getInventoryTurnoverRate.useQuery({
    branchId: selectedBranch,
  });

  if (inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time stock levels and movement tracking</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Products in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{inventorySummary?.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventorySummary?.outOfStock || 0}</div>
            <p className="text-xs text-muted-foreground">Zero quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalValue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total value</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems?.length || 0) > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {lowStockItems?.length} product(s) are running low on stock and may need reordering soon.
          </AlertDescription>
        </Alert>
      )}

      {(outOfStockItems?.length || 0) > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {outOfStockItems?.length} product(s) are out of stock. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Movement Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">30-Day Movement Summary</CardTitle>
                <CardDescription>Stock in/out activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Stock In</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{movementSummary?.in || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Stock Out</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{movementSummary?.out || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Transfers</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{movementSummary?.transfers || 0}</span>
                </div>
                {movementSummary && 'damage' in movementSummary && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Damage</span>
                    </div>
                    <span className="text-lg font-bold text-amber-600">{movementSummary.damage || 0}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Analytics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Stock Level</span>
                    <span className="text-sm font-bold">{Math.round(averageLevel || 0)} units</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min((averageLevel || 0) / 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Turnover Rate (30 days)</span>
                    <span className="text-sm font-bold">{turnoverRate || 0} units</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((turnoverRate || 0) / 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>All products and their stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-2 font-semibold">Product</th>
                      <th className="text-left py-2 px-2 font-semibold">SKU</th>
                      <th className="text-right py-2 px-2 font-semibold">Quantity</th>
                      <th className="text-right py-2 px-2 font-semibold">Reserved</th>
                      <th className="text-right py-2 px-2 font-semibold">Available</th>
                      <th className="text-left py-2 px-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems?.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{item.productName}</td>
                        <td className="py-2 px-2 text-muted-foreground">{item.productSku}</td>
                        <td className="text-right py-2 px-2 font-medium">{item.quantity}</td>
                        <td className="text-right py-2 px-2 text-muted-foreground">{item.reservedQuantity}</td>
                        <td className="text-right py-2 px-2 font-medium">
                          {item.quantity - item.reservedQuantity}
                        </td>
                        <td className="py-2 px-2">
                          {item.quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : item.quantity < 10 ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              In Stock
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Last 20 stock transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements?.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      {movement.type === "in" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : movement.type === "out" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : movement.type === "transfer" ? (
                        <Package className="h-4 w-4 text-blue-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString()} at{" "}
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {movement.type === "out" || movement.type === "transfer" ? "-" : "+"}
                        {movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{movement.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {/* Low Stock Alert */}
            {(lowStockItems?.length || 0) > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Items
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    {lowStockItems?.length} product(s) below minimum threshold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productSku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">{item.quantity} units</p>
                          <p className="text-xs text-muted-foreground">Price: ${item.productPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Out of Stock Alert */}
            {(outOfStockItems?.length || 0) > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Out of Stock Items
                  </CardTitle>
                  <CardDescription className="text-red-800">
                    {outOfStockItems?.length} product(s) with zero quantity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productSku}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overstock Alert */}
            {(overstockedItems?.length || 0) > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overstocked Items
                  </CardTitle>
                  <CardDescription className="text-blue-800">
                    {overstockedItems?.length} product(s) above optimal level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overstockedItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productSku}</p>
                        </div>
                        <p className="font-bold text-blue-600">{item.quantity} units</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!lowStockItems?.length && !outOfStockItems?.length && !overstockedItems?.length && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No inventory alerts at this time. All stock levels are optimal.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
