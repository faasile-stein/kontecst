# Contributing to Kontecst

Thank you for your interest in contributing to Kontecst! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [GitHub Issues](https://github.com/your-org/kontecst/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing [GitHub Discussions](https://github.com/your-org/kontecst/discussions)
2. Create a new discussion with:
   - Clear use case
   - Proposed solution
   - Alternative approaches considered
   - Impact on existing features

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass: `pnpm test`
6. Run type checking: `pnpm type-check`
7. Run linting: `pnpm lint`
8. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
9. Push to your fork
10. Create a Pull Request

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(editor): add markdown syntax highlighting
fix(proxy): resolve file encryption race condition
docs(api): update authentication guide
refactor(storage): extract encryption service
```

## Development Setup

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed setup instructions.

Quick start:
```bash
git clone https://github.com/your-org/kontecst.git
cd kontecst
pnpm install
cp .env.example .env
# Edit .env with your credentials
pnpm docker:up
pnpm dev
```

## Project Structure

```
kontecst/
├── apps/
│   ├── web/         # Next.js web app
│   └── proxy/       # File proxy service
├── packages/
│   ├── database/    # Supabase migrations
│   └── shared/      # Shared code
└── docs/            # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define explicit types (avoid `any`)
- Use Zod for runtime validation
- Document complex types

### React/Next.js

- Use functional components with hooks
- Keep components small and focused
- Use Server Components when possible
- Implement proper error boundaries
- Follow Next.js App Router conventions

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Routes: `kebab-case/page.tsx`
- Tests: `*.test.ts` or `*.spec.ts`

### Code Style

We use ESLint and Prettier. Run:
```bash
pnpm lint --fix
```

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Test edge cases
- Use descriptive test names

## Documentation

- Update README.md for user-facing changes
- Update docs/ for architecture/deployment changes
- Add JSDoc comments for complex functions
- Update API documentation

## Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer review required
3. All comments must be addressed
4. No merge conflicts
5. Branch must be up to date with main

## Release Process

We use semantic versioning (semver):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

Releases are automated via GitHub Actions.

## Questions?

- Check [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- Ask in [GitHub Discussions](https://github.com/your-org/kontecst/discussions)
- Join our Discord (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
