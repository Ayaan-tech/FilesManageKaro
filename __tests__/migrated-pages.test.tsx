/**
 * Unit tests for migrated dashboard pages
 * **Validates: Requirements 2.3**
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

// Mock date-fns to avoid date formatting issues
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2024-02-12'),
}))

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock role context
let mockRole: 'admin' | 'user' = 'admin'
jest.mock('@/lib/role-context', () => ({
  useRole: () => ({
    role: mockRole,
    setRole: (role: 'admin' | 'user') => { mockRole = role },
    canAccess: (feature: string) => {
      if (mockRole === "admin") return true
      const userAccessibleFeatures = ["dashboard", "files", "user-logs", "oauth-logs", "settings"]
      return userAccessibleFeatures.includes(feature)
    }
  }),
  RoleProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Import pages after mocking
import DashboardPage from '@/app/dashboard/page'
import FilesPage from '@/app/dashboard/files/page'
import UserLogsPage from '@/app/dashboard/user-logs/page'
import OAuthLogsPage from '@/app/dashboard/oauth-logs/page'
import AdminLogsPage from '@/app/dashboard/admin-logs/page'
import SettingsPage from '@/app/dashboard/settings/page'

// Helper to render with role context
const renderWithRole = (component: React.ReactElement, role: 'admin' | 'user' = 'admin') => {
  mockRole = role
  return render(component)
}

describe('Migrated Dashboard Pages', () => {
  describe('Dashboard Overview Page', () => {
    test('should render dashboard overview page', () => {
      renderWithRole(<DashboardPage />)
      
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
      expect(screen.getByText('Monitor your cloud storage activity and performance metrics')).toBeInTheDocument()
      
      // Check for KPI cards
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('Files Stored')).toBeInTheDocument()
      expect(screen.getByText('Active Sessions')).toBeInTheDocument()
      expect(screen.getByText('Failed OAuth')).toBeInTheDocument()
      
      // Check for charts (multiple responsive containers)
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
    })

    test('should display different values for admin vs user role', () => {
      // Test admin view
      renderWithRole(<DashboardPage />, 'admin')
      expect(screen.getByText('1,247')).toBeInTheDocument() // Admin value for users
      
      // Test user view
      renderWithRole(<DashboardPage />, 'user')
      expect(screen.getByText('—')).toBeInTheDocument() // User value for users (hidden)
    })
  })

  describe('Files Page', () => {
    test('should render files page functionality', () => {
      renderWithRole(<FilesPage />)
      
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('Manage and organize your cloud storage files')).toBeInTheDocument()
      
      // Check for upload button
      expect(screen.getByText('Upload File')).toBeInTheDocument()
      
      // Check for view toggle buttons (they don't have accessible names, just check they exist)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for table headers
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Size')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    test('should show owner column for admin users', () => {
      renderWithRole(<FilesPage />, 'admin')
      // Check if Owner column exists in table header
      const ownerHeaders = screen.queryAllByText('Owner')
      expect(ownerHeaders.length).toBeGreaterThan(0)
    })

    test('should hide owner column for regular users', () => {
      renderWithRole(<FilesPage />, 'user')
      expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    })
  })

  describe('User Logs Page', () => {
    test('should render user logs page rendering', () => {
      renderWithRole(<UserLogsPage />)
      
      expect(screen.getByText('User Logs')).toBeInTheDocument()
      expect(screen.getByText('Track all user file activity and interactions')).toBeInTheDocument()
      
      // Check for table headers
      expect(screen.getByText('User ID')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('File Name')).toBeInTheDocument()
      expect(screen.getByText('IP Address')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      
      // Check for filter controls
      expect(screen.getByText('Select date')).toBeInTheDocument()
      expect(screen.getByText('All actions')).toBeInTheDocument()
    })

    test('should display log entries with proper formatting', () => {
      renderWithRole(<UserLogsPage />)
      
      // Check for sample log entries (use getAllByText for multiple instances)
      expect(screen.getAllByText('USR-1247').length).toBeGreaterThan(0)
      expect(screen.getByText('presentation.pdf')).toBeInTheDocument()
      expect(screen.getAllByText('Upload').length).toBeGreaterThan(0)
    })
  })

  describe('OAuth Logs Page', () => {
    test('should render oauth logs page rendering', () => {
      renderWithRole(<OAuthLogsPage />)
      
      expect(screen.getByText('OAuth Logs')).toBeInTheDocument()
      expect(screen.getByText('Monitor authentication attempts and token activity')).toBeInTheDocument()
      
      // Check for filter controls
      expect(screen.getByText('All providers')).toBeInTheDocument()
      expect(screen.getByText('All status')).toBeInTheDocument()
      
      // Check for OAuth log entries (multiple instances)
      expect(screen.getAllByText('Google OAuth').length).toBeGreaterThan(0)
      expect(screen.getAllByText('admin@cloudfiles.io').length).toBeGreaterThan(0)
    })

    test('should display success and failed OAuth attempts', () => {
      renderWithRole(<OAuthLogsPage />)
      
      expect(screen.getAllByText('Success').length).toBeGreaterThan(0)
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  describe('Admin Logs Page', () => {
    test('should render admin logs for admin users', () => {
      renderWithRole(<AdminLogsPage />, 'admin')
      
      expect(screen.getByText('Admin Logs')).toBeInTheDocument()
      expect(screen.getByText('Audit trail of administrative actions and system changes')).toBeInTheDocument()
      
      // Check for filter controls
      expect(screen.getByText('All severity')).toBeInTheDocument()
      expect(screen.getByText('All actions')).toBeInTheDocument()
      
      // Check for admin log entries
      expect(screen.getByText('Role Change')).toBeInTheDocument()
      expect(screen.getAllByText('Critical').length).toBeGreaterThan(0)
    })

    test('should show access denied for non-admin users', () => {
      renderWithRole(<AdminLogsPage />, 'user')
      
      expect(screen.getByText('Admin Access Required')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to view this page. Please contact your administrator.")).toBeInTheDocument()
    })
  })

  describe('Settings Page', () => {
    test('should render settings page functionality', () => {
      renderWithRole(<SettingsPage />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Manage your account and application preferences')).toBeInTheDocument()
      
      // Check for profile settings section
      expect(screen.getByText('Profile Settings')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      
      // Check for security settings section
      expect(screen.getByText('Security Settings')).toBeInTheDocument()
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
      
      // Check for storage settings section
      expect(screen.getByText('Storage Settings')).toBeInTheDocument()
      expect(screen.getByText('Storage Usage')).toBeInTheDocument()
      
      // Check for notification settings section
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    })

    test('should have functional form elements', () => {
      renderWithRole(<SettingsPage />)
      
      // Check for input fields
      const nameInput = screen.getByDisplayValue('Admin User')
      const emailInput = screen.getByDisplayValue('admin@cloudfiles.io')
      
      expect(nameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      
      // Check for buttons
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Update Password')).toBeInTheDocument()
    })
  })
})