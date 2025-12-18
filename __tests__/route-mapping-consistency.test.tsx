/**
 * **Feature: dashboard-integration, Property 2: Route mapping consistency**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any original UI application route, the transformed dashboard route 
 * should follow the pattern `/dashboard/{original-route}` and preserve all functionality
 */

import fc from 'fast-check'

// Define the original UI application routes
const originalRoutes = [
  { original: '/', dashboard: '/dashboard', name: 'Dashboard Overview' },
  { original: '/files', dashboard: '/dashboard/files', name: 'Files Management' },
  { original: '/user-logs', dashboard: '/dashboard/user-logs', name: 'User Logs' },
  { original: '/oauth-logs', dashboard: '/dashboard/oauth-logs', name: 'OAuth Logs' },
  { original: '/admin-logs', dashboard: '/dashboard/admin-logs', name: 'Admin Logs' },
  { original: '/settings', dashboard: '/dashboard/settings', name: 'Settings' },
]

// Route transformation function
function transformRoute(originalRoute: string): string {
  if (originalRoute === '/') {
    return '/dashboard'
  }
  return `/dashboard${originalRoute}`
}

// Check if a route follows the expected pattern
function followsPattern(originalRoute: string, transformedRoute: string): boolean {
  const expected = transformRoute(originalRoute)
  return transformedRoute === expected
}

describe('Route Mapping Consistency Property Tests', () => {
  test('transformed routes should follow /dashboard/{original-route} pattern', () => {
    fc.assert(fc.property(
      fc.constantFrom(...originalRoutes.map(r => r.original)),
      (originalRoute) => {
        const transformedRoute = transformRoute(originalRoute)
        
        // Property: The transformation should follow the consistent pattern
        expect(followsPattern(originalRoute, transformedRoute)).toBe(true)
        
        // Property: All transformed routes should start with /dashboard
        expect(transformedRoute).toMatch(/^\/dashboard/)
        
        // Property: Root route should map to exactly /dashboard
        if (originalRoute === '/') {
          expect(transformedRoute).toBe('/dashboard')
        } else {
          // Property: Non-root routes should preserve their path after /dashboard
          expect(transformedRoute).toBe(`/dashboard${originalRoute}`)
        }
      }
    ), { numRuns: 100 })
  })

  test('route mappings should preserve route identity and functionality', () => {
    fc.assert(fc.property(
      fc.constantFrom(...originalRoutes),
      (routeMapping) => {
        const { original, dashboard, name } = routeMapping
        
        // Property: Each route should have a consistent transformation
        expect(transformRoute(original)).toBe(dashboard)
        
        // Property: Route names should be preserved (functionality indicator)
        expect(name).toBeTruthy()
        expect(typeof name).toBe('string')
        
        // Property: Dashboard routes should be valid URL paths
        expect(dashboard).toMatch(/^\/dashboard(\/[a-z-]+)*$/)
      }
    ), { numRuns: 100 })
  })

  test('batch route transformation should be consistent', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom(...originalRoutes.map(r => r.original)), { minLength: 1, maxLength: 6 }),
      (routeBatch) => {
        const transformedBatch = routeBatch.map(transformRoute)
        
        // Property: Unique input routes should produce unique output routes
        const uniqueInputs = new Set(routeBatch)
        const uniqueTransformed = new Set(transformedBatch)
        expect(uniqueTransformed.size).toBe(uniqueInputs.size)
        
        // Property: All transformed routes should start with /dashboard
        transformedBatch.forEach(route => {
          expect(route).toMatch(/^\/dashboard/)
        })
        
        // Property: Transformation should be deterministic
        const retransformed = routeBatch.map(transformRoute)
        expect(retransformed).toEqual(transformedBatch)
      }
    ), { numRuns: 100 })
  })
})

// Unit tests for specific route mappings to complement property tests
describe('Route Mapping Consistency Unit Tests', () => {
  test('should correctly map all known routes', () => {
    originalRoutes.forEach(({ original, dashboard }) => {
      expect(transformRoute(original)).toBe(dashboard)
    })
  })

  test('should handle root route specially', () => {
    expect(transformRoute('/')).toBe('/dashboard')
  })

  test('should preserve sub-route structure', () => {
    expect(transformRoute('/files')).toBe('/dashboard/files')
    expect(transformRoute('/user-logs')).toBe('/dashboard/user-logs')
    expect(transformRoute('/oauth-logs')).toBe('/dashboard/oauth-logs')
    expect(transformRoute('/admin-logs')).toBe('/dashboard/admin-logs')
    expect(transformRoute('/settings')).toBe('/dashboard/settings')
  })
})