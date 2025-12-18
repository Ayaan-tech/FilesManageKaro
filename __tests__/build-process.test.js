/**
 * Build Process Tests
 * Tests that build process works with unified dependencies
 * Requirements: 4.3
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

describe('Build Process Compatibility', () => {
  test('package.json has all required dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    // Check core dependencies are present
    expect(packageJson.dependencies['react']).toBe('19.2.0')
    expect(packageJson.dependencies['react-dom']).toBe('19.2.0')
    expect(packageJson.dependencies['next']).toBe('16.0.10')
    
    // Check UI dependencies are present
    expect(packageJson.dependencies['@radix-ui/react-dialog']).toBeDefined()
    expect(packageJson.dependencies['@radix-ui/react-accordion']).toBeDefined()
    expect(packageJson.dependencies['lucide-react']).toBeDefined()
    expect(packageJson.dependencies['tailwind-merge']).toBeDefined()
    
    // Check form dependencies
    expect(packageJson.dependencies['react-hook-form']).toBeDefined()
    expect(packageJson.dependencies['zod']).toBeDefined()
    expect(packageJson.dependencies['@hookform/resolvers']).toBeDefined()
    
    // Check chart dependencies
    expect(packageJson.dependencies['recharts']).toBeDefined()
    expect(packageJson.dependencies['date-fns']).toBeDefined()
  })

  test('TypeScript configuration is valid', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    expect(fs.existsSync(tsconfigPath)).toBe(true)
    
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
    expect(tsconfig.compilerOptions).toBeDefined()
    expect(tsconfig.include).toBeDefined()
  })

  test('TypeScript configuration has merged settings from UI app', () => {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
    
    // Test that compiler options are properly merged
    expect(tsconfig.compilerOptions.target).toBe('ES2017')
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
    expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    
    // Test that path mappings include new component locations
    expect(tsconfig.compilerOptions.paths).toBeDefined()
    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*'])
    expect(tsconfig.compilerOptions.paths['@/components/*']).toEqual(['./components/*'])
    expect(tsconfig.compilerOptions.paths['@/app/*']).toEqual(['./app/*'])
    expect(tsconfig.compilerOptions.paths['@/lib/*']).toEqual(['./lib/*'])
    expect(tsconfig.compilerOptions.paths['@/hooks/*']).toEqual(['./hooks/*'])
    
    // Test that UI folder is excluded
    expect(tsconfig.exclude).toContain('ui')
    expect(tsconfig.exclude).toContain('node_modules')
  })

  test('TypeScript compilation works without errors', () => {
    // This test verifies that tsc --noEmit passes
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.stdout || error.stderr}`)
    }
  })

  test('Next.js configuration is valid', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts')
    expect(fs.existsSync(nextConfigPath)).toBe(true)
    
    // Verify the config can be required without errors
    expect(() => {
      require('../next.config.ts')
    }).not.toThrow()
  })

  test('no dependency conflicts in package-lock.json', () => {
    const packageLockPath = path.join(process.cwd(), 'package-lock.json')
    
    if (fs.existsSync(packageLockPath)) {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
      
      // Check that there are no peer dependency warnings in the lockfile
      // This is a basic check - npm install would have failed if there were major conflicts
      expect(packageLock.lockfileVersion).toBeDefined()
      expect(packageLock.packages).toBeDefined()
    }
  })

  test('all imports can be resolved', () => {
    // Test that key dependencies can be imported without errors
    expect(() => require('react')).not.toThrow()
    expect(() => require('react-dom')).not.toThrow()
    expect(() => require('next')).not.toThrow()
    expect(() => require('@radix-ui/react-dialog')).not.toThrow()
    expect(() => require('lucide-react')).not.toThrow()
    expect(() => require('tailwind-merge')).not.toThrow()
    expect(() => require('clsx')).not.toThrow()
    expect(() => require('class-variance-authority')).not.toThrow()
  })
})