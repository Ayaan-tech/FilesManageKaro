import type { Metadata } from "next";
import { Sidebar } from "./_components/sidebar";
import { Navbar } from "./_components/navbar";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "Dashboard - CloudFiles",
  description: "Modern cloud file management dashboard with role-based access control",
};

// Force dynamic rendering to avoid build-time errors with Clerk
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}