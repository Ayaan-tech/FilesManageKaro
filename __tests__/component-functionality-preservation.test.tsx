/**
 * Component Functionality Preservation Property Tests
 * **Feature: dashboard-integration, Property 1: Component functionality preservation**
 * **Validates: Requirements 1.2**
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

describe('Component Functionality Preservation Properties', () => {
  describe('Button Component', () => {
    test('Button renders with consistent className generation', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('default'),
          fc.constant('destructive'),
          fc.constant('outline'),
          fc.constant('secondary'),
          fc.constant('ghost'),
          fc.constant('link')
        ),
        fc.oneof(
          fc.constant('default'),
          fc.constant('sm'),
          fc.constant('lg'),
          fc.constant('icon'),
          fc.constant('icon-sm'),
          fc.constant('icon-lg')
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        (variant, size, children, customClassName) => {
          const { container: container1 } = render(
            <Button variant={variant as any} size={size as any} className={customClassName}>
              {children}
            </Button>
          )
          
          const { container: container2 } = render(
            <Button variant={variant as any} size={size as any} className={customClassName}>
              {children}
            </Button>
          )
          
          // Both renders should produce identical DOM structure
          expect(container1.innerHTML).toBe(container2.innerHTML)
          
          // Button should have data-slot attribute
          const button1 = container1.querySelector('button')
          const button2 = container2.querySelector('button')
          
          expect(button1?.getAttribute('data-slot')).toBe('button')
          expect(button2?.getAttribute('data-slot')).toBe('button')
          
          // Class names should be identical
          expect(button1?.className).toBe(button2?.className)
        }
      ), { numRuns: 100 })
    })

    test('Button asChild prop preserves functionality', () => {
      fc.assert(fc.property(
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (asChild, children) => {
          const { container } = render(
            <Button asChild={asChild}>
              {asChild ? <a href="#">{children}</a> : children}
            </Button>
          )
          
          if (asChild) {
            // Should render as anchor tag when asChild is true
            expect(container.querySelector('a')).toBeInTheDocument()
            expect(container.querySelector('button')).not.toBeInTheDocument()
          } else {
            // Should render as button when asChild is false
            expect(container.querySelector('button')).toBeInTheDocument()
            expect(container.querySelector('a')).not.toBeInTheDocument()
          }
          
          // Should always have data-slot attribute
          const element = container.firstElementChild
          expect(element?.getAttribute('data-slot')).toBe('button')
        }
      ), { numRuns: 100 })
    })
  })

  describe('Card Component', () => {
    test('Card components render with consistent structure', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        (title, description, content) => {
          const { container: container1 } = render(
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                {content}
              </CardContent>
            </Card>
          )
          
          const { container: container2 } = render(
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                {content}
              </CardContent>
            </Card>
          )
          
          // Both renders should produce identical DOM structure
          expect(container1.innerHTML).toBe(container2.innerHTML)
          
          // All card components should have proper data-slot attributes
          expect(container1.querySelector('[data-slot="card"]')).toBeInTheDocument()
          expect(container1.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
          expect(container1.querySelector('[data-slot="card-title"]')).toBeInTheDocument()
          expect(container1.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
          
          // Content should be preserved (check that both title and content are present)
          expect(container1.textContent).toContain(title.trim())
          expect(container1.textContent).toContain(content.trim())
          
          // Title and content should be in their respective elements
          const titleElement = container1.querySelector('[data-slot="card-title"]')
          const contentElement = container1.querySelector('[data-slot="card-content"]')
          
          expect(titleElement?.textContent?.trim()).toBe(title.trim())
          expect(contentElement?.textContent?.trim()).toBe(content.trim())
        }
      ), { numRuns: 100 })
    })
  })

  describe('Input Component', () => {
    test('Input renders with consistent attributes and styling', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant('text'),
          fc.constant('email'),
          fc.constant('password'),
          fc.constant('number'),
          fc.constant('tel'),
          fc.constant('url')
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        (type, placeholder, customClassName) => {
          const { container: container1 } = render(
            <Input 
              type={type} 
              placeholder={placeholder} 
              className={customClassName}
            />
          )
          
          const { container: container2 } = render(
            <Input 
              type={type} 
              placeholder={placeholder} 
              className={customClassName}
            />
          )
          
          // Both renders should produce identical DOM structure
          expect(container1.innerHTML).toBe(container2.innerHTML)
          
          const input1 = container1.querySelector('input')
          const input2 = container2.querySelector('input')
          
          // Should have data-slot attribute
          expect(input1?.getAttribute('data-slot')).toBe('input')
          expect(input2?.getAttribute('data-slot')).toBe('input')
          
          // Type should be preserved
          expect(input1?.getAttribute('type')).toBe(type)
          expect(input2?.getAttribute('type')).toBe(type)
          
          // Placeholder should be preserved if provided
          if (placeholder) {
            expect(input1?.getAttribute('placeholder')).toBe(placeholder)
            expect(input2?.getAttribute('placeholder')).toBe(placeholder)
          }
          
          // Class names should be identical
          expect(input1?.className).toBe(input2?.className)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Utility Function Preservation', () => {
    test('cn utility function produces consistent results', () => {
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        (classNames, additionalClass) => {
          const args = additionalClass ? [...classNames, additionalClass] : classNames
          
          const result1 = cn(...args)
          const result2 = cn(...args)
          
          // Should produce identical results for identical inputs
          expect(result1).toBe(result2)
          
          // Result should be a string
          expect(typeof result1).toBe('string')
          expect(typeof result2).toBe('string')
        }
      ), { numRuns: 100 })
    })
  })
})