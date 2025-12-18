"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useRole } from "@/lib/role-context"

const adminData = [
  { hour: "00:00", success: 24, failed: 3 },
  { hour: "04:00", success: 12, failed: 1 },
  { hour: "08:00", success: 89, failed: 7 },
  { hour: "12:00", success: 156, failed: 12 },
  { hour: "16:00", success: 134, failed: 8 },
  { hour: "20:00", success: 78, failed: 5 },
]

const userData = [
  { hour: "00:00", success: 0, failed: 0 },
  { hour: "04:00", success: 0, failed: 0 },
  { hour: "08:00", success: 3, failed: 0 },
  { hour: "12:00", success: 5, failed: 1 },
  { hour: "16:00", success: 4, failed: 0 },
  { hour: "20:00", success: 2, failed: 0 },
]

export function LoginChart() {
  const { role } = useRole()
  const data = role === "admin" ? adminData : userData

  return (
    <Card className="glass col-span-full border-border/50">
      <CardHeader>
        <CardTitle className="text-pretty">Login Activity</CardTitle>
        <CardDescription>Successful and failed authentication attempts</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 264)" opacity={0.2} />
            <XAxis dataKey="hour" stroke="oklch(0.62 0.01 264)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.62 0.01 264)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.13 0.012 264)",
                border: "1px solid oklch(0.22 0.02 264)",
                borderRadius: "0.5rem",
                color: "oklch(0.96 0.003 264)",
              }}
            />
            <Legend />
            <Bar dataKey="success" fill="oklch(0.7 0.16 160)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" fill="oklch(0.55 0.22 25)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}