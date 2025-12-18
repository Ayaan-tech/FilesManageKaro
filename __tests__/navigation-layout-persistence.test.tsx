/**
 * Navigation Layout Persistence Property Tests
 * **Feature: dashboard-integration, Property 3: Navigation layout persistence**
 * **Validates: Requirements 2.2**
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/app/dashboard/_components/sidebar'
import { Navbar } from '@/app/dashboard/_components/navbar'
import { RoleProvider } from '@/lib/role-context'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation Layout Persistence Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sidebar Component Persistence', () => {
    test('Sidebar renders consistently across all dashboard routes', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/dashboard/files'),
          fc.constant('/dashboard/user-logs'),
          fc.constant('/dashboard/oauth-logs'),
          fc.constant('/dashboard/admin-logs'),
          fc.constant('/dashboard/settings')
        ),
        fc.oneof(
          fc.constant('admin'),
          fc.constant('user')
        ),
        (pathname, role) => {
          mockUsePathname.mockReturnValue(pathname)
          
          const { container: container1 } = render(
            <RoleProvider>
              <Sidebar />
            </RoleProvider>
          )
          
          const { container: container2 } = render(
            <RoleProvider>
              <Sidebar />
            </RoleProvider>
          )
          
          // Both renders should produce identical DOM structure for the same route
          expect(container1.innerHTML).toBe(container2.innerHTML)
          
          // Sidebar should always contain the logo section
          const logoSection1 = container1.querySelector('.flex.h-16.items-center')
          const logoSection2 = container2.querySelector('.flex.h-16.items-center')
          expect(logoSection1).toBeInTheDocument()
          expect(logoSection2).toBeInTheDocument()
          
          // Sidebar should always contain navigation
          const navigation1 = container1.querySelector('nav')
          const navigation2 = container2.querySelector('nav')
          expect(navigation1).toBeInTheDocument()
          expect(navigation2).toBeInTheDocument()
          
          // Sidebar should always contain role badge section
          const roleBadge1 = container1.querySelector('.border-t.border-sidebar-border')
          const roleBadge2 = container2.querySelector('.border-t.border-sidebar-border')
          expect(roleBadge1).toBeInTheDocument()
          expect(roleBadge2).toBeInTheDocument()
          
          // Navigation links should be present
          const navLinks1 = container1.querySelectorAll('a')
          const navLinks2 = container2.querySelectorAll('a')
          expect(navLinks1.length).toBeGreaterThan(0)
          expect(navLinks1.length).toBe(navLinks2.length)
          
          // All navigation links should have proper href attributes with /dashboard prefix
          navLinks1.forEach(link => {
            const href = link.getAttribute('href')
            if (href && href !== '#') {
              expect(href).toMatch(/^\/dashboard/)
            }
          })
        }
      ), { numRuns: 100 })
    })

    test('Sidebar navigation items maintain consistent structure across routes', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/dashboard/files'),
          fc.constant('/dashboard/user-logs'),
          fc.constant('/dashboard/oauth-logs'),
          fc.constant('/dashboard/admin-logs'),
          fc.constant('/dashboard/settings')
        ),
        (pathname) => {
          mockUsePathname.mockReturnValue(pathname)
          
          const { container } = render(
            <RoleProvider>
              <Sidebar />
            </RoleProvider>
          )
          
          // Should have consistent navigation structure
          const navigation = container.querySelector('nav')
          expect(navigation).toBeInTheDocument()
          
          // Each navigation item should have an icon and text (when not collapsed)
          const navItems = container.querySelectorAll('nav > div, nav > .group')
          expect(navItems.length).toBeGreaterThan(0)
          
          // Should have the expected navigation items (excluding admin-only routes for default user role)
          const expectedRoutesForUser = [
            '/dashboard',
            '/dashboard/files', 
            '/dashboard/user-logs',
            '/dashboard/oauth-logs',
            '/dashboard/settings'
          ]
          
          const actualLinks = Array.from(container.querySelectorAll('a'))
            .map(link => link.getAttribute('href'))
            .filter(href => href && href !== '#')
          
          // For default user role, admin-logs should not be accessible
          expectedRoutesForUser.forEach(route => {
            expect(actualLinks).toContain(route)
          })
          
          // Admin-logs should not be accessible for default user role
          expect(actualLinks).not.toContain('/dashboard/admin-logs')
        }
      ), { numRuns: 100 })
    })
  })

  describe('Navbar Component Persistence', () => {
    test('Navbar renders consistently across all dashboard contexts', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('admin'),
          fc.constant('user')
        ),
        (role) => {
          const { container: container1 } = render(
            <RoleProvider>
              <Navbar />
            </RoleProvider>
          )
          
          const { container: container2 } = render(
            <RoleProvider>
              <Navbar />
            </RoleProvider>
          )
          
          // Both renders should have the same structure (ignoring auto-generated IDs)
          // We'll check for consistent elements instead of exact HTML match
          
          // Navbar should always contain search functionality
          const searchInput1 = container1.querySelector('input[placeholder*="Search"]')
          const searchInput2 = container2.querySelector('input[placeholder*="Search"]')
          expect(searchInput1).toBeInTheDocument()
          expect(searchInput2).toBeInTheDocument()
          
          // Navbar should always contain notification button
          const notificationBtn1 = container1.querySelector('button[class*="relative"]')
          const notificationBtn2 = container2.querySelector('button[class*="relative"]')
          expect(notificationBtn1).toBeInTheDocument()
          expect(notificationBtn2).toBeInTheDocument()
          
          // Navbar should always contain user menu (dropdown trigger)
          const userMenu1 = container1.querySelector('[data-slot="dropdown-menu-trigger"]')
          const userMenu2 = container2.querySelector('[data-slot="dropdown-menu-trigger"]')
          expect(userMenu1).toBeInTheDocument()
          expect(userMenu2).toBeInTheDocument()
          
          // Should have consistent height and layout classes
          const navbar1 = container1.querySelector('.flex.h-16')
          const navbar2 = container2.querySelector('.flex.h-16')
          expect(navbar1).toBeInTheDocument()
          expect(navbar2).toBeInTheDocument()
        }
      ), { numRuns: 100 })
    })

    test('Navbar maintains consistent search and user interface elements', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (searchPlaceholder) => {
          const { container } = render(
            <RoleProvider>
              <Navbar />
            </RoleProvider>
          )
          
          // Search section should be present and functional
          const searchContainer = container.querySelector('.relative.w-full.max-w-md')
          expect(searchContainer).toBeInTheDocument()
          
          // Search input should have proper placeholder
          const searchInput = container.querySelector('input')
          expect(searchInput).toBeInTheDocument()
          expect(searchInput?.getAttribute('placeholder')).toContain('Search')
          
          // Search icon should be present
          const searchIcon = container.querySelector('.absolute.left-3')
          expect(searchIcon).toBeInTheDocument()
          
          // Right side controls should be present
          const rightControls = container.querySelector('.flex.items-center.gap-3')
          expect(rightControls).toBeInTheDocument()
          
          // Notification button should have proper structure
          const notificationButton = container.querySelector('button.relative')
          expect(notificationButton).toBeInTheDocument()
          
          // Notification indicator should be present
          const notificationIndicator = container.querySelector('.absolute.right-1\\.5.top-1\\.5')
          expect(notificationIndicator).toBeInTheDocument()
        }
      ), { numRuns: 100 })
    })
  })

  describe('Layout Integration Persistence', () => {
    test('Sidebar and Navbar maintain consistent positioning and structure together', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('/dashboard'),
          fc.constant('/dashboard/files'),
          fc.constant('/dashboard/user-logs'),
          fc.constant('/dashboard/oauth-logs'),
          fc.constant('/dashboard/admin-logs'),
          fc.constant('/dashboard/settings')
        ),
        (pathname) => {
          mockUsePathname.mockReturnValue(pathname)
          
          const { container } = render(
            <RoleProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto">
                    <div>Dashboard Content</div>
                  </main>
                </div>
              </div>
            </RoleProvider>
          )
          
          // Layout container should have proper flex structure
          const layoutContainer = container.querySelector('.flex.h-screen.overflow-hidden')
          expect(layoutContainer).toBeInTheDocument()
          
          // Sidebar should be first child
          const sidebar = layoutContainer?.firstElementChild
          expect(sidebar?.querySelector('nav')).toBeInTheDocument() // Sidebar contains nav
          
          // Main content area should be second child
          const mainArea = layoutContainer?.children[1]
          expect(mainArea?.classList.contains('flex-1')).toBe(true)
          expect(mainArea?.classList.contains('flex-col')).toBe(true)
          
          // Navbar should be first child of main area
          const navbar = mainArea?.firstElementChild
          expect(navbar?.querySelector('input[placeholder*="Search"]')).toBeInTheDocument()
          
          // Main content should be second child of main area
          const mainContent = mainArea?.children[1]
          expect(mainContent?.tagName.toLowerCase()).toBe('main')
          expect(mainContent?.classList.contains('flex-1')).toBe(true)
        }
      ), { numRuns: 100 })
    })
  })
})