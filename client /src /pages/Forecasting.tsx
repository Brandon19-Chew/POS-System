import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Package, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Forecasting() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("reorder");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch forecasting data
  const { data: productsNeedingReorder } = trpc.forecasting.getProductsNeedingReorder.useQuery();
  const { data: recommendations } = trpc.forecasting.getOptimizationRecommendations.useQuery();
  const { data: velocity } = trpc.forecasting.getSalesVelocity.useQuery(
    { productId: selectedProductId || 0 },
    { enabled: !!selectedProductId }
  );
  const { data: forecast } = trpc.forecasting.predictDemand.useQuery(
    { productId: selectedProductId || 0, forecastDays: 30 },
    { enabled: !!selectedProductId }
  );
  const { data: reorderPoint } = trpc.forecasting.getOptimalReorderPoint.useQuery(
    { productId: selectedProductId || 0, leadTimeDays: 7, safetyStock: 10 },
    { enabled: !!selectedProductId }
  );
  const { data: trends } = trpc.forecasting.getDemandTrends.useQuery(
    { productId: selectedProductId || 0, weeks: 12 },
    { enabled: !!selectedProductId }
  );
  const { data: seasonal } = trpc.forecasting.getSeasonalPatterns.useQuery(
    { productId: selectedProductId || 0 },
    { enabled: !!selectedProductId }
  );

  // Prepare chart data
  const forecastChartData = forecast?.forecast.slice(0, 15).map((item: any) => ({
    day: item.day,
    predicted: item.predictedQuantity,
    confidence: Math.round(item.confidence * 100),
  })) || [];

  const trendsChartData = trends?.map((item: any) => ({
    week: `W${item.week}`,
    quantity: item.weeklyQuantity,
    transactions: item.transactionCount,
  })) || [];

  const seasonalChartData = seasonal?.map((item: any) => ({
    month: item.monthName,
    quantity: item.totalQuantity,
    transactions: item.transactionCount,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Demand Forecasting</h1>
        <p className="text-muted-foreground">ML-based inventory optimization and demand prediction</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products Needing Reorder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{productsNeedingReorder?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Below minimum stock level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{velocity?.dailyAverageVelocity?.toFixed(1) || "0"}</p>
            <p className="text-xs text-muted-foreground">Average units/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forecast Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{forecast?.confidence ? Math.round(forecast.confidence * 100) : "0"}%</p>
            <p className="text-xs text-muted-foreground">30-day prediction</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reorder">Reorder Alerts</TabsTrigger>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Reorder Alerts Tab */}
        <TabsContent value="reorder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Products Needing Reorder
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsNeedingReorder && productsNeedingReorder.length > 0 ? (
                <div className="space-y-3">
                  {productsNeedingReorder.map((product: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <p className="font-medium">{product.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">SKU: {product.sku}</Badge>
                          <Badge variant="destructive">Stock: {product.currentStock}</Badge>
                          <Badge variant="secondary">Min: {product.minimumStock}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Daily Velocity: {product.dailyVelocity} units | Days of Stock: {product.daysOfStock}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setDetailOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">All products are at optimal stock levels</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand Forecast Tab */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                30-Day Demand Forecast
              </CardTitle>
              {selectedProductId && (
                <p className="text-sm text-muted-foreground mt-2">
                  Reorder Point: {reorderPoint?.reorderPoint} units | Suggested Order: {reorderPoint?.suggestedOrderQuantity} units
                </p>
              )}
            </CardHeader>
            <CardContent>
              {selectedProductId ? (
                forecastChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke="#0f766e" strokeWidth={2} name="Predicted Demand" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No forecast data available</p>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">Select a product to view forecast</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Demand Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProductId ? (
                  trendsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trendsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#0f766e" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No trend data available</p>
                  )
                ) : (
                  <p className="text-center text-muted-foreground py-8">Select a product to view trends</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProductId ? (
                  seasonalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={seasonalChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#14b8a6" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No seasonal data available</p>
                  )
                ) : (
                  <p className="text-center text-muted-foreground py-8">Select a product to view patterns</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Inventory Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations && recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{rec.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {rec.sku}</p>
                        </div>
                        <Badge
                          variant={
                            rec.status === "OVERSTOCK"
                              ? "secondary"
                              : rec.status === "UNDERSTOCK"
                                ? "destructive"
                                : rec.status === "LOW_STOCK"
                                  ? "outline"
                                  : "default"
                          }
                        >
                          {rec.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">{rec.recommendation}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Current: {rec.currentStock}</span>
                        <span>Min: {rec.minimumStock}</span>
                        <span>Max: {rec.maximumStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recommendations available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product Name</p>
                  <p className="font-semibold">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-semibold">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="font-semibold text-amber-600">{selectedProduct.currentStock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Stock</p>
                  <p className="font-semibold">{selectedProduct.minimumStock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Velocity</p>
                  <p className="font-semibold">{selectedProduct.dailyVelocity} units/day</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days of Stock</p>
                  <p className="font-semibold">{selectedProduct.daysOfStock} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="destructive">{selectedProduct.status || "CRITICAL"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recommendation</p>
                  <p className="font-semibold text-sm">{selectedProduct.recommendation}</p>
                </div>
              </div>
              {reorderPoint && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Reorder Recommendations</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Point</p>
                      <p className="font-semibold text-lg">{reorderPoint.reorderPoint} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Suggested Order Quantity</p>
                      <p className="font-semibold text-lg">{reorderPoint.suggestedOrderQuantity} units</p>
                    </div>
                  </div>
                </div>
              )}
              <Button 
                className="w-full"
                onClick={() => setDetailOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
