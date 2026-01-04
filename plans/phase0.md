# Phase 0: Project Foundation & DX Infrastructure

> **Goal:** Establish a production-grade open-source npm package foundation with excellent developer experience from day one.

**Estimated Time:** 1-2 days

---

## Overview

Phase 0 sets the foundation for everything that follows. It focuses on:
- Package configuration with modern best practices
- TypeScript and linting setup
- Testing infrastructure
- CI/CD and release automation
- Repository community files

> [!IMPORTANT]
> All configurations in this phase should be completed before writing any library code. This ensures consistent quality from the first commit.

---

## 0.1 Package Configuration

### 0.1.1 tsdown Configuration

The current `tsdown.config.ts` already has a good foundation. Here are refinements based on best practices from the tsdown documentation:

> [!NOTE]
> The current config has a duplicate `plugins` key inside the babel config object. While this works (JS takes the last value), it should be cleaned up for clarity.

```typescript
// tsdown.config.ts
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',        // SSR-safe for Next.js, Remix, etc.
  dts: true,                  // Generate declaration files
  exports: true,              // Auto-generate package.json exports
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  fixedExtension: true,       // Generate .mjs/.cjs (recommended for npm packages)
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      plugins: ['babel-plugin-react-compiler'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
})
```

**Recommended addition:** Add `fixedExtension: true` to generate `.mjs`/`.cjs` file extensions, which is considered best practice for npm packages.

**Key Configuration Options:**

| Option | Value | Purpose |
|--------|-------|---------|
| `format` | `['esm', 'cjs']` | Dual format for maximum compatibility |
| `platform` | `'neutral'` | Works in browser, Node.js, and SSR |
| `dts` | `true` | Generate TypeScript declaration files |
| `exports` | `true` | Auto-update `package.json` exports field |
| `fixedExtension` | `true` | Use `.mjs`/`.cjs` extensions (npm best practice) |
| `treeshake` | `true` | Remove unused code from bundle |
| `plugins` | React Compiler | Pre-optimize React components via babel-plugin-react-compiler |

> [!TIP]
> With `exports: true`, tsdown **auto-generates** the `exports`, `main`, `module`, and `types` fields in `package.json` during build. You don't need to manage these manually.

---

### 0.1.2 package.json Updates

Update `package.json` with modern npm package best practices.

> [!IMPORTANT]
> Since tsdown uses `exports: true`, the `exports`, `main`, `module`, and `types` fields are **auto-generated** during build. You should NOT manually define these - tsdown will manage them.

```json
{
  "name": "@syntropy-labs/react-web-speech",
  "version": "0.0.1",
  "type": "module",
  "description": "A React library for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.",
  "author": "SyntropyLabs",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SyntropyLabs/react-web-speech.git"
  },
  "homepage": "https://github.com/SyntropyLabs/react-web-speech#readme",
  "bugs": {
    "url": "https://github.com/SyntropyLabs/react-web-speech/issues"
  },
  "keywords": [
    "react", "speech", "speech-to-text", "speech-recognition",
    "web-speech-api", "voice", "microphone", "hooks", "typescript"
  ],
  "sideEffects": false,
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "npm run build",
    "prepare": "husky",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "npm run build && changeset publish"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": { "optional": true }
  },
  "devDependencies": {
    "@babel/core": "^7.28.5",
    "@changesets/cli": "^2.27.0",
    "@changesets/changelog-github": "^0.5.0",
    "@rollup/plugin-babel": "^6.1.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "happy-dom": "^16.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsdown": "^0.18.1",
    "typescript": "^5.9.3",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

**Key Updates:**

| Field | Purpose |
|-------|---------|
| ~~`exports/main/module/types`~~ | **Auto-generated by tsdown** - do not manually define |
| `publishConfig.provenance` | Enable npm provenance for supply chain security |
| `sideEffects: false` | Enables tree-shaking for consumers |
| `files` | Explicitly include only necessary files |
| `prepare` | Auto-setup Husky on `npm install` |

---

## 0.2 TypeScript Configuration

### tsconfig.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

**Key Compiler Options:**

| Option | Value | Purpose |
|--------|-------|---------|
| `target` | `ES2020` | Modern baseline, good browser support |
| `moduleResolution` | `bundler` | Best for library bundling with tsdown |
| `strict` | `true` | Maximum type safety |
| `noEmit` | `true` | tsdown handles output, TS is for type checking |
| `isolatedModules` | `true` | Required for bundler compatibility |

---

## 0.3 ESLint Configuration (Flat Config)

ESLint 9+ uses the new flat config format (`eslint.config.js`). This is the modern standard.

### eslint.config.js

```javascript
import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default [
  // Base ESLint recommended rules
  eslint.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  
  // Disable rules that conflict with Prettier
  prettier,
  
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.*'],
  },
]
```

---

## 0.4 Prettier Configuration

### .prettierrc

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always"
}
```

### .prettierignore

```
dist
node_modules
coverage
pnpm-lock.yaml
yarn.lock
package-lock.json
*.md
```

---

## 0.5 Testing Infrastructure

### Vitest Configuration

Using Vitest for fast, modern testing with native ESM support.

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',  // Lighter than jsdom
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',          // Faster than istanbul
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.config.*',
        '**/*.d.ts',
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

### Testing Dependencies Purpose

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner with native ESM, Jest-compatible API |
| `happy-dom` | Lightweight DOM environment (faster than jsdom) |
| `@testing-library/react` | Test React hooks with `renderHook` |
| `@vitest/coverage-v8` | V8-based coverage (faster, AST-aware since v3.2) |

---

## 0.6 Pre-commit Hooks (Husky + lint-staged)

### Setup Commands

```bash
# Initialize Husky
npx husky init

# The prepare script in package.json will auto-setup on npm install
```

### .husky/pre-commit

```bash
npx lint-staged
```

### lint-staged.config.js

```javascript
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
}
```

---

## 0.7 Changesets Configuration

Changesets provides explicit version control and human-readable changelogs.

### Setup Commands

```bash
npx @changesets/cli init
```

### .changeset/config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@latest/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "SyntropyLabs/react-web-speech" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Why Changesets over Semantic Release?**
- Explicit control over when to release
- Human-readable changelogs in `.changeset/` directory
- Better for initial development with frequent breaking changes
- Used by Radix UI, Chakra UI, TanStack Query, and other top packages

---

## 0.8 GitHub Actions CI/CD

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Format check
        run: npm run format:check

      - name: Test
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write  # Required for npm provenance

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          version: npm run version
          publish: npm run release
          commit: 'chore: version packages'
          title: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 0.9 Repository Community Files

### Issue Templates

#### .github/ISSUE_TEMPLATE/bug_report.md

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[Bug]: '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. 
2. 
3. 

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment**
- Package version:
- React version:
- Browser:
- OS:

**Additional context**
Add any other context about the problem here.
```

#### .github/ISSUE_TEMPLATE/feature_request.md

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[Feature]: '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### .github/PULL_REQUEST_TEMPLATE.md

```markdown
## Description

<!-- Describe your changes in detail -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist

- [ ] I have read the [CONTRIBUTING](CONTRIBUTING.md) document
- [ ] My code follows the code style of this project
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All new and existing tests pass
- [ ] I have updated the documentation accordingly
```

### CONTRIBUTING.md

```markdown
# Contributing to @syntropy-labs/react-web-speech

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start development: `npm run dev`

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Add a changeset: `npm run changeset`
4. Commit your changes
5. Push and create a pull request

## Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint:fix` before committing
- Pre-commit hooks will automatically check your code

## Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Check coverage: `npm run test:coverage`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `test:` Test additions or modifications
```

### CODE_OF_CONDUCT.md

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- The use of sexualized language or imagery and unwelcome sexual attention
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.
```

### .editorconfig

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

---

## 0.10 Phase 0 Deliverables Checklist

| Deliverable | Status | File(s) |
|-------------|--------|---------|
| tsdown configuration (fixed) | ⬜ | `tsdown.config.ts` |
| package.json with exports and provenance | ⬜ | `package.json` |
| TypeScript configuration | ⬜ | `tsconfig.json` |
| ESLint flat config | ⬜ | `eslint.config.js` |
| Prettier configuration | ⬜ | `.prettierrc`, `.prettierignore` |
| Vitest configuration | ⬜ | `vitest.config.ts` |
| Husky setup | ⬜ | `.husky/pre-commit` |
| lint-staged configuration | ⬜ | `lint-staged.config.js` |
| Changesets initialization | ⬜ | `.changeset/config.json` |
| CI workflow | ⬜ | `.github/workflows/ci.yml` |
| Release workflow | ⬜ | `.github/workflows/release.yml` |
| Issue templates | ⬜ | `.github/ISSUE_TEMPLATE/` |
| PR template | ⬜ | `.github/PULL_REQUEST_TEMPLATE.md` |
| Contributing guide | ⬜ | `CONTRIBUTING.md` |
| Code of conduct | ⬜ | `CODE_OF_CONDUCT.md` |
| Editor config | ⬜ | `.editorconfig` |

---

## Summary

Phase 0 establishes a solid foundation with:

1. **Modern Build System**: tsdown with dual ESM/CJS output, auto-generated exports, and proper TypeScript declarations
2. **Code Quality**: ESLint flat config + Prettier + pre-commit hooks
3. **Testing**: Vitest with happy-dom for fast React hook testing
4. **Release Automation**: Changesets with GitHub Actions for versioning and npm publishing with provenance
5. **Community**: Issue templates, PR template, contributing guide, and code of conduct

This ensures the project starts with production-grade tooling that will scale as the library grows.

---

## Appendix: Comparison with Popular React Packages

Research into top React packages reveals common patterns:

| Package | Build Tool | Test Tool | Version Mgmt | Pre-commit |
|---------|-----------|-----------|--------------|------------|
| **TanStack Query** | tsup | Vitest | Changesets | ❌ |
| **react-hook-form** | Rollup | Jest | Manual | Husky + lint-staged |
| **react-use** | tsc | Jest | semantic-release | Husky + lint-staged |
| **This Package** | tsdown | Vitest | Changesets | Husky + lint-staged |

### Key Patterns Observed

1. **`sideEffects: false`** - All packages use this for tree-shaking
2. **Dual ESM/CJS** - All export both formats with proper `exports` field
3. **TypeScript** - All are TypeScript-first with declaration files
4. **`prepare: husky`** - Most use husky for git hooks (except TanStack which handles it differently in monorepo)
5. **Testing** - Modern packages trending toward Vitest over Jest
