import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, Target, Users, Zap } from "lucide-react";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("forecast");

  // Fetch analytics data
  const { data: forecast } = trpc.analytics.getSalesForecast.useQuery({ days: 30 });
  const { data: segmentation } = trpc.analytics.getCustomerSegmentation.useQuery();
  const { data: productPerformance } = trpc.analytics.getProductPerformance.useQuery();
  const { data: insights } = trpc.analytics.getAIInsights.useQuery();
  const { data: anomalies } = trpc.analytics.detectAnomalies.useQuery();
  const { data: paymentBreakdown } = trpc.analytics.getRevenueByPaymentMethod.useQuery();
  const { data: clvPredictions } = trpc.analytics.predictCustomerLifetimeValue.useQuery();

  // Prepare chart data
  const forecastData = useMemo(() => {
    if (!forecast?.forecast) return [];
    return forecast.forecast.slice(0, 15).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      predicted: item.predictedSales,
      confidence: item.confidence,
    }));
  }, [forecast]);

  const segmentationData = useMemo(() => {
    if (!segmentation) return [];
    return segmentation.map((seg: any) => ({
      name: seg.segment || "Unknown",
      value: parseInt(seg.count || "0"),
      revenue: parseFloat((seg.totalRevenue as any) || "0"),
    }));
  }, [segmentation]);

  const paymentData = useMemo(() => {
    if (!paymentBreakdown) return [];
    return paymentBreakdown.map((item: any) => ({
      name: item.paymentMethod || "Unknown",
      value: parseFloat((item.totalAmount as any) || "0"),
      count: parseInt((item.transactionCount as any) || "0"),
    }));
  }, [paymentBreakdown]);

  const topProducts = useMemo(() => {
    if (!productPerformance) return [];
    return productPerformance.slice(0, 10).map((item: any) => ({
      name: item.productName || "Unknown",
      revenue: parseFloat((item.totalRevenue as any) || "0"),
      sold: parseInt((item.totalSold as any) || "0"),
    }));
  }, [productPerformance]);

  const COLORS = ["#0f766e", "#14b8a6", "#2dd4bf", "#67e8f9", "#a5f3fc"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Advanced Analytics</h1>
        <p className="text-muted-foreground">AI-powered insights and predictive analytics for your business</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{forecast?.trend === "upward" ? "↑" : forecast?.trend === "downward" ? "↓" : "→"}</p>
                <p className="text-xs text-muted-foreground capitalize">{forecast?.trend || "stable"}</p>
              </div>
              {forecast?.trend === "upward" ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              ) : forecast?.trend === "downward" ? (
                <TrendingDown className="w-8 h-8 text-red-500" />
              ) : (
                <Zap className="w-8 h-8 text-amber-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(forecast?.avgDailySales || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Last 90 days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forecast Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(forecast?.confidence || 0)}%</p>
            <p className="text-xs text-muted-foreground">30-day prediction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Anomalies Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{anomalies?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                  {insight.type === "positive" ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                  <Badge variant={insight.priority === "high" ? "destructive" : "secondary"} className="flex-shrink-0">
                    {insight.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="clv">Customer Value</TabsTrigger>
        </TabsList>

        {/* Sales Forecast Tab */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              {forecastData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#0f766e" strokeWidth={2} name="Predicted Sales" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No forecast data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0f766e" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No product data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segmentation</CardTitle>
            </CardHeader>
            <CardContent>
              {segmentationData.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={segmentationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {segmentationData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {segmentationData.map((seg: any, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{seg.name}</span>
                          <Badge>{seg.value} customers</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue: ${seg.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No segmentation data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {paymentData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {paymentData.map((payment: any, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{payment.name}</span>
                          <Badge variant="outline">{payment.count} txns</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue: ${payment.value.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payment data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Lifetime Value Tab */}
        <TabsContent value="clv">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Customer Lifetime Value Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clvPredictions && clvPredictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Customer</th>
                        <th className="text-right py-2 px-2">Current Value</th>
                        <th className="text-right py-2 px-2">Predicted CLV</th>
                        <th className="text-right py-2 px-2">Frequency</th>
                        <th className="text-center py-2 px-2">Churn Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clvPredictions.map((customer: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-muted">
                          <td className="py-2 px-2">{customer.customerName}</td>
                          <td className="text-right py-2 px-2">${customer.currentValue.toFixed(2)}</td>
                          <td className="text-right py-2 px-2 font-medium">${customer.predictedCLV.toFixed(2)}</td>
                          <td className="text-right py-2 px-2">{customer.frequency}/day</td>
                          <td className="text-center py-2 px-2">
                            <Badge
                              variant={
                                customer.churnRisk === "high"
                                  ? "destructive"
                                  : customer.churnRisk === "medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {customer.churnRisk}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No CLV data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Anomalies Section */}
      {anomalies && anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{anomaly.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.type === "spike" ? "Sales spike" : "Sales dip"}: {Math.abs(anomaly.deviation)}% deviation
                    </p>
                  </div>
                  <Badge variant={anomaly.type === "spike" ? "default" : "secondary"}>${anomaly.sales.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
