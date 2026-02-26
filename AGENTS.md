# AGENTS.md - Agent Coding Guidelines

## Project Overview

This is a 2FA OTP Generator built on Cloudflare Workers. It provides secure TOTP/HOTP/Steam Guard code generation with AES-GCM encryption, JWT authentication, and PWA support.

## Build Commands

### Development

```bash
npm run dev          # Start Wrangler dev server
npm start            # Alias for dev
```

### Building

```bash
npm run build                    # Build release bundle
npm run build:minify             # Build with minification
```

### Testing

```bash
npm test                         # Run all tests
npm run test:watch              # Watch mode for development
npm run test:ui                 # Vitest UI interface
npm run test:coverage           # Generate coverage report (V8 provider)

# Running a single test file
npx vitest run tests/utils/validation.test.js

# Running a single test
npx vitest run tests/utils/validation.test.js -t "should accept valid Base32"
```

### Linting & Formatting

```bash
npm run lint           # ESLint check
npm run lint:fix       # ESLint fix
npm run format         # Prettier write
npm run format:check   # Prettier check
```

### Deployment

```bash
npm run deploy                 # Deploy via script
npm run deploy:dev             # Deploy to development
npm run deploy:direct          # Direct wrangler deploy
```

## Code Style Guidelines

### Language & Module System

- ECMAScript 2022 with ES modules (`"type": "module"` in package.json)
- Use named exports instead of default exports (except for Worker entry point)

### Formatting (Prettier)

```json
{
	"printWidth": 140,
	"singleQuote": true,
	"semi": true,
	"useTabs": true
}
```

### EditorConfig

- Tab indentation (width: 2)
- LF line endings
- UTF-8 charset
- Trim trailing whitespace
- Insert final newline

### ESLint Rules

The project uses ESLint 9 with `@eslint/js` recommended config plus custom rules:

```javascript
{
  "rules": {
    "no-unused-vars": ["error", { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-return-await": "error",
    "no-throw-literal": "error",
    "prefer-promise-reject-errors": "error"
  }
}
```

### Naming Conventions

**Functions**:

- Use verb prefixes: `validateData`, `createResponse`
- Boolean returns `handleRequest`,: `isValidSecret()`, `hasPermission()`, `shouldRefresh()`

**Constants**:

- UPPER_SNAKE_CASE: `const JWT_EXPIRY_DAYS = 30`
- Group related constants: `const RATE_LIMIT_PRESETS = { ... }`

**Files**:

- kebab-case: `auth-handler.js`, `validation-utils.js`

### Import/Export Order

1. Node.js built-ins
2. External packages
3. Internal modules (relative paths)

```javascript
// ✅ Recommended order
import crypto from 'crypto';
import { getLogger } from './utils/logger.js';
import { validateSecretData } from './validation.js';
```

### JSDoc Comments

Use JSDoc for public functions:

```javascript
/**
 * Validates secret data before storage
 * @param {Object} data - Secret data object
 * @param {string} data.name - Service name
 * @param {string} data.secret - Base32 encoded secret
 * @returns {{valid: boolean, error?: string}}
 */
function validateSecretData(data) {}
```

### Error Handling

- Use specific error types from `src/utils/errors.js` (ValidationError, AuthenticationError, etc.)
- Always log errors with context
- Return proper HTTP responses using `createErrorResponse()`

```javascript
// ✅ Good error handling
try {
	await operation();
} catch (error) {
	logger.error('Operation failed', { param: value }, error);
	return createErrorResponse('Error title', error.message, 400, request);
}

// ✅ Use custom error classes
throw new ValidationError('Invalid input', { field: 'name' });
```

### Globals

The following globals are pre-defined in ESLint config:

- Cloudflare Workers: `addEventListener`, `fetch`, `Response`, `Request`, `crypto`, etc.
- Browser: `window`, `document`, `localStorage`, `indexedDB`, etc.
- Vitest: `describe`, `it`, `test`, `expect`, `beforeEach`, `vi`, etc.

### Data Model

**Secret Object Structure**:

```javascript
{
  id: "uuid-v4",
  name: "Service Name",
  account: "user@email.com",
  secret: "BASE32SECRET",
  type: "TOTP",          // TOTP | HOTP | STEAM
  algorithm: "SHA1",     // SHA1 | SHA256 | SHA512
  digits: 6,            // 6 | 8
  period: 30,          // TOTP: 30 | 60 | 120
  counter: 0,          // HOTP only
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

### Testing Conventions (Vitest)

Tests use Vitest with globals enabled. Test files are in `tests/` directory:

```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../src/utils/yourModule.js';

describe('yourFunction', () => {
	it('should work correctly', () => {
		expect(yourFunction('input')).toBe('expected');
	});
});
```

### Project Structure

```
src/
├── worker.js              # Worker entry (fetch + scheduled)
├── router/
│   └── handler.js         # Request routing
├── api/
│   ├── secrets/           # Secrets CRUD API
│   └── favicon.js         # Favicon proxy
├── otp/
│   └── generator.js       # TOTP/HOTP/Steam algorithms
├── ui/
│   ├── page.js           # HTML generation
│   ├── scripts/          # Frontend JS modules
│   └── styles/          # Frontend CSS
└── utils/                 # Utility modules
    ├── auth.js           # JWT + PBKDF2
    ├── encryption.js    # AES-GCM
    ├── validation.js    # Input validation
    └── ...
```

### Security Guidelines

- Never log data (secrets, passwords)
- Use sensitive HttpOnly, Secure, SameSite=Strict cookies for JWT
- Always validate and sanitize user input
- Use parameterized error messages (don't expose internals)

### Pre-commit Hooks

Husky is configured with pre-commit linting via lint-staged. Make sure to run `npm install` to enable hooks.

## Documentation

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Full development guide
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detailed architecture
- [API_REFERENCE.md](docs/API_REFERENCE.md) - API endpoints
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
