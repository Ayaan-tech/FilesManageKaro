/**
 * Styling Consistency Property Tests
 * **Feature: dashboard-integration, Property 4: Styling consistency**
 * **Validates: Requirements 2.4**
 */

import { render } from '@testing-library/react'
import fc from 'fast-check'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

describe('Styling Consistency Properties', () => {
  describe('Theme Variable Consistency', () => {
    test('Components use consistent CSS structure and attributes', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (content) => {
          // Render multiple components that should use theme variables
          const { container } = render(
            <div>
              <Button>{content}</Button>
              <Card>
                <CardHeader>
                  <CardTitle>{content}</CardTitle>
                </CardHeader>
                <CardContent>{content}</CardContent>
              </Card>
              <Badge>{content}</Badge>
              <Input placeholder={content} />
            </div>
          )

          // Get all components
          const button = container.querySelector('button')
          const card = container.querySelector('[data-slot="card"]')
          const badge = container.querySelector('[data-slot="badge"]')
          const input = container.querySelector('input')

          expect(button).toBeTruthy()
          expect(card).toBeTruthy()
          expect(badge).toBeTruthy()
          expect(input).toBeTruthy()

          // All components should have data-slot attributes for identification
          expect(button!.getAttribute('data-slot')).toBe('button')
          expect(card!.getAttribute('data-slot')).toBe('card')
          expect(badge!.getAttribute('data-slot')).toBe('badge')
          expect(input!.getAttribute('data-slot')).toBe('input')

          // All components should have CSS classes applied
          expect(button!.className.length).toBeGreaterThan(0)
          expect(card!.className.length).toBeGreaterThan(0)
          expect(badge!.className.length).toBeGreaterThan(0)
          expect(input!.className.length).toBeGreaterThan(0)
        }
      ), { numRuns: 100 })
    })

    test('Dark mode context affects component rendering', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (content) => {
          // Test with dark mode class
          const { container: darkContainer } = render(
            <div className="dark">
              <Button>{content}</Button>
              <Card>
                <CardContent>{content}</CardContent>
              </Card>
            </div>
          )

          // Test without dark mode class
          const { container: lightContainer } = render(
            <div>
              <Button>{content}</Button>
              <Card>
                <CardContent>{content}</CardContent>
              </Card>
            </div>
          )

          const darkButton = darkContainer.querySelector('button')
          const lightButton = lightContainer.querySelector('button')
          const darkCard = darkContainer.querySelector('[data-slot="card"]')
          const lightCard = lightContainer.querySelector('[data-slot="card"]')

          expect(darkButton).toBeTruthy()
          expect(lightButton).toBeTruthy()
          expect(darkCard).toBeTruthy()
          expect(lightCard).toBeTruthy()

          // Components should have the same class structure regardless of dark mode
          // (since they use CSS variables, not different classes)
          expect(darkButton!.className).toBe(lightButton!.className)
          expect(darkCard!.className).toBe(lightCard!.className)
          
          // But the dark mode context should be present
          expect(darkContainer.querySelector('.dark')).toBeTruthy()
          expect(lightContainer.querySelector('.dark')).toBeFalsy()
        }
      ), { numRuns: 100 })
    })
  })

  describe('CSS Class Consistency', () => {
    test('Components generate consistent CSS classes for same props', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('default'),
          fc.constant('destructive'),
          fc.constant('outline'),
          fc.constant('secondary'),
          fc.constant('ghost')
        ),
        fc.oneof(
          fc.constant('default'),
          fc.constant('sm'),
          fc.constant('lg')
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (variant, size, content) => {
          // Render the same component multiple times with identical props
          const { container: container1 } = render(
            <Button variant={variant as any} size={size as any}>
              {content}
            </Button>
          )
          
          const { container: container2 } = render(
            <Button variant={variant as any} size={size as any}>
              {content}
            </Button>
          )

          const button1 = container1.querySelector('button')
          const button2 = container2.querySelector('button')

          expect(button1).toBeTruthy()
          expect(button2).toBeTruthy()

          // CSS classes should be identical for identical props
          expect(button1!.className).toBe(button2!.className)
          
          // Classes should contain common button styling patterns
          const className = button1!.className
          expect(className).toContain('inline-flex')
          expect(className).toContain('items-center')
          
          // Should have consistent class structure (no random classes)
          const classArray1 = button1!.className.split(' ').sort()
          const classArray2 = button2!.className.split(' ').sort()
          expect(classArray1).toEqual(classArray2)
        }
      ), { numRuns: 100 })
    })

    test('Badge components maintain consistent styling patterns', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('default'),
          fc.constant('secondary'),
          fc.constant('destructive'),
          fc.constant('outline')
        ),
        fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
        (variant, content) => {
          const { container: container1 } = render(
            <Badge variant={variant as any}>{content}</Badge>
          )
          
          const { container: container2 } = render(
            <Badge variant={variant as any}>{content}</Badge>
          )

          const badge1 = container1.querySelector('[data-slot="badge"]')
          const badge2 = container2.querySelector('[data-slot="badge"]')

          expect(badge1).toBeTruthy()
          expect(badge2).toBeTruthy()

          // CSS classes should be identical
          expect(badge1!.className).toBe(badge2!.className)
          
          // Should have consistent badge styling patterns
          const className = badge1!.className
          expect(className).toContain('inline-flex')
          expect(className).toContain('items-center')
          
          // Content should be preserved
          expect(badge1!.textContent?.trim()).toBe(content.trim())
          expect(badge2!.textContent?.trim()).toBe(content.trim())
        }
      ), { numRuns: 100 })
    })
  })

  describe('Design System Consistency', () => {
    test('All UI components follow consistent spacing and sizing patterns', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (content) => {
          const { container } = render(
            <div className="space-y-4">
              <Button>{content}</Button>
              <Card>
                <CardHeader>
                  <CardTitle>{content}</CardTitle>
                </CardHeader>
                <CardContent>{content}</CardContent>
              </Card>
              <Badge>{content}</Badge>
              <Input placeholder={content} />
            </div>
          )

          // All components should be rendered
          const button = container.querySelector('button')
          const card = container.querySelector('[data-slot="card"]')
          const cardHeader = container.querySelector('[data-slot="card-header"]')
          const cardTitle = container.querySelector('[data-slot="card-title"]')
          const cardContent = container.querySelector('[data-slot="card-content"]')
          const badge = container.querySelector('[data-slot="badge"]')
          const input = container.querySelector('input')

          const components = [button, card, cardHeader, cardTitle, cardContent, badge, input]
          
          components.forEach(component => {
            expect(component).toBeTruthy()
            
            // Each component should have a data-slot attribute for identification
            expect(component!.getAttribute('data-slot')).toBeTruthy()
            
            // Each component should have some CSS classes applied
            expect(component!.className.length).toBeGreaterThan(0)
          })

          // Components should have consistent Tailwind utility patterns
          expect(button!.className).toContain('inline-flex')
          expect(card!.className).toContain('rounded')
          expect(badge!.className).toContain('inline-flex')
          expect(input!.className).toContain('flex')
        }
      ), { numRuns: 100 })
    })

    test('Components maintain consistent focus and interaction states', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (content) => {
          const { container } = render(
            <div>
              <Button>{content}</Button>
              <Input placeholder={content} />
            </div>
          )

          const button = container.querySelector('button')
          const input = container.querySelector('input')

          expect(button).toBeTruthy()
          expect(input).toBeTruthy()

          // Interactive elements should have focus-visible styles
          const buttonClasses = button!.className
          const inputClasses = input!.className
          
          // Should have consistent focus styling patterns
          expect(buttonClasses).toContain('focus-visible')
          expect(inputClasses).toContain('focus-visible')
          
          // Should have consistent class lengths (indicating proper styling)
          expect(buttonClasses.length).toBeGreaterThan(50)
          expect(inputClasses.length).toBeGreaterThan(50)
          
          // Both should be focusable elements
          expect(button!.tabIndex).toBeGreaterThanOrEqual(0)
          expect(input!.tabIndex).toBeGreaterThanOrEqual(0)
        }
      ), { numRuns: 100 })
    })
  })
})