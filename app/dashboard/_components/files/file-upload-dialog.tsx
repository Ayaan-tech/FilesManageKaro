"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function FileUploadDialog() {
  const [open, setOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const handleUpload = () => {
    toast({
      title: "File uploaded",
      description: "Your file has been uploaded successfully.",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>Drag and drop or click to select files to upload</DialogDescription>
        </DialogHeader>
        <div
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleUpload()
          }}
          onClick={handleUpload}
        >
          <FileIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-pretty text-center text-sm font-medium">Drop files here or click to browse</p>
          <p className="text-pretty mt-1 text-center text-xs text-muted-foreground">
            Support for all file types up to 100MB
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}