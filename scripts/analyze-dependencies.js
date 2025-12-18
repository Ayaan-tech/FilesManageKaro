#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Dependency Analysis Script
 * Compares package.json files between main app and UI app to identify conflicts
 */

function loadPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function compareVersions(version1, version2) {
  // Remove ^ and ~ prefixes for comparison
  const clean1 = version1.replace(/^[\^~]/, '');
  const clean2 = version2.replace(/^[\^~]/, '');
  
  const parts1 = clean1.split('.').map(Number);
  const parts2 = clean2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

function analyzeDependencies() {
  console.log('🔍 Analyzing dependency conflicts between main app and UI app...\n');
  
  const mainPkg = loadPackageJson('package.json');
  const uiPkg = loadPackageJson('ui/package.json');
  
  if (!mainPkg || !uiPkg) {
    console.error('❌ Failed to load one or both package.json files');
    return;
  }
  
  console.log(`📦 Main app: ${mainPkg.name} v${mainPkg.version}`);
  console.log(`📦 UI app: ${uiPkg.name} v${uiPkg.version}\n`);
  
  // Analyze dependencies
  const analysis = {
    conflicts: [],
    mainOnly: [],
    uiOnly: [],
    compatible: [],
    devConflicts: [],
    devMainOnly: [],
    devUiOnly: [],
    devCompatible: []
  };
  
  // Compare production dependencies
  console.log('🔍 Analyzing production dependencies...\n');
  
  const mainDeps = mainPkg.dependencies || {};
  const uiDeps = uiPkg.dependencies || {};
  
  const allDepNames = new Set([...Object.keys(mainDeps), ...Object.keys(uiDeps)]);
  
  for (const depName of allDepNames) {
    const mainVersion = mainDeps[depName];
    const uiVersion = uiDeps[depName];
    
    if (mainVersion && uiVersion) {
      if (mainVersion === uiVersion) {
        analysis.compatible.push({ name: depName, version: mainVersion });
      } else {
        const comparison = compareVersions(mainVersion, uiVersion);
        analysis.conflicts.push({
          name: depName,
          mainVersion,
          uiVersion,
          recommendation: comparison >= 0 ? mainVersion : uiVersion,
          severity: Math.abs(comparison) > 0 ? 'major' : 'minor'
        });
      }
    } else if (mainVersion) {
      analysis.mainOnly.push({ name: depName, version: mainVersion });
    } else {
      analysis.uiOnly.push({ name: depName, version: uiVersion });
    }
  }
  
  // Compare dev dependencies
  const mainDevDeps = mainPkg.devDependencies || {};
  const uiDevDeps = uiPkg.devDependencies || {};
  
  const allDevDepNames = new Set([...Object.keys(mainDevDeps), ...Object.keys(uiDevDeps)]);
  
  for (const depName of allDevDepNames) {
    const mainVersion = mainDevDeps[depName];
    const uiVersion = uiDevDeps[depName];
    
    if (mainVersion && uiVersion) {
      if (mainVersion === uiVersion) {
        analysis.devCompatible.push({ name: depName, version: mainVersion });
      } else {
        const comparison = compareVersions(mainVersion, uiVersion);
        analysis.devConflicts.push({
          name: depName,
          mainVersion,
          uiVersion,
          recommendation: comparison >= 0 ? mainVersion : uiVersion,
          severity: Math.abs(comparison) > 0 ? 'major' : 'minor'
        });
      }
    } else if (mainVersion) {
      analysis.devMainOnly.push({ name: depName, version: mainVersion });
    } else {
      analysis.devUiOnly.push({ name: depName, version: uiVersion });
    }
  }
  
  // Report findings
  console.log('📊 DEPENDENCY ANALYSIS RESULTS\n');
  console.log('=' .repeat(50));
  
  // Production dependencies
  console.log('\n🏭 PRODUCTION DEPENDENCIES\n');
  
  if (analysis.conflicts.length > 0) {
    console.log('⚠️  VERSION CONFLICTS:');
    analysis.conflicts.forEach(conflict => {
      console.log(`   ${conflict.name}:`);
      console.log(`     Main: ${conflict.mainVersion}`);
      console.log(`     UI:   ${conflict.uiVersion}`);
      console.log(`     Recommended: ${conflict.recommendation} (${conflict.severity} conflict)`);
      console.log('');
    });
  }
  
  if (analysis.uiOnly.length > 0) {
    console.log('➕ NEW DEPENDENCIES (from UI app):');
    analysis.uiOnly.forEach(dep => {
      console.log(`   ${dep.name}: ${dep.version}`);
    });
    console.log('');
  }
  
  if (analysis.compatible.length > 0) {
    console.log(`✅ COMPATIBLE DEPENDENCIES: ${analysis.compatible.length} packages`);
    console.log('');
  }
  
  // Dev dependencies
  console.log('🛠️  DEVELOPMENT DEPENDENCIES\n');
  
  if (analysis.devConflicts.length > 0) {
    console.log('⚠️  DEV VERSION CONFLICTS:');
    analysis.devConflicts.forEach(conflict => {
      console.log(`   ${conflict.name}:`);
      console.log(`     Main: ${conflict.mainVersion}`);
      console.log(`     UI:   ${conflict.uiVersion}`);
      console.log(`     Recommended: ${conflict.recommendation} (${conflict.severity} conflict)`);
      console.log('');
    });
  }
  
  if (analysis.devUiOnly.length > 0) {
    console.log('➕ NEW DEV DEPENDENCIES (from UI app):');
    analysis.devUiOnly.forEach(dep => {
      console.log(`   ${dep.name}: ${dep.version}`);
    });
    console.log('');
  }
  
  if (analysis.devCompatible.length > 0) {
    console.log(`✅ COMPATIBLE DEV DEPENDENCIES: ${analysis.devCompatible.length} packages`);
    console.log('');
  }
  
  // Summary and recommendations
  console.log('📋 SUMMARY & RECOMMENDATIONS\n');
  console.log('=' .repeat(50));
  
  const totalConflicts = analysis.conflicts.length + analysis.devConflicts.length;
  const totalNewDeps = analysis.uiOnly.length + analysis.devUiOnly.length;
  
  console.log(`🔢 Total conflicts: ${totalConflicts}`);
  console.log(`🔢 New dependencies to add: ${totalNewDeps}`);
  console.log(`🔢 Compatible dependencies: ${analysis.compatible.length + analysis.devCompatible.length}`);
  
  if (totalConflicts > 0) {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('   1. Review version conflicts above');
    console.log('   2. Test functionality with recommended versions');
    console.log('   3. Update package.json with resolved versions');
  }
  
  if (totalNewDeps > 0) {
    console.log('\n➕ DEPENDENCIES TO ADD:');
    console.log('   1. Add new dependencies from UI app to main package.json');
    console.log('   2. Run npm install to install new packages');
    console.log('   3. Test that all functionality works correctly');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Backup current package.json');
  console.log('   2. Merge dependencies using recommended versions');
  console.log('   3. Run npm install');
  console.log('   4. Test build process');
  console.log('   5. Test UI functionality');
  
  // Save detailed analysis to file
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalConflicts,
      totalNewDeps,
      compatibleDeps: analysis.compatible.length + analysis.devCompatible.length
    },
    production: {
      conflicts: analysis.conflicts,
      newDependencies: analysis.uiOnly,
      compatible: analysis.compatible
    },
    development: {
      conflicts: analysis.devConflicts,
      newDependencies: analysis.devUiOnly,
      compatible: analysis.devCompatible
    }
  };
  
  fs.writeFileSync('dependency-analysis-report.json', JSON.stringify(detailedReport, null, 2));
  console.log('\n💾 Detailed report saved to: dependency-analysis-report.json');
}

// Run the analysis
analyzeDependencies();