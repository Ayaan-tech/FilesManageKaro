import { LogFilters } from "@/app/dashboard/_components/logs/log-filters"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Trash2, Share2 } from "lucide-react"

const adminLogs = [
  {
    id: "1",
    userId: "USR-1247",
    action: "Upload",
    fileName: "presentation.pdf",
    ip: "192.168.1.105",
    timestamp: "2024-02-12 14:32:15",
  },
  {
    id: "2",
    userId: "USR-0834",
    action: "Download",
    fileName: "project-assets.zip",
    ip: "192.168.1.89",
    timestamp: "2024-02-12 13:18:42",
  },
  {
    id: "3",
    userId: "USR-1247",
    action: "Delete",
    fileName: "old-backup.zip",
    ip: "192.168.1.105",
    timestamp: "2024-02-12 12:05:33",
  },
  {
    id: "4",
    userId: "USR-2156",
    action: "Share",
    fileName: "banner-design.png",
    ip: "192.168.1.67",
    timestamp: "2024-02-12 11:47:21",
  },
  {
    id: "5",
    userId: "USR-0834",
    action: "Upload",
    fileName: "meeting-notes.docx",
    ip: "192.168.1.89",
    timestamp: "2024-02-12 10:23:09",
  },
]

const userLogs = [
  {
    id: "1",
    userId: "USR-0834",
    action: "Upload",
    fileName: "my-document.pdf",
    ip: "192.168.1.89",
    timestamp: "2024-02-12 14:32:15",
  },
  {
    id: "2",
    userId: "USR-0834",
    action: "Download",
    fileName: "profile-photo.jpg",
    ip: "192.168.1.89",
    timestamp: "2024-02-12 13:18:42",
  },
  {
    id: "3",
    userId: "USR-0834",
    action: "Share",
    fileName: "notes.txt",
    ip: "192.168.1.89",
    timestamp: "2024-02-12 11:47:21",
  },
]

function getActionIcon(action: string) {
  switch (action) {
    case "Upload":
      return Upload
    case "Download":
      return Download
    case "Delete":
      return Trash2
    case "Share":
      return Share2
    default:
      return Upload
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "Upload":
      return "text-success"
    case "Download":
      return "text-neon-cyan"
    case "Delete":
      return "text-destructive"
    case "Share":
      return "text-neon-violet"
    default:
      return "text-foreground"
  }
}

export default function UserLogsPage() {
  // In a real app, this would check role from context
  const logs = adminLogs
  const isAdmin = true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-3xl font-bold tracking-tight">User Logs</h1>
        <p className="text-pretty mt-1 text-muted-foreground">Track all user file activity and interactions</p>
      </div>

      <LogFilters showUserFilter={isAdmin} />

      <div className="glass rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>User ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const Icon = getActionIcon(log.action)
              const colorClass = getActionColor(log.action)
              return (
                <TableRow key={log.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{log.userId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <Badge variant="outline" className={colorClass}>
                        {log.action}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-pretty font-mono text-sm">{log.fileName}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{log.ip}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{log.timestamp}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}