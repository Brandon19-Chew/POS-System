import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [limit, setLimit] = useState(100);

  // Queries
  const { data: auditLogs, isLoading } = trpc.settings.getAuditLogs.useQuery({
    limit,
    offset: 0,
    action: filterAction || undefined,
    entityType: filterEntity || undefined,
  });

  const { data: auditStats } = trpc.settings.getAuditLogStats.useQuery();

  // Filter logs based on search term
  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];

    return auditLogs.filter((log: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.userEmail?.toLowerCase().includes(searchLower)
      );
    });
  }, [auditLogs, searchTerm]);

  // Get unique actions and entities for filters
  const uniqueActions = useMemo(() => {
    if (!auditStats) return [];
    return Object.keys(auditStats.actionStats);
  }, [auditStats]);

  const uniqueEntities = useMemo(() => {
    if (!auditStats) return [];
    return Object.keys(auditStats.entityStats);
  }, [auditStats]);

  // Export logs as CSV
  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["ID", "User", "Email", "Action", "Entity Type", "Entity ID", "IP Address", "Date"];
    const rows = filteredLogs.map((log: any) => [
      log.id,
      log.userName || "Unknown",
      log.userEmail || "Unknown",
      log.action,
      log.entityType,
      log.entityId,
      log.ipAddress || "N/A",
      format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Audit logs exported successfully");
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "VIEW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          Track all system activities, user actions, and changes
        </p>
      </div>

      {/* Statistics Cards */}
      {auditStats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.totalLogs}</div>
              <p className="text-xs text-muted-foreground mt-1">All recorded activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(auditStats.actionStats).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique action types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(auditStats.entityStats).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Modified entities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(auditStats.userStats).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Users with activity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by user, action, or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <select
                id="action-filter"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="border rounded px-2 py-2 w-full text-sm"
              >
                <option value="">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-filter">Entity Type</Label>
              <select
                id="entity-filter"
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="border rounded px-2 py-2 w-full text-sm"
              >
                <option value="">All Entities</option>
                {uniqueEntities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterAction("");
                setFilterEntity("");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button size="sm" onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs?.length || 0} of {auditLogs?.length || 0} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.userName || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{log.userEmail || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityType}</TableCell>
                      <TableCell className="text-muted-foreground">{log.entityId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          )}

          {filteredLogs && filteredLogs.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Displaying {filteredLogs.length} of {auditLogs?.length || 0} events
              </p>
              {auditLogs && auditLogs.length >= limit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLimit(limit + 50)}
                >
                  Load More
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Details</CardTitle>
                <CardDescription>
                  {selectedLog.action} on {selectedLog.entityType}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="text-sm font-semibold">{selectedLog.userName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold">{selectedLog.userEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Action</p>
                <Badge className={getActionColor(selectedLog.action)}>
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                <p className="text-sm font-semibold">{selectedLog.entityType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                <p className="text-sm font-semibold">{selectedLog.entityId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                <p className="text-sm font-semibold">{selectedLog.ipAddress || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                <p className="text-sm font-semibold">
                  {format(new Date(selectedLog.createdAt), "PPpp")}
                </p>
              </div>
            </div>

            {selectedLog.changes && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Changes</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                  {typeof selectedLog.changes === "string"
                    ? selectedLog.changes
                    : JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
