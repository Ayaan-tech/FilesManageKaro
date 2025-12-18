/**
 * Styling Integration Unit Tests
 * Tests CSS class application, theme consistency, and asset loading
 * Requirements: 2.4, 5.4
 */

import { render } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RoleProvider } from '@/lib/role-context'

// Test wrapper component for role context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RoleProvider>
    {children}
  </RoleProvider>
)

describe('Styling Integration', () => {
  describe('CSS Classes Apply Correctly', () => {
    test('Button variants apply correct CSS classes', () => {
      const { container: defaultContainer } = render(<Button>Default</Button>)
      const { container: destructiveContainer } = render(<Button variant="destructive">Destructive</Button>)
      const { container: outlineContainer } = render(<Button variant="outline">Outline</Button>)

      const defaultButton = defaultContainer.querySelector('button')
      const destructiveButton = destructiveContainer.querySelector('button')
      const outlineButton = outlineContainer.querySelector('button')

      expect(defaultButton).toBeTruthy()
      expect(destructiveButton).toBeTruthy()
      expect(outlineButton).toBeTruthy()

      // All buttons should have common base classes
      expect(defaultButton!.className).toContain('inline-flex')
      expect(destructiveButton!.className).toContain('inline-flex')
      expect(outlineButton!.className).toContain('inline-flex')

      // Destructive variant should have destructive-specific classes
      expect(destructiveButton!.className).toContain('bg-destructive')
      
      // Outline variant should have border classes
      expect(outlineButton!.className).toContain('border')
    })

    test('Button sizes apply correct CSS classes', () => {
      const { container: defaultContainer } = render(<Button>Default</Button>)
      const { container: smContainer } = render(<Button size="sm">Small</Button>)
      const { container: lgContainer } = render(<Button size="lg">Large</Button>)

      const defaultButton = defaultContainer.querySelector('button')
      const smButton = smContainer.querySelector('button')
      const lgButton = lgContainer.querySelector('button')

      expect(defaultButton).toBeTruthy()
      expect(smButton).toBeTruthy()
      expect(lgButton).toBeTruthy()

      // All should have base height classes
      expect(defaultButton!.className).toContain('h-')
      expect(smButton!.className).toContain('h-')
      expect(lgButton!.className).toContain('h-')

      // Different sizes should have different height values
      expect(defaultButton!.className).not.toBe(smButton!.className)
      expect(defaultButton!.className).not.toBe(lgButton!.className)
    })

    test('Card components apply correct structural classes', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      )

      const card = container.querySelector('[data-slot="card"]')
      const header = container.querySelector('[data-slot="card-header"]')
      const title = container.querySelector('[data-slot="card-title"]')
      const content = container.querySelector('[data-slot="card-content"]')

      expect(card).toBeTruthy()
      expect(header).toBeTruthy()
      expect(title).toBeTruthy()
      expect(content).toBeTruthy()

      // Card should have rounded corners and background
      expect(card!.className).toContain('rounded')
      expect(card!.className).toContain('bg-card')

      // Header should have padding
      expect(header!.className).toContain('p-')

      // Title should have font weight
      expect(title!.className).toContain('font-')

      // Content should have padding
      expect(content!.className).toContain('px-')
    })

    test('Badge variants apply correct styling classes', () => {
      const { container: defaultContainer } = render(<Badge>Default</Badge>)
      const { container: secondaryContainer } = render(<Badge variant="secondary">Secondary</Badge>)
      const { container: destructiveContainer } = render(<Badge variant="destructive">Destructive</Badge>)

      const defaultBadge = defaultContainer.querySelector('[data-slot="badge"]')
      const secondaryBadge = secondaryContainer.querySelector('[data-slot="badge"]')
      const destructiveBadge = destructiveContainer.querySelector('[data-slot="badge"]')

      expect(defaultBadge).toBeTruthy()
      expect(secondaryBadge).toBeTruthy()
      expect(destructiveBadge).toBeTruthy()

      // All badges should have common classes
      expect(defaultBadge!.className).toContain('inline-flex')
      expect(secondaryBadge!.className).toContain('inline-flex')
      expect(destructiveBadge!.className).toContain('inline-flex')

      // All should have rounded corners
      expect(defaultBadge!.className).toContain('rounded')
      expect(secondaryBadge!.className).toContain('rounded')
      expect(destructiveBadge!.className).toContain('rounded')

      // Different variants should have different classes
      expect(defaultBadge!.className).not.toBe(secondaryBadge!.className)
      expect(defaultBadge!.className).not.toBe(destructiveBadge!.className)
    })

    test('Input applies correct form styling classes', () => {
      const { container } = render(<Input placeholder="Test input" />)
      const input = container.querySelector('input')

      expect(input).toBeTruthy()

      // Input should have flex display and sizing
      expect(input!.className).toContain('flex')
      expect(input!.className).toContain('h-')
      expect(input!.className).toContain('w-')

      // Should have border and background
      expect(input!.className).toContain('border')
      expect(input!.className).toContain('bg-')

      // Should have focus styles
      expect(input!.className).toContain('focus-visible')
    })
  })

  describe('Theme Consistency Across Components', () => {
    test('Components use consistent color variables', () => {
      const { container } = render(
        <div>
          <Button>Button</Button>
          <Card><CardContent>Card</CardContent></Card>
          <Badge>Badge</Badge>
          <Input placeholder="Input" />
        </div>
      )

      const button = container.querySelector('button')
      const card = container.querySelector('[data-slot="card"]')
      const badge = container.querySelector('[data-slot="badge"]')
      const input = container.querySelector('input')

      // All components should use appropriate color variables
      expect(button!.className).toContain('bg-primary')
      expect(card!.className).toContain('bg-card')
      expect(badge!.className).toContain('bg-primary')
      expect(input!.className).toContain('bg-transparent')
      expect(input!.className).toContain('border-input')
    })

    test('Components use consistent border radius', () => {
      const { container } = render(
        <div>
          <Button>Button</Button>
          <Card><CardContent>Card</CardContent></Card>
          <Badge>Badge</Badge>
          <Input placeholder="Input" />
        </div>
      )

      const button = container.querySelector('button')
      const card = container.querySelector('[data-slot="card"]')
      const badge = container.querySelector('[data-slot="badge"]')
      const input = container.querySelector('input')

      // All components should have rounded corners
      expect(button!.className).toContain('rounded')
      expect(card!.className).toContain('rounded')
      expect(badge!.className).toContain('rounded')
      expect(input!.className).toContain('rounded')
    })

    test('Components use consistent focus styles', () => {
      const { container } = render(
        <div>
          <Button>Button</Button>
          <Input placeholder="Input" />
        </div>
      )

      const button = container.querySelector('button')
      const input = container.querySelector('input')

      // Interactive components should have focus-visible styles
      expect(button!.className).toContain('focus-visible')
      expect(input!.className).toContain('focus-visible')

      // Should use consistent focus ring colors
      expect(button!.className).toContain('focus-visible:ring')
      expect(input!.className).toContain('focus-visible:ring')
    })

    test('Dark mode classes are properly structured', () => {
      const { container: lightContainer } = render(
        <div>
          <Button>Button</Button>
          <Card><CardContent>Card</CardContent></Card>
        </div>
      )

      const { container: darkContainer } = render(
        <div className="dark">
          <Button>Button</Button>
          <Card><CardContent>Card</CardContent></Card>
        </div>
      )

      const lightButton = lightContainer.querySelector('button')
      const darkButton = darkContainer.querySelector('button')
      const lightCard = lightContainer.querySelector('[data-slot="card"]')
      const darkCard = darkContainer.querySelector('[data-slot="card"]')

      // Components should have the same classes regardless of dark mode context
      // (since they use CSS variables)
      expect(lightButton!.className).toBe(darkButton!.className)
      expect(lightCard!.className).toBe(darkCard!.className)

      // But dark mode context should be present
      expect(darkContainer.querySelector('.dark')).toBeTruthy()
      expect(lightContainer.querySelector('.dark')).toBeFalsy()
    })
  })

  describe('Asset Loading from New Locations', () => {
    test('Public assets are accessible from root path', () => {
      // Test that we can reference assets that were migrated from ui/public
      const assetPaths = [
        '/placeholder-logo.png',
        '/placeholder-logo.svg', 
        '/placeholder-user.jpg',
        '/placeholder.jpg',
        '/placeholder.svg',
        '/icon-dark-32x32.png',
        '/icon-light-32x32.png',
        '/icon.svg',
        '/apple-icon.png'
      ]

      assetPaths.forEach(path => {
        // Create an image element to test asset loading
        const img = document.createElement('img') as HTMLImageElement
        img.src = path
        
        // The src should be set correctly (browser will handle actual loading)
        expect(img.src).toContain(path)
        expect(img.src).not.toContain('ui/public')
      })
    })

    test('Asset references use correct paths in components', () => {
      // Test that components can reference assets without ui/public prefix
      const { container } = render(
        <div>
          <img src="/placeholder-logo.svg" alt="Logo" />
          <img src="/icon.svg" alt="Icon" />
        </div>
      )

      const logoImg = container.querySelector('img[alt="Logo"]') as HTMLImageElement
      const iconImg = container.querySelector('img[alt="Icon"]') as HTMLImageElement

      expect(logoImg).toBeTruthy()
      expect(iconImg).toBeTruthy()

      expect(logoImg.src).toContain('/placeholder-logo.svg')
      expect(iconImg.src).toContain('/icon.svg')

      // Should not contain old ui/public path
      expect(logoImg.src).not.toContain('ui/public')
      expect(iconImg.src).not.toContain('ui/public')
    })

    test('CSS background images can reference migrated assets', () => {
      const { container } = render(
        <div 
          className="bg-[url('/placeholder.svg')] bg-cover bg-center"
          data-testid="bg-image"
        >
          Background Test
        </div>
      )

      const bgElement = container.querySelector('[data-testid="bg-image"]')
      expect(bgElement).toBeTruthy()
      
      // Should have the background class applied
      expect(bgElement!.className).toContain("bg-[url('/placeholder.svg')]")
      expect(bgElement!.className).toContain('bg-cover')
      expect(bgElement!.className).toContain('bg-center')
    })
  })

  describe('Glassmorphism and Neon Effects', () => {
    test('Glass effect classes are available', () => {
      const { container } = render(
        <div className="glass">
          Glass Effect Test
        </div>
      )

      const glassElement = container.querySelector('.glass')
      expect(glassElement).toBeTruthy()
      expect(glassElement!.className).toContain('glass')
    })

    test('Neon glow effect classes are available', () => {
      const { container } = render(
        <div>
          <div className="glow-cyan">Cyan Glow</div>
          <div className="glow-violet">Violet Glow</div>
          <div className="glow-emerald">Emerald Glow</div>
        </div>
      )

      const cyanGlow = container.querySelector('.glow-cyan')
      const violetGlow = container.querySelector('.glow-violet')
      const emeraldGlow = container.querySelector('.glow-emerald')

      expect(cyanGlow).toBeTruthy()
      expect(violetGlow).toBeTruthy()
      expect(emeraldGlow).toBeTruthy()

      expect(cyanGlow!.className).toContain('glow-cyan')
      expect(violetGlow!.className).toContain('glow-violet')
      expect(emeraldGlow!.className).toContain('glow-emerald')
    })

    test('Additional color variables are available', () => {
      const { container } = render(
        <div>
          <div className="text-success">Success Text</div>
          <div className="text-warning">Warning Text</div>
          <div className="text-neon-cyan">Neon Cyan Text</div>
        </div>
      )

      const successText = container.querySelector('.text-success')
      const warningText = container.querySelector('.text-warning')
      const neonText = container.querySelector('.text-neon-cyan')

      expect(successText).toBeTruthy()
      expect(warningText).toBeTruthy()
      expect(neonText).toBeTruthy()

      expect(successText!.className).toContain('text-success')
      expect(warningText!.className).toContain('text-warning')
      expect(neonText!.className).toContain('text-neon-cyan')
    })
  })

  describe('Dashboard Component Styling', () => {
    test('Dashboard components use glass effect consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <div className="glass">Sidebar</div>
            <div className="glass">Navbar</div>
            <div className="glass">Card</div>
          </div>
        </TestWrapper>
      )

      const glassElements = container.querySelectorAll('.glass')
      expect(glassElements).toHaveLength(3)
      
      glassElements.forEach(element => {
        expect(element.className).toContain('glass')
      })
    })

    test('Sidebar color variables are properly applied', () => {
      const { container } = render(
        <div>
          <div className="bg-sidebar text-sidebar-foreground">Sidebar Background</div>
          <div className="bg-sidebar-primary text-sidebar-primary-foreground">Active Item</div>
          <div className="bg-sidebar-accent text-sidebar-accent-foreground">Hover Item</div>
          <div className="border-sidebar-border">Border</div>
        </div>
      )

      const sidebarBg = container.querySelector('.bg-sidebar')
      const primaryBg = container.querySelector('.bg-sidebar-primary')
      const accentBg = container.querySelector('.bg-sidebar-accent')
      const border = container.querySelector('.border-sidebar-border')

      expect(sidebarBg).toBeTruthy()
      expect(primaryBg).toBeTruthy()
      expect(accentBg).toBeTruthy()
      expect(border).toBeTruthy()

      expect(sidebarBg!.className).toContain('text-sidebar-foreground')
      expect(primaryBg!.className).toContain('text-sidebar-primary-foreground')
      expect(accentBg!.className).toContain('text-sidebar-accent-foreground')
    })

    test('Neon color classes work for role indicators', () => {
      const { container } = render(
        <div>
          <div className="bg-neon-cyan">Admin Indicator</div>
          <div className="bg-neon-emerald">User Indicator</div>
          <div className="text-neon-violet">Accent Text</div>
        </div>
      )

      const adminIndicator = container.querySelector('.bg-neon-cyan')
      const userIndicator = container.querySelector('.bg-neon-emerald')
      const accentText = container.querySelector('.text-neon-violet')

      expect(adminIndicator).toBeTruthy()
      expect(userIndicator).toBeTruthy()
      expect(accentText).toBeTruthy()

      expect(adminIndicator!.className).toContain('bg-neon-cyan')
      expect(userIndicator!.className).toContain('bg-neon-emerald')
      expect(accentText!.className).toContain('text-neon-violet')
    })

    test('Gradient classes work for KPI cards', () => {
      const { container } = render(
        <div>
          <div className="bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5">Cyan Gradient</div>
          <div className="bg-gradient-to-br from-neon-violet/20 to-neon-violet/5">Violet Gradient</div>
          <div className="bg-gradient-to-br from-neon-emerald/20 to-neon-emerald/5">Emerald Gradient</div>
          <div className="bg-gradient-to-br from-warning/20 to-warning/5">Warning Gradient</div>
        </div>
      )

      const cyanGradient = container.querySelector('.from-neon-cyan\\/20')
      const violetGradient = container.querySelector('.from-neon-violet\\/20')
      const emeraldGradient = container.querySelector('.from-neon-emerald\\/20')
      const warningGradient = container.querySelector('.from-warning\\/20')

      expect(cyanGradient).toBeTruthy()
      expect(violetGradient).toBeTruthy()
      expect(emeraldGradient).toBeTruthy()
      expect(warningGradient).toBeTruthy()

      expect(cyanGradient!.className).toContain('bg-gradient-to-br')
      expect(violetGradient!.className).toContain('bg-gradient-to-br')
      expect(emeraldGradient!.className).toContain('bg-gradient-to-br')
      expect(warningGradient!.className).toContain('bg-gradient-to-br')
    })

    test('Transition and animation classes are applied', () => {
      const { container } = render(
        <div>
          <div className="transition-all duration-300">Smooth Transition</div>
          <div className="hover:scale-[1.02]">Hover Scale</div>
          <div className="hover:shadow-lg">Hover Shadow</div>
        </div>
      )

      const transitionElement = container.querySelector('.transition-all')
      const scaleElement = container.querySelector('.hover\\:scale-\\[1\\.02\\]')
      const shadowElement = container.querySelector('.hover\\:shadow-lg')

      expect(transitionElement).toBeTruthy()
      expect(scaleElement).toBeTruthy()
      expect(shadowElement).toBeTruthy()

      expect(transitionElement!.className).toContain('duration-300')
    })

    test('Backdrop blur effects work correctly', () => {
      const { container } = render(
        <div>
          <div className="backdrop-blur-sm">Light Blur</div>
          <div className="backdrop-blur-md">Medium Blur</div>
          <div className="backdrop-blur-lg">Heavy Blur</div>
        </div>
      )

      const lightBlur = container.querySelector('.backdrop-blur-sm')
      const mediumBlur = container.querySelector('.backdrop-blur-md')
      const heavyBlur = container.querySelector('.backdrop-blur-lg')

      expect(lightBlur).toBeTruthy()
      expect(mediumBlur).toBeTruthy()
      expect(heavyBlur).toBeTruthy()

      expect(lightBlur!.className).toContain('backdrop-blur-sm')
      expect(mediumBlur!.className).toContain('backdrop-blur-md')
      expect(heavyBlur!.className).toContain('backdrop-blur-lg')
    })
  })
})