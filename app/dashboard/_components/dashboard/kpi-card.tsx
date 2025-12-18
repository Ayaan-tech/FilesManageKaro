"use client"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { useRole } from "@/lib/role-context"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: "cyan" | "violet" | "emerald" | "amber"
  adminValue?: string | number
  userValue?: string | number
}

const colorClasses = {
  cyan: "from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30",
  violet: "from-neon-violet/20 to-neon-violet/5 border-neon-violet/30",
  emerald: "from-neon-emerald/20 to-neon-emerald/5 border-neon-emerald/30",
  amber: "from-warning/20 to-warning/5 border-warning/30",
}

const iconColorClasses = {
  cyan: "text-neon-cyan",
  violet: "text-neon-violet",
  emerald: "text-neon-emerald",
  amber: "text-warning",
}

export function KpiCard({ title, value, icon: Icon, trend, color, adminValue, userValue }: KpiCardProps) {
  const { role } = useRole()

  const displayValue = role === "admin" ? adminValue || value : userValue || value

  return (
    <Card
      className={cn(
        "glass group relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        "bg-gradient-to-br",
        colorClasses[color],
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{displayValue}</h3>
              {trend && (
                <span className={cn("text-xs font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          <div className={cn("rounded-lg bg-card/50 p-3 backdrop-blur-sm", iconColorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60", colorClasses[color])} />
    </Card>
  )
}