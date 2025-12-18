/**
 * Migrated Utilities Unit Tests
 * Tests role context functionality, merged utility functions, and custom hooks
 * Requirements: 3.4
 */

import React from 'react'
import { render, screen, act, renderHook } from '@testing-library/react'
import { RoleProvider, useRole } from '@/lib/role-context'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast, toast } from '@/hooks/use-toast'

describe('Migrated Utilities', () => {
  describe('Role Context', () => {
    test('RoleProvider provides default user role', () => {
      const TestComponent = () => {
        const { role } = useRole()
        return <div data-testid="role">{role}</div>
      }

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('role')).toHaveTextContent('user')
    })

    test('setRole updates the current role', () => {
      const TestComponent = () => {
        const { role, setRole } = useRole()
        return (
          <div>
            <div data-testid="role">{role}</div>
            <button onClick={() => setRole('admin')} data-testid="set-admin">
              Set Admin
            </button>
          </div>
        )
      }

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('role')).toHaveTextContent('user')
      
      act(() => {
        screen.getByTestId('set-admin').click()
      })

      expect(screen.getByTestId('role')).toHaveTextContent('admin')
    })

    test('canAccess returns true for admin role on all features', () => {
      const TestComponent = () => {
        const { canAccess, setRole } = useRole()
        
        React.useEffect(() => {
          setRole('admin')
        }, [setRole])

        return (
          <div>
            <div data-testid="admin-logs">{canAccess('admin-logs').toString()}</div>
            <div data-testid="files">{canAccess('files').toString()}</div>
            <div data-testid="restricted">{canAccess('restricted-feature').toString()}</div>
          </div>
        )
      }

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('admin-logs')).toHaveTextContent('true')
      expect(screen.getByTestId('files')).toHaveTextContent('true')
      expect(screen.getByTestId('restricted')).toHaveTextContent('true')
    })

    test('canAccess returns correct permissions for user role', () => {
      const TestComponent = () => {
        const { canAccess } = useRole()
        
        return (
          <div>
            <div data-testid="dashboard">{canAccess('dashboard').toString()}</div>
            <div data-testid="files">{canAccess('files').toString()}</div>
            <div data-testid="user-logs">{canAccess('user-logs').toString()}</div>
            <div data-testid="oauth-logs">{canAccess('oauth-logs').toString()}</div>
            <div data-testid="settings">{canAccess('settings').toString()}</div>
            <div data-testid="admin-logs">{canAccess('admin-logs').toString()}</div>
          </div>
        )
      }

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      )

      // User accessible features
      expect(screen.getByTestId('dashboard')).toHaveTextContent('true')
      expect(screen.getByTestId('files')).toHaveTextContent('true')
      expect(screen.getByTestId('user-logs')).toHaveTextContent('true')
      expect(screen.getByTestId('oauth-logs')).toHaveTextContent('true')
      expect(screen.getByTestId('settings')).toHaveTextContent('true')
      
      // Admin-only features
      expect(screen.getByTestId('admin-logs')).toHaveTextContent('false')
    })

    test('useRole throws error when used outside RoleProvider', () => {
      const TestComponent = () => {
        useRole()
        return <div>Test</div>
      }

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useRole must be used within a RoleProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Utility Functions', () => {
    test('cn function merges class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    test('cn function handles conditional classes', () => {
      const result = cn('base-class', { 'conditional-class': true, 'hidden-class': false })
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    test('cn function handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
      expect(result).not.toContain('undefined')
      expect(result).not.toContain('null')
    })

    test('cn function merges Tailwind classes correctly', () => {
      const result = cn('px-2 py-1 bg-red', 'p-3 bg-blue')
      // Should merge conflicting classes, keeping the latter ones
      expect(result).toContain('bg-blue')
      expect(result).toContain('p-3')
      expect(result).not.toContain('px-2')
      expect(result).not.toContain('py-1')
      expect(result).not.toContain('bg-red')
    })
  })

  describe('Custom Hooks', () => {
    describe('useIsMobile', () => {
      // Mock window.matchMedia for testing
      const mockMatchMedia = (matches: boolean) => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(query => ({
            matches,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })),
        })
      }

      test('returns true for mobile viewport', () => {
        mockMatchMedia(true)
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)
      })

      test('returns false for desktop viewport', () => {
        mockMatchMedia(false)
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
      })
    })

    describe('useToast', () => {
      test('useToast hook provides toast functionality', () => {
        const { result } = renderHook(() => useToast())
        
        expect(result.current.toast).toBeDefined()
        expect(result.current.dismiss).toBeDefined()
        expect(result.current.toasts).toBeDefined()
        expect(Array.isArray(result.current.toasts)).toBe(true)
      })

      test('toast function creates a toast', () => {
        const { result } = renderHook(() => useToast())
        
        act(() => {
          result.current.toast({
            title: 'Test Toast',
            description: 'This is a test toast'
          })
        })

        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].title).toBe('Test Toast')
        expect(result.current.toasts[0].description).toBe('This is a test toast')
      })

      test('dismiss function removes toast', () => {
        const { result } = renderHook(() => useToast())
        
        let toastId: string
        
        act(() => {
          const toastResult = result.current.toast({
            title: 'Test Toast'
          })
          toastId = toastResult.id
        })

        expect(result.current.toasts).toHaveLength(1)
        
        act(() => {
          result.current.dismiss(toastId)
        })

        // Toast should be marked as closed but still in array initially
        expect(result.current.toasts[0].open).toBe(false)
      })

      test('toast limit is enforced', () => {
        const { result } = renderHook(() => useToast())
        
        act(() => {
          result.current.toast({ title: 'Toast 1' })
          result.current.toast({ title: 'Toast 2' })
        })

        // Should only keep the most recent toast due to TOAST_LIMIT = 1
        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].title).toBe('Toast 2')
      })
    })
  })
})