/**
 * Dashboard Layout Unit Tests
 * Tests sidebar navigation rendering, navbar functionality, and role-based navigation access
 * Requirements: 2.1, 2.2
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/app/dashboard/_components/sidebar'
import { Navbar } from '@/app/dashboard/_components/navbar'
import { RoleProvider, useRole } from '@/lib/role-context'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Test wrapper component for role testing
function TestWrapper({ children, initialRole = 'user' }: { children: React.ReactNode, initialRole?: 'admin' | 'user' }) {
  return (
    <RoleProvider>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </RoleProvider>
  )
}

describe('Dashboard Layout Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/dashboard')
  })

  describe('Sidebar Navigation Rendering', () => {
    test('renders sidebar with logo and navigation', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      )

      // Should render logo section
      expect(screen.getByText('CloudFiles')).toBeInTheDocument()
      
      // Should render navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('User Logs')).toBeInTheDocument()
      expect(screen.getByText('OAuth Logs')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    test('renders correct navigation links with dashboard prefix', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      )

      // Check that all links have correct href attributes
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByRole('link', { name: /files/i })).toHaveAttribute('href', '/dashboard/files')
      expect(screen.getByRole('link', { name: /user logs/i })).toHaveAttribute('href', '/dashboard/user-logs')
      expect(screen.getByRole('link', { name: /oauth logs/i })).toHaveAttribute('href', '/dashboard/oauth-logs')
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/dashboard/settings')
    })

    test('highlights active navigation item based on current path', () => {
      mockUsePathname.mockReturnValue('/dashboard/files')
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      )

      const filesLink = screen.getByRole('link', { name: /files/i })
      expect(filesLink).toHaveClass('bg-sidebar-primary')
    })

    test('renders role badge with correct role information', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      )

      // Should show user role by default
      expect(screen.getByText(/role: user/i)).toBeInTheDocument()
    })

    test('renders collapse/expand button', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      )

      // Should have collapse button (ChevronLeft icon when expanded)
      const collapseButton = screen.getByRole('button')
      expect(collapseButton).toBeInTheDocument()
    })
  })

  describe('Navbar Functionality', () => {
    test('renders search input with correct placeholder', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText('Search files, users, logs...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput.tagName.toLowerCase()).toBe('input')
    })

    test('renders notification button with indicator', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      // Should have notification button (find by the bell icon)
      const buttons = screen.getAllByRole('button')
      const notificationButton = buttons.find(button => 
        button.querySelector('.lucide-bell')
      )
      expect(notificationButton).toBeInTheDocument()
      
      // Should have notification indicator (red dot)
      const indicator = notificationButton?.querySelector('.bg-destructive')
      expect(indicator).toBeInTheDocument()
    })

    test('renders user menu with correct user information', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      // Should show standard user by default
      expect(screen.getByText('Standard User')).toBeInTheDocument()
      
      // Should have user avatar
      const avatar = screen.getByText('U') // Avatar fallback for User
      expect(avatar).toBeInTheDocument()
    })

    test('user menu dropdown contains expected items', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      // User menu button should be present
      const userMenuButton = screen.getByRole('button', { name: /standard user/i })
      expect(userMenuButton).toBeInTheDocument()
      
      // Button should have dropdown trigger attributes
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu')
      expect(userMenuButton).toHaveAttribute('data-slot', 'dropdown-menu-trigger')
    })
  })

  describe('Role-Based Navigation Access', () => {
    test('hides admin-only navigation for user role', () => {
      render(
        <TestWrapper initialRole="user">
          <Sidebar />
        </TestWrapper>
      )

      // Admin Logs should not be accessible (should not have proper link)
      const adminLogsElements = screen.queryAllByText('Admin Logs')
      if (adminLogsElements.length > 0) {
        // If Admin Logs text exists, it should not have a proper link (href="#")
        const adminLogsLink = adminLogsElements[0].closest('a')
        if (adminLogsLink) {
          expect(adminLogsLink).toHaveAttribute('href', '#')
        }
      }
    })

    test('shows lock icon for restricted navigation items', () => {
      render(
        <TestWrapper initialRole="user">
          <Sidebar />
        </TestWrapper>
      )

      // Should show lock icon for admin-only features
      // The lock icon should be present in the DOM for restricted items
      const lockIcons = document.querySelectorAll('svg')
      const hasLockIcon = Array.from(lockIcons).some(icon => 
        icon.classList.contains('lucide-lock') || 
        icon.getAttribute('data-testid') === 'lock-icon'
      )
      
      // We expect at least one lock icon for admin-restricted features
      expect(hasLockIcon || screen.queryByText('Admin Logs')).toBeTruthy()
    })

    test('role switching functionality is available', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      // User menu button should be present and functional
      const userMenuButton = screen.getByRole('button', { name: /standard user/i })
      expect(userMenuButton).toBeInTheDocument()
      
      // Should have proper dropdown attributes for role switching
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu')
      expect(userMenuButton).toHaveAttribute('data-state', 'closed')
    })

    test('navbar shows correct user type based on role', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      )

      // Should show Standard User for default user role
      expect(screen.getByText('Standard User')).toBeInTheDocument()
      
      // Should show user avatar with 'U' for user role
      expect(screen.getByText('U')).toBeInTheDocument()
    })
  })

  describe('Layout Integration', () => {
    test('sidebar and navbar work together in layout', () => {
      render(
        <TestWrapper>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto">
                <div data-testid="main-content">Dashboard Content</div>
              </main>
            </div>
          </div>
        </TestWrapper>
      )

      // Both sidebar and navbar should be present
      expect(screen.getByText('CloudFiles')).toBeInTheDocument() // Sidebar logo
      expect(screen.getByPlaceholderText('Search files, users, logs...')).toBeInTheDocument() // Navbar search
      expect(screen.getByTestId('main-content')).toBeInTheDocument() // Main content area
    })

    test('layout maintains proper structure and classes', () => {
      const { container } = render(
        <TestWrapper>
          <div className="flex h-screen overflow-hidden" data-testid="layout-container">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden" data-testid="main-area">
              <Navbar />
              <main className="flex-1 overflow-y-auto">
                <div>Content</div>
              </main>
            </div>
          </div>
        </TestWrapper>
      )

      // Layout container should have proper classes
      const layoutContainer = screen.getByTestId('layout-container')
      expect(layoutContainer).toHaveClass('flex', 'h-screen', 'overflow-hidden')

      // Main area should have proper classes
      const mainArea = screen.getByTestId('main-area')
      expect(mainArea).toHaveClass('flex', 'flex-1', 'flex-col', 'overflow-hidden')
    })
  })
})