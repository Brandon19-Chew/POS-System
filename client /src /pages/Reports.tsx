import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // Queries
  const { data: monthlySalesReport } = trpc.reports.getMonthlySalesReport.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const { data: bestSellingProducts } = trpc.reports.getBestSellingProducts.useQuery({
    limit: 10,
    days: 30,
  });

  const { data: lowStockProducts } = trpc.reports.getLowStockProducts.useQuery({
    limit: 20,
  });

  const { data: cashierPerformance } = trpc.reports.getCashierPerformance.useQuery({
    startDate,
    endDate,
  });

  const { data: profitMarginAnalysis } = trpc.reports.getProfitMarginAnalysis.useQuery({
    startDate,
    endDate,
  });

  const { data: paymentMethods } = trpc.reports.getPaymentMethodAnalysis.useQuery({
    startDate,
    endDate,
  });

  // Mutations
  const exportSalesReportMutation = trpc.reports.exportSalesReportToExcel.useMutation({
    onSuccess: () => {
      toast.success("Sales report exported successfully");
    },
    onError: (error) => {
      toast.error(`Failed to export: ${error.message}`);
    },
  });

  const exportBestSellingMutation = trpc.reports.exportBestSellingProductsToExcel.useMutation({
    onSuccess: () => {
      toast.success("Best selling products exported successfully");
    },
    onError: (error) => {
      toast.error(`Failed to export: ${error.message}`);
    },
  });

  const exportLowStockMutation = trpc.reports.exportLowStockProductsToExcel.useMutation({
    onSuccess: () => {
      toast.success("Low stock report exported successfully");
    },
    onError: (error) => {
      toast.error(`Failed to export: ${error.message}`);
    },
  });

  const exportCashierMutation = trpc.reports.exportCashierPerformanceToExcel.useMutation({
    onSuccess: () => {
      toast.success("Cashier performance report exported successfully");
    },
    onError: (error) => {
      toast.error(`Failed to export: ${error.message}`);
    },
  });

  const COLORS = ["#1a5f3f", "#d4a574", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Business insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      {monthlySalesReport && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlySalesReport.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlySalesReport.transactionCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlySalesReport.netSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                After discounts: ${monthlySalesReport.totalDiscount.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tax
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlySalesReport.totalTax.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: ${monthlySalesReport.averageTransaction.toFixed(2)}/transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profitMarginAnalysis ? `${profitMarginAnalysis.profitMargin}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profitMarginAnalysis
                  ? `Cost: ${profitMarginAnalysis.costPercentage}%`
                  : "Loading..."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="cashiers">Cashiers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Sales Trend</CardTitle>
                <CardDescription>Daily sales breakdown for the selected month</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportSalesReportMutation.mutate({
                    year: selectedYear,
                    month: selectedMonth,
                  })
                }
                disabled={exportSalesReportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <select
                      id="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2024, m - 1).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <select
                      id="year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      {[2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {monthlySalesReport && monthlySalesReport.dailyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlySalesReport.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalSales" stroke="#1a5f3f" name="Sales" />
                      <Line type="monotone" dataKey="totalTax" stroke="#d4a574" name="Tax" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Best Selling Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Best Selling Products</CardTitle>
                <CardDescription>Top 10 products by revenue (last 30 days)</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportBestSellingMutation.mutate({ limit: 10, days: 30 })}
                disabled={exportBestSellingMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {bestSellingProducts && bestSellingProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bestSellingProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#1a5f3f" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Products below minimum stock level</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportLowStockMutation.mutate({ limit: 20 })}
                disabled={exportLowStockMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.productId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.productSku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={product.status === "out-of-stock" ? "destructive" : "secondary"}>
                          {product.status === "out-of-stock" ? "Out of Stock" : "Low Stock"}
                        </Badge>
                        <p className="text-sm mt-1">
                          {product.currentStock} / {product.minimumStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">All products well stocked</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashiers Tab */}
        <TabsContent value="cashiers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cashier Performance</CardTitle>
                <CardDescription>Sales and transaction metrics by cashier</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportCashierMutation.mutate({ startDate, endDate })}
                disabled={exportCashierMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {cashierPerformance && cashierPerformance.length > 0 ? (
                <div className="space-y-4">
                  {cashierPerformance.map((cashier: any) => (
                    <div key={cashier.cashierId} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{cashier.cashierName}</h3>
                        <Badge variant="outline">{cashier.transactionCount} transactions</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Sales</p>
                          <p className="font-semibold">${cashier.totalSales.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Sale</p>
                          <p className="font-semibold">${cashier.averageTransaction.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Discount</p>
                          <p className="font-semibold">${cashier.totalDiscount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Refunds</p>
                          <p className="font-semibold">${cashier.totalRefunds.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No cashier data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Sales breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods && paymentMethods.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, count }) => `${method}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalAmount"
                      >
                        {paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {paymentMethods.map((method: any, index: number) => (
                      <div key={method.method} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${method.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{method.count} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No payment data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
