"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useRole } from "@/lib/role-context"

const adminData = [
  { date: "Jan 1", uploads: 245, downloads: 180 },
  { date: "Jan 8", uploads: 312, downloads: 245 },
  { date: "Jan 15", uploads: 289, downloads: 298 },
  { date: "Jan 22", uploads: 405, downloads: 356 },
  { date: "Jan 29", uploads: 378, downloads: 412 },
  { date: "Feb 5", uploads: 445, downloads: 389 },
  { date: "Feb 12", uploads: 523, downloads: 467 },
]

const userData = [
  { date: "Jan 1", uploads: 12, downloads: 8 },
  { date: "Jan 8", uploads: 15, downloads: 11 },
  { date: "Jan 15", uploads: 14, downloads: 13 },
  { date: "Jan 22", uploads: 19, downloads: 16 },
  { date: "Jan 29", uploads: 17, downloads: 18 },
  { date: "Feb 5", uploads: 21, downloads: 19 },
  { date: "Feb 12", uploads: 24, downloads: 22 },
]

export function ActivityChart() {
  const { role } = useRole()
  const data = role === "admin" ? adminData : userData

  return (
    <Card className="glass col-span-full border-border/50">
      <CardHeader>
        <CardTitle className="text-pretty">File Activity</CardTitle>
        <CardDescription>Upload and download trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.7 0.2 195)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.7 0.2 195)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.2 290)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.65 0.2 290)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 264)" opacity={0.2} />
            <XAxis dataKey="date" stroke="oklch(0.62 0.01 264)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.62 0.01 264)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.13 0.012 264)",
                border: "1px solid oklch(0.22 0.02 264)",
                borderRadius: "0.5rem",
                color: "oklch(0.96 0.003 264)",
              }}
            />
            <Area
              type="monotone"
              dataKey="uploads"
              stroke="oklch(0.7 0.2 195)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUploads)"
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="oklch(0.65 0.2 290)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDownloads)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-neon-cyan" />
            <span className="text-muted-foreground">Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-neon-violet" />
            <span className="text-muted-foreground">Downloads</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}