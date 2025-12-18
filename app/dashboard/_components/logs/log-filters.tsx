"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

interface LogFiltersProps {
  showUserFilter?: boolean
}

export function LogFilters({ showUserFilter }: LogFiltersProps) {
  const [date, setDate] = useState<Date>()

  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-lg border border-border/50 p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "PPP") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="glass w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>

      <Select defaultValue="all">
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Action type" />
        </SelectTrigger>
        <SelectContent className="glass">
          <SelectItem value="all">All actions</SelectItem>
          <SelectItem value="upload">Upload</SelectItem>
          <SelectItem value="download">Download</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="share">Share</SelectItem>
        </SelectContent>
      </Select>

      {showUserFilter && (
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="admin">admin@cloudfiles.io</SelectItem>
            <SelectItem value="user">user@cloudfiles.io</SelectItem>
            <SelectItem value="designer">designer@cloudfiles.io</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button variant="ghost" size="icon" className="ml-auto">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  )
}