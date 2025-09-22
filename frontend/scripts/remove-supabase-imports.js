#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to update
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '__tests__/**/*.ts',
  '__tests__/**/*.tsx'
];

// Get all files
const files = [];
patterns.forEach(pattern => {
  const matchedFiles = glob.sync(pattern, { cwd: process.cwd() });
  files.push(...matchedFiles);
});

const replacements = [
  // Basic imports
  {
    from: /import { createClient } from ["']@\/utils\/supabase\/client["']/g,
    to: '// Supabase import removed - migrated to NextAuth'
  },
  {
    from: /import { createClient } from ["']@\/utils\/supabase\/server["']/g,
    to: '// Supabase import removed - migrated to NextAuth'
  },
  {
    from: /import { updateSession } from ['"]@\/utils\/supabase\/middleware['"];?/g,
    to: '// Supabase middleware import removed - migrated to NextAuth'
  },
  // User type imports
  {
    from: /import { User } from ["']@supabase\/supabase-js["']/g,
    to: '// Supabase User type removed - using NextAuth session.user'
  },
  // Client creation
  {
    from: /const supabase = createClient\(\)/g,
    to: '// Supabase client removed - using NextAuth session'
  },
  // Mock imports in tests
  {
    from: /vi\.mock\(['"]@\/utils\/supabase\/client['"], \(\) => \(\{/g,
    to: '// vi.mock(\'@/utils/supabase/client\', () => ({'
  },
  {
    from: /vi\.mock\(['"]@\/utils\/supabase\/server['"], \(\) => \(\{/g,
    to: '// vi.mock(\'@/utils/supabase/server\', () => ({'
  },
  {
    from: /vi\.doMock\(['"]@\/utils\/supabase\/server['"], \(\) => \(\{/g,
    to: '// vi.doMock(\'@/utils/supabase/server\', () => ({'
  }
];

let filesUpdated = 0;
let totalReplacements = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    let fileReplacements = 0;

    replacements.forEach(replacement => {
      const matches = content.match(replacement.from);
      if (matches) {
        content = content.replace(replacement.from, replacement.to);
        fileChanged = true;
        fileReplacements += matches.length;
      }
    });

    if (fileChanged) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
      totalReplacements += fileReplacements;
      console.log(`Updated ${filePath} (${fileReplacements} replacements)`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary:`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total replacements: ${totalReplacements}`);