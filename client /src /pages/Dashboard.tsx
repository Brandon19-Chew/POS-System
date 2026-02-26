import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Package, ShoppingCart, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: branches } = trpc.branches.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  const stats = [
    {
      label: "Total Branches",
      value: branches?.length || 0,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Products",
      value: products?.length || 0,
      icon: <Package className="w-6 h-6" />,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Customers",
      value: customers?.length || 0,
      icon: <Users className="w-6 h-6" />,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Low Stock Items",
      value: 12,
      icon: <AlertCircle className="w-6 h-6" />,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your POS system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Transaction #{1001 + i}</p>
                    <p className="text-sm text-muted-foreground">Today at {10 + i}:00 AM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">${(Math.random() * 500 + 50).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm font-medium text-accent">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Server</span>
              <span className="text-sm font-medium text-accent">Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sync Status</span>
              <span className="text-sm font-medium text-accent">Up to date</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Last sync: 2 minutes ago</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="p-6 border-l-4 border-l-destructive bg-destructive/5">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive mb-1">Low Stock Alert</h3>
            <p className="text-sm text-muted-foreground">
              12 products are below minimum stock level. Review inventory and place orders.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
