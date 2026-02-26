import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Download, Upload, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: systemSettings, isLoading: settingsLoading } =
    trpc.settings.getSystemSettings.useQuery();
  const { data: systemHealth } = trpc.settings.getSystemHealth.useQuery();
  const { data: backupHistory } = trpc.settings.getBackupHistory.useQuery();
  const { data: auditStats } = trpc.settings.getAuditLogStats.useQuery();

  // Mutations
  const updateSettingsMutation = trpc.settings.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
      setIsSaving(false);
    },
  });

  const createBackupMutation = trpc.settings.createBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create backup: ${error.message}`);
    },
  });

  const restoreBackupMutation = trpc.settings.restoreBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup restored successfully");
    },
    onError: (error) => {
      toast.error(`Failed to restore backup: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    taxRate: (systemSettings?.taxRate as any) || 0,
    taxName: (systemSettings?.taxName as any) || "VAT",
    currencyCode: (systemSettings?.currencyCode as any) || "USD",
    currencySymbol: (systemSettings?.currencySymbol as any) || "$",
    timezone: (systemSettings?.timezone as any) || "UTC",
    dateFormat: (systemSettings?.dateFormat as any) || "YYYY-MM-DD",
    timeFormat: (systemSettings?.timeFormat as any) || "HH:mm:ss",
    businessName: (systemSettings?.businessName as any) || "",
    businessAddress: (systemSettings?.businessAddress as any) || "",
    businessPhone: (systemSettings?.businessPhone as any) || "",
    businessEmail: (systemSettings?.businessEmail as any) || "",
    receiptHeader: (systemSettings?.receiptHeader as any) || "Thank you for your purchase",
    receiptFooter: (systemSettings?.receiptFooter as any) || "Visit us again!",
    receiptShowLogo: (systemSettings?.receiptShowLogo as any) || false,
    receiptShowItemDetails: (systemSettings?.receiptShowItemDetails as any) || true,
    receiptShowTaxBreakdown: (systemSettings?.receiptShowTaxBreakdown as any) || true,
    receiptShowPaymentMethod: (systemSettings?.receiptShowPaymentMethod as any) || true,
    receiptShowCustomerInfo: (systemSettings?.receiptShowCustomerInfo as any) || false,
    receiptShowPromotions: (systemSettings?.receiptShowPromotions as any) || true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSettingsMutation.mutateAsync(formData as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure taxes, receipts, and system preferences</p>
      </div>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {systemHealth.status === "healthy" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold">System is Healthy</p>
                    <p className="text-sm text-muted-foreground">
                      Database: {systemHealth.database} | Uptime: {Math.floor(systemHealth.uptime)}s
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold">System Error</p>
                    <p className="text-sm text-muted-foreground">{systemHealth.message}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Tax, currency, and localization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxName">Tax Name</Label>
                  <Input
                    id="taxName"
                    name="taxName"
                    value={formData.taxName}
                    onChange={handleInputChange}
                    placeholder="VAT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input
                    id="currencyCode"
                    name="currencyCode"
                    value={formData.currencyCode}
                    onChange={handleInputChange}
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    name="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={handleInputChange}
                    placeholder="$"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                    className="border rounded px-2 py-2 w-full"
                  >
                    <option>UTC</option>
                    <option>Asia/Singapore</option>
                    <option>Asia/Bangkok</option>
                    <option>Asia/Hong_Kong</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    name="dateFormat"
                    value={formData.dateFormat}
                    onChange={handleInputChange}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Input
                  id="timeFormat"
                  name="timeFormat"
                  value={formData.timeFormat}
                  onChange={handleInputChange}
                  placeholder="HH:mm:ss"
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || updateSettingsMutation.isPending}
              >
                {isSaving ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your business details displayed on receipts and reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Address</Label>
                <Input
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, Country"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    placeholder="info@business.com"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || updateSettingsMutation.isPending}
              >
                {isSaving ? "Saving..." : "Save Business Information"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Customization</CardTitle>
              <CardDescription>Configure receipt layout and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Input
                  id="receiptHeader"
                  name="receiptHeader"
                  value={formData.receiptHeader}
                  onChange={handleInputChange}
                  placeholder="Thank you for your purchase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Input
                  id="receiptFooter"
                  name="receiptFooter"
                  value={formData.receiptFooter}
                  onChange={handleInputChange}
                  placeholder="Visit us again!"
                />
              </div>

              <div className="space-y-4">
                <Label>Receipt Content Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowLogo"
                      name="receiptShowLogo"
                      checked={formData.receiptShowLogo}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowLogo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowLogo" className="font-normal">
                      Show Business Logo
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowItemDetails"
                      name="receiptShowItemDetails"
                      checked={formData.receiptShowItemDetails}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowItemDetails: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowItemDetails" className="font-normal">
                      Show Item Details
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowTaxBreakdown"
                      name="receiptShowTaxBreakdown"
                      checked={formData.receiptShowTaxBreakdown}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowTaxBreakdown: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowTaxBreakdown" className="font-normal">
                      Show Tax Breakdown
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowPaymentMethod"
                      name="receiptShowPaymentMethod"
                      checked={formData.receiptShowPaymentMethod}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowPaymentMethod: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowPaymentMethod" className="font-normal">
                      Show Payment Method
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowCustomerInfo"
                      name="receiptShowCustomerInfo"
                      checked={formData.receiptShowCustomerInfo}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowCustomerInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowCustomerInfo" className="font-normal">
                      Show Customer Information
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receiptShowPromotions"
                      name="receiptShowPromotions"
                      checked={formData.receiptShowPromotions}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, receiptShowPromotions: checked as boolean }))
                      }
                    />
                    <Label htmlFor="receiptShowPromotions" className="font-normal">
                      Show Promotions Applied
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || updateSettingsMutation.isPending}
              >
                {isSaving ? "Saving..." : "Save Receipt Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Backup Management</CardTitle>
                <CardDescription>Create and restore system backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => createBackupMutation.mutate()}
                  disabled={createBackupMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {createBackupMutation.isPending ? "Creating Backup..." : "Create Backup Now"}
                </Button>
              </CardContent>
            </Card>

            {backupHistory && backupHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Backup History</CardTitle>
                  <CardDescription>Previous backups available for restore</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {backupHistory.map((backup: any) => (
                      <div key={backup.backupId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{backup.timestamp}</p>
                          <p className="text-sm text-muted-foreground">Size: {backup.size}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackupMutation.mutate({ backupId: backup.backupId })}
                          disabled={restoreBackupMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log Summary</CardTitle>
              <CardDescription>System activity and change tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {auditStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">{auditStats.totalLogs}</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Action Types</p>
                      <p className="text-2xl font-bold">{Object.keys(auditStats.actionStats).length}</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Entity Types</p>
                      <p className="text-2xl font-bold">{Object.keys(auditStats.entityStats).length}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(auditStats.actionStats).map(([action, count]) => (
                        <Badge key={action} variant="secondary">
                          {action}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Entity Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(auditStats.entityStats).map(([entity, count]) => (
                        <Badge key={entity} variant="outline">
                          {entity}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No audit data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
