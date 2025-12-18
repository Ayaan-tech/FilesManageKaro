/**
 * Dependency Compatibility Tests
 * Tests that all UI components work with merged dependencies
 * Requirements: 4.3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Test core UI dependencies are available and working
describe('Dependency Compatibility', () => {
  describe('Core React Dependencies', () => {
    test('React and ReactDOM versions are compatible', () => {
      const React = require('react')
      const ReactDOM = require('react-dom/client')
      
      // Verify React version is 19.2.0
      expect(React.version).toBe('19.2.0')
      
      // Verify ReactDOM client is available (React 18+ API)
      expect(ReactDOM).toBeDefined()
      expect(ReactDOM.createRoot).toBeDefined()
    })

    test('Next.js version is updated correctly', () => {
      const nextPackage = require('next/package.json')
      expect(nextPackage.version).toBe('16.0.10')
    })
  })

  describe('Radix UI Components', () => {
    test('Radix UI slot component works with merged dependencies', () => {
      const { Slot } = require('@radix-ui/react-slot')
      
      const TestComponent = () => (
        <Slot>
          <button>Test Button</button>
        </Slot>
      )

      render(<TestComponent />)
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    test('Radix UI dialog component is available', () => {
      const Dialog = require('@radix-ui/react-dialog')
      
      expect(Dialog.Root).toBeDefined()
      expect(Dialog.Trigger).toBeDefined()
      expect(Dialog.Content).toBeDefined()
    })

    test('Radix UI accordion component is available', () => {
      const Accordion = require('@radix-ui/react-accordion')
      
      expect(Accordion.Root).toBeDefined()
      expect(Accordion.Item).toBeDefined()
      expect(Accordion.Trigger).toBeDefined()
    })
  })

  describe('UI Library Dependencies', () => {
    test('Lucide React icons are available', () => {
      const { Home, User, Settings } = require('lucide-react')
      
      expect(Home).toBeDefined()
      expect(User).toBeDefined()
      expect(Settings).toBeDefined()
    })

    test('Class Variance Authority is working', () => {
      const { cva } = require('class-variance-authority')
      
      const buttonVariants = cva('base-class', {
        variants: {
          variant: {
            default: 'default-class',
            secondary: 'secondary-class'
          }
        }
      })

      expect(buttonVariants()).toBe('base-class')
      expect(buttonVariants({ variant: 'default' })).toBe('base-class default-class')
    })

    test('Tailwind Merge is working', () => {
      const { twMerge } = require('tailwind-merge')
      
      const result = twMerge('px-2 py-1 bg-red hover:bg-dark-red', 'p-3 bg-[#B91C1C]')
      expect(result).toBe('hover:bg-dark-red p-3 bg-[#B91C1C]')
    })

    test('CLSX utility is working', () => {
      const clsx = require('clsx')
      
      const result = clsx('foo', { bar: true, baz: false }, 'qux')
      expect(result).toBe('foo bar qux')
    })
  })

  describe('Form and Validation Dependencies', () => {
    test('React Hook Form is available', () => {
      const { useForm } = require('react-hook-form')
      expect(useForm).toBeDefined()
    })

    test('Zod validation is available', () => {
      const { z } = require('zod')
      
      const schema = z.string().min(1)
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse('')).toThrow()
    })

    test('Hookform resolvers are available', () => {
      const { zodResolver } = require('@hookform/resolvers/zod')
      expect(zodResolver).toBeDefined()
    })
  })

  describe('Chart and Data Visualization', () => {
    test('Recharts is available', () => {
      const { LineChart, BarChart, PieChart } = require('recharts')
      
      expect(LineChart).toBeDefined()
      expect(BarChart).toBeDefined()
      expect(PieChart).toBeDefined()
    })

    test('Date-fns is available', () => {
      const { format, parseISO } = require('date-fns')
      
      expect(format).toBeDefined()
      expect(parseISO).toBeDefined()
      
      const date = new Date('2023-01-01')
      expect(format(date, 'yyyy-MM-dd')).toBe('2023-01-01')
    })
  })

  describe('Theme and Styling Dependencies', () => {
    test('Next Themes is available', () => {
      const { ThemeProvider, useTheme } = require('next-themes')
      
      expect(ThemeProvider).toBeDefined()
      expect(useTheme).toBeDefined()
    })

    test('Tailwind CSS Animate is available', () => {
      // This is a CSS plugin, so we just verify it's installed
      const tailwindAnimate = require('tailwindcss-animate')
      expect(tailwindAnimate).toBeDefined()
    })
  })

  describe('Additional UI Components', () => {
    test('Sonner toast library is available', () => {
      const { toast, Toaster } = require('sonner')
      
      expect(toast).toBeDefined()
      expect(Toaster).toBeDefined()
    })

    test('CMDK command palette is available', () => {
      const { Command } = require('cmdk')
      expect(Command).toBeDefined()
    })

    test('Vaul drawer component is available', () => {
      const { Drawer } = require('vaul')
      expect(Drawer).toBeDefined()
    })

    test('Input OTP component is available', () => {
      const { OTPInput } = require('input-otp')
      expect(OTPInput).toBeDefined()
    })
  })
})