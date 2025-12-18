"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Info, ShieldAlert, RefreshCw, Lock } from "lucide-react"
import { useRole } from "@/lib/role-context"

const adminLogs = [
  {
    id: "1",
    action: "Role Change",
    description: "User USR-0834 promoted to Admin",
    severity: "Critical",
    performedBy: "admin@cloudfiles.io",
    timestamp: "2024-02-12 14:32:15",
  },
  {
    id: "2",
    action: "Permission Update",
    description: "File sharing permissions modified for team",
    severity: "Warning",
    performedBy: "admin@cloudfiles.io",
    timestamp: "2024-02-12 12:18:42",
  },
  {
    id: "3",
    action: "System Configuration",
    description: "Storage quota increased to 500GB",
    severity: "Info",
    performedBy: "admin@cloudfiles.io",
    timestamp: "2024-02-12 10:05:33",
  },
  {
    id: "4",
    action: "Security Update",
    description: "Two-factor authentication enforced for all users",
    severity: "Critical",
    performedBy: "admin@cloudfiles.io",
    timestamp: "2024-02-11 16:47:21",
  },
]

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "Critical":
      return {
        icon: ShieldAlert,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        badgeVariant: "destructive" as const,
      }
    case "Warning":
      return {
        icon: AlertTriangle,
        color: "text-warning",
        bgColor: "bg-warning/10",
        badgeVariant: "default" as const,
      }
    case "Info":
      return {
        icon: Info,
        color: "text-neon-cyan",
        bgColor: "bg-neon-cyan/10",
        badgeVariant: "secondary" as const,
      }
    default:
      return {
        icon: Info,
        color: "text-foreground",
        bgColor: "bg-muted",
        badgeVariant: "secondary" as const,
      }
  }
}

export default function AdminLogsPage() {
  const { role } = useRole()

  if (role !== "admin") {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <Card className="glass max-w-md border-border/50">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="rounded-full bg-muted p-6">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-balance text-2xl font-bold">Admin Access Required</h2>
              <p className="text-pretty mt-2 text-muted-foreground">
                You don't have permission to view this page. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-3xl font-bold tracking-tight">Admin Logs</h1>
        <p className="text-pretty mt-1 text-muted-foreground">
          Audit trail of administrative actions and system changes
        </p>
      </div>

      <div className="glass flex items-center gap-3 rounded-lg border border-border/50 p-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="role">Role Change</SelectItem>
            <SelectItem value="permission">Permission Update</SelectItem>
            <SelectItem value="system">System Configuration</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {adminLogs.map((log) => {
          const config = getSeverityConfig(log.severity)
          const Icon = config.icon

          return (
            <Card key={log.id} className="glass border border-border/50 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${config.bgColor} ${config.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-pretty font-semibold">{log.action}</h3>
                        <Badge
                          variant={config.badgeVariant}
                          className={log.severity === "Warning" ? "bg-warning hover:bg-warning/90" : ""}
                        >
                          {log.severity}
                        </Badge>
                      </div>

                      <p className="text-pretty text-sm text-muted-foreground">{log.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground">Performed by:</span>{" "}
                          <span className="font-mono">{log.performedBy}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-sm text-muted-foreground">{log.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}