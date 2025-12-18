"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Share2, Trash2, MoreHorizontal, FileIcon, ImageIcon, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRole } from "@/lib/role-context"
import { useToast } from "@/hooks/use-toast"

interface FileItem {
  id: string
  name: string
  size: string
  type: string
  owner: string
  uploadedAt: string
  shared: boolean
}

const adminFiles: FileItem[] = [
  {
    id: "1",
    name: "presentation.pdf",
    size: "2.4 MB",
    type: "pdf",
    owner: "admin@cloudfiles.io",
    uploadedAt: "2024-02-12",
    shared: true,
  },
  {
    id: "2",
    name: "project-assets.zip",
    size: "45.2 MB",
    type: "archive",
    owner: "user@cloudfiles.io",
    uploadedAt: "2024-02-11",
    shared: false,
  },
  {
    id: "3",
    name: "banner-design.png",
    size: "3.8 MB",
    type: "image",
    owner: "designer@cloudfiles.io",
    uploadedAt: "2024-02-10",
    shared: true,
  },
  {
    id: "4",
    name: "report-q1.xlsx",
    size: "892 KB",
    type: "spreadsheet",
    owner: "admin@cloudfiles.io",
    uploadedAt: "2024-02-09",
    shared: false,
  },
  {
    id: "5",
    name: "meeting-notes.docx",
    size: "124 KB",
    type: "document",
    owner: "user@cloudfiles.io",
    uploadedAt: "2024-02-08",
    shared: true,
  },
]

const userFiles: FileItem[] = [
  {
    id: "1",
    name: "my-document.pdf",
    size: "1.2 MB",
    type: "pdf",
    owner: "user@cloudfiles.io",
    uploadedAt: "2024-02-12",
    shared: false,
  },
  {
    id: "2",
    name: "profile-photo.jpg",
    size: "456 KB",
    type: "image",
    owner: "user@cloudfiles.io",
    uploadedAt: "2024-02-10",
    shared: false,
  },
  {
    id: "3",
    name: "notes.txt",
    size: "12 KB",
    type: "text",
    owner: "user@cloudfiles.io",
    uploadedAt: "2024-02-08",
    shared: true,
  },
]

function getFileIcon(type: string) {
  if (type === "image") return ImageIcon
  if (type === "pdf" || type === "document") return FileText
  return FileIcon
}

export function FileTable() {
  const { role } = useRole()
  const { toast } = useToast()
  const files = role === "admin" ? adminFiles : userFiles

  const handleAction = (action: string, fileName: string) => {
    toast({
      title: `${action} successful`,
      description: `${fileName} has been ${action.toLowerCase()}ed.`,
    })
  }

  return (
    <div className="glass rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            {role === "admin" && <TableHead>Owner</TableHead>}
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const Icon = getFileIcon(file.type)
            return (
              <TableRow key={file.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-pretty">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {file.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{file.size}</TableCell>
                {role === "admin" && <TableCell className="text-muted-foreground">{file.owner}</TableCell>}
                <TableCell className="text-muted-foreground">{file.uploadedAt}</TableCell>
                <TableCell>
                  <Badge variant={file.shared ? "default" : "secondary"}>{file.shared ? "Shared" : "Private"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass">
                      <DropdownMenuItem onClick={() => handleAction("Download", file.name)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("Share", file.name)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("Delete", file.name)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}