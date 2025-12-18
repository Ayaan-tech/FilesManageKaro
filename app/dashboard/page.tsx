import { KpiCard } from "@/app/dashboard/_components/dashboard/kpi-card"
import { ActivityChart } from "@/app/dashboard/_components/dashboard/activity-chart"
import { LoginChart } from "@/app/dashboard/_components/dashboard/login-chart"
import { Users, FolderOpen, Activity, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-pretty mt-1 text-muted-foreground">
          Monitor your cloud storage activity and performance metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Users"
          value="1,247"
          adminValue="1,247"
          userValue="—"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          color="cyan"
        />
        <KpiCard
          title="Files Stored"
          value="45,231"
          adminValue="45,231"
          userValue="147"
          icon={FolderOpen}
          trend={{ value: 8.2, isPositive: true }}
          color="violet"
        />
        <KpiCard
          title="Active Sessions"
          value="342"
          adminValue="342"
          userValue="1"
          icon={Activity}
          trend={{ value: 3.1, isPositive: false }}
          color="emerald"
        />
        <KpiCard
          title="Failed OAuth"
          value="23"
          adminValue="23"
          userValue="0"
          icon={AlertTriangle}
          trend={{ value: 15.3, isPositive: false }}
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart />
        <LoginChart />
      </div>
    </div>
  )
}