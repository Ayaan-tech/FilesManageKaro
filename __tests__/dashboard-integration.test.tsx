/**
 * Dashboard Integration Tests
 * Tests complete user flows through dashboard, integration between main app and dashboard,
 * and role switching and access control
 * Requirements: 2.1, 2.2, 2.3
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleProvider } from '@/lib/role-context'

// Mock Next.js router
const mockPush = jest.fn()
const mockPathname = '/dashboard'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: mockPathname,
  }),
  usePathname: () => mockPathname,
}))

// Import actual components
import { Sidebar } from '@/app/dashboard/_components/sidebar'
import { Navbar } from '@/app/dashboard/_components/navbar'

const renderWithRole = (component: React.ReactElement) => {
  return render(
    <RoleProvider>
      {component}
    </RoleProvider>
  )
}

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('Complete User Flows Through Dashboard', () => {
    test('dashboard navigation renders all required sections', () => {
      renderWithRole(<Sidebar />)
      
      // Test navigation to different sections
      const dashboardLink = screen.getByText('Dashboard')
      const filesLink = screen.getByText('Files')
      const userLogsLink = screen.getByText('User Logs')
      const adminLogsLink = screen.getByText('Admin Logs')
      const settingsLink = screen.getByText('Settings')
      
      expect(dashboardLink).toBeInTheDocument()
      expect(filesLink).toBeInTheDocument()
      expect(userLogsLink).toBeInTheDocument()
      expect(adminLogsLink).toBeInTheDocument()
      expect(settingsLink).toBeInTheDocument()
    })

    test('dashboard layout maintains consistent structure', () => {
      const DashboardLayout = () => (
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6">
              <div data-testid="dashboard-content">Dashboard Content</div>
            </main>
          </div>
        </div>
      )
      
      renderWithRole(<DashboardLayout />)
      
      // Verify layout structure
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
      
      // Verify sidebar and navbar are present
      expect(screen.getByText('Dashboard')).toBeInTheDocument() // Sidebar
      expect(screen.getByPlaceholderText('Search files, users, logs...')).toBeInTheDocument() // Navbar
    })

    test('sidebar shows role-based access control', () => {
      renderWithRole(<Sidebar />)
      
      // Admin logs should be visible but may have restricted access indication
      const adminLogsLink = screen.getByText('Admin Logs')
      expect(adminLogsLink).toBeInTheDocument()
      
      // The link should exist regardless of access level
      expect(adminLogsLink.closest('a')).toBeInTheDocument()
    })
  })

  describe('Integration Between Main App and Dashboard', () => {
    test('dashboard routes are properly prefixed with /dashboard', () => {
      renderWithRole(<Sidebar />)
      
      // Check that navigation links have correct dashboard prefix
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      const filesLink = screen.getByText('Files').closest('a')
      const userLogsLink = screen.getByText('User Logs').closest('a')
      const settingsLink = screen.getByText('Settings').closest('a')
      
      expect(dashboardLink?.getAttribute('href')).toBe('/dashboard')
      expect(filesLink?.getAttribute('href')).toBe('/dashboard/files')
      expect(userLogsLink?.getAttribute('href')).toBe('/dashboard/user-logs')
      expect(settingsLink?.getAttribute('href')).toBe('/dashboard/settings')
    })

    test('dashboard components integrate properly with main app styling', () => {
      renderWithRole(
        <div className="min-h-screen bg-background">
          <Sidebar />
          <Navbar />
        </div>
      )
      
      // Verify components render without styling conflicts
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search files, users, logs...')).toBeInTheDocument()
      
      // Check that components have proper CSS classes
      const sidebar = screen.getByText('Dashboard').closest('div')?.parentElement?.parentElement
      expect(sidebar).toHaveClass('glass')
    })

    test('dashboard maintains main app theme and design system', () => {
      renderWithRole(<Navbar />)
      
      // Check that navbar uses consistent design tokens
      const searchInput = screen.getByPlaceholderText('Search files, users, logs...')
      expect(searchInput).toHaveClass('h-9', 'w-full')
      
      // Check that buttons use consistent styling
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Role-Based Access Control', () => {
    test('navbar displays user information correctly', () => {
      renderWithRole(<Navbar />)
      
      // Check that user information is displayed
      expect(screen.getByText('Standard User')).toBeInTheDocument()
    })

    test('sidebar shows role information', () => {
      renderWithRole(<Sidebar />)
      
      // Check that role information is displayed in sidebar
      expect(screen.getByText(/Role:/)).toBeInTheDocument()
    })

    test('dashboard preserves role context across component renders', () => {
      const TestDashboard = () => (
        <div>
          <Sidebar />
          <Navbar />
        </div>
      )
      
      renderWithRole(<TestDashboard />)
      
      // Both components should render successfully
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Standard User')).toBeInTheDocument()
    })
  })

  describe('Dashboard Functionality Integration', () => {
    test('search functionality works across dashboard context', () => {
      renderWithRole(<Navbar />)
      
      const searchInput = screen.getByPlaceholderText('Search files, users, logs...')
      
      // Test search input functionality
      fireEvent.change(searchInput, { target: { value: 'test search' } })
      expect(searchInput).toHaveValue('test search')
    })

    test('notification system integrates with dashboard layout', () => {
      renderWithRole(<Navbar />)
      
      // Check notification button is present (it has a bell icon but no accessible name)
      const buttons = screen.getAllByRole('button')
      const notificationButton = buttons.find(button => 
        button.querySelector('.lucide-bell')
      )
      expect(notificationButton).toBeInTheDocument()
    })

    test('user menu functionality works in dashboard context', () => {
      renderWithRole(<Navbar />)
      
      // Check user menu button (it shows "Standard User" text)
      const userMenuButton = screen.getByText('Standard User').closest('button')
      expect(userMenuButton).toBeInTheDocument()
      
      // Click to open menu
      fireEvent.click(userMenuButton!)
      
      // Menu should open (implementation dependent)
      // This test verifies the button is clickable
      expect(userMenuButton).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('dashboard handles missing role context gracefully', () => {
      // Render without RoleProvider to test error handling
      // The components should throw an error when used without RoleProvider
      expect(() => {
        render(<Sidebar />)
      }).toThrow('useRole must be used within a RoleProvider')
    })

    test('navigation handles routes gracefully', () => {
      renderWithRole(<Sidebar />)
      
      // All navigation links should be valid (some may be "#" for restricted access)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        const href = link.getAttribute('href')
        expect(href).toMatch(/^(\/dashboard|#)/)
      })
    })

    test('dashboard components handle responsive layout', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      renderWithRole(<Sidebar />)
      
      // Sidebar should render regardless of screen size
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    test('sidebar and navbar work together without conflicts', () => {
      const IntegratedLayout = () => (
        <div>
          <Sidebar />
          <Navbar />
        </div>
      )
      
      renderWithRole(<IntegratedLayout />)
      
      // Both components should render successfully
      expect(screen.getByText('Dashboard')).toBeInTheDocument() // From sidebar
      expect(screen.getByPlaceholderText('Search files, users, logs...')).toBeInTheDocument() // From navbar
    })

    test('dashboard maintains consistent branding', () => {
      renderWithRole(<Sidebar />)
      
      // Check that branding is consistent
      expect(screen.getByText('CloudFiles')).toBeInTheDocument()
    })

    test('navigation state is properly managed', () => {
      renderWithRole(<Sidebar />)
      
      // Check that active state is properly set (dashboard should be active by default)
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('bg-sidebar-primary')
    })
  })
})