import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Clock, MapPin, RefreshCw } from "lucide-react"

const adminOAuthLogs = [
  {
    id: "1",
    provider: "Google",
    status: "Success",
    email: "admin@cloudfiles.io",
    tokenExpiry: "2024-02-19 14:32:15",
    ip: "192.168.1.105",
    location: "New York, US",
    timestamp: "2024-02-12 14:32:15",
  },
  {
    id: "2",
    provider: "GitHub",
    status: "Failed",
    email: "hacker@example.com",
    tokenExpiry: "—",
    ip: "45.123.89.234",
    location: "Unknown",
    timestamp: "2024-02-12 13:45:22",
  },
  {
    id: "3",
    provider: "Microsoft",
    status: "Success",
    email: "user@cloudfiles.io",
    tokenExpiry: "2024-02-19 12:05:33",
    ip: "192.168.1.89",
    location: "San Francisco, US",
    timestamp: "2024-02-12 12:05:33",
  },
  {
    id: "4",
    provider: "Google",
    status: "Success",
    email: "designer@cloudfiles.io",
    tokenExpiry: "2024-02-19 10:23:09",
    ip: "192.168.1.67",
    location: "London, UK",
    timestamp: "2024-02-12 10:23:09",
  },
]

const userOAuthLogs = [
  {
    id: "1",
    provider: "Google",
    status: "Success",
    email: "user@cloudfiles.io",
    tokenExpiry: "2024-02-19 14:32:15",
    ip: "192.168.1.89",
    location: "San Francisco, US",
    timestamp: "2024-02-12 14:32:15",
  },
  {
    id: "2",
    provider: "Microsoft",
    status: "Success",
    email: "user@cloudfiles.io",
    tokenExpiry: "2024-02-19 12:05:33",
    ip: "192.168.1.89",
    location: "San Francisco, US",
    timestamp: "2024-02-12 12:05:33",
  },
]

export default function OAuthLogsPage() {
  // In a real app, this would check role from context
  const logs = adminOAuthLogs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-3xl font-bold tracking-tight">OAuth Logs</h1>
        <p className="text-pretty mt-1 text-muted-foreground">Monitor authentication attempts and token activity</p>
      </div>

      <div className="glass flex items-center gap-3 rounded-lg border border-border/50 p-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All providers</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="microsoft">Microsoft</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {logs.map((log) => {
          const isSuccess = log.status === "Success"
          const isFailed = log.status === "Failed"

          return (
            <Card
              key={log.id}
              className={`glass border transition-all hover:shadow-lg ${
                isFailed ? "border-destructive/30 glow-destructive" : "border-border/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${
                        isSuccess
                          ? "bg-success/10 text-success"
                          : isFailed
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : isFailed ? (
                        <XCircle className="h-6 w-6" />
                      ) : (
                        <Clock className="h-6 w-6" />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-pretty font-semibold">{log.provider} OAuth</h3>
                        <Badge
                          variant={isSuccess ? "default" : "destructive"}
                          className={isSuccess ? "bg-success hover:bg-success/90" : ""}
                        >
                          {log.status}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium text-foreground">Email:</span>
                          <span className="font-mono">{log.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">Token Expiry:</span>
                          <span className="font-mono">{log.tokenExpiry}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">Location:</span>
                          <span>{log.location}</span>
                          <span className="font-mono">({log.ip})</span>
                        </div>
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