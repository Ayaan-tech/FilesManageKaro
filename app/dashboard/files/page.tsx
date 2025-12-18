import { FileUploadDialog } from "@/app/dashboard/_components/files/file-upload-dialog"
import { FileTable } from "@/app/dashboard/_components/files/file-table"
import { Button } from "@/components/ui/button"
import { Grid3X3, List } from "lucide-react"

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-balance text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-pretty mt-1 text-muted-foreground">Manage and organize your cloud storage files</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          <FileUploadDialog />
        </div>
      </div>

      <FileTable />
    </div>
  )
}