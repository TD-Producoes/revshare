# Contributing to RevShare

Thank you for your interest in contributing to RevShare! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues

- Check existing issues to avoid duplicates
- Use the issue templates when available
- Provide clear reproduction steps for bugs
- Include relevant environment details

### Suggesting Features

- Open an issue with the "feature request" template
- Describe the use case and expected behavior
- Be open to discussion about implementation approaches

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`

2. **Set up the development environment**:
   ```bash
   npm install
   cp .env.example .env
   # Configure your .env with test credentials
   npm run db:migrate
   npm run dev
   ```

3. **Make your changes**:
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**:
   ```bash
   npm run lint
   npm run build
   ```

5. **Submit a pull request**:
   - Reference any related issues
   - Describe what changes you made and why
   - Include screenshots for UI changes

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Keep functions small and focused

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add marketer earnings export
fix: correct commission calculation for refunds
docs: update API documentation
chore: update dependencies
```

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

## Project Structure

```
app/           - Next.js pages and API routes
components/    - Reusable React components
lib/           - Shared utilities and helpers
prisma/        - Database schema and migrations
emails/        - Email templates
```

## Getting Help

- Open a GitHub Discussion for questions
- Join our community channels (if available)
- Check the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
