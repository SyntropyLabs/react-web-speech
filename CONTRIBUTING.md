# Contributing to @syntropy-labs/react-web-speech

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `yarn install`
3. Run tests: `yarn test`
4. Start development: `yarn dev`

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Add a changeset: `yarn changeset`
4. Commit your changes
5. Push and create a pull request

## Code Style

- We use ESLint and Prettier for code formatting
- Run `yarn lint:fix` before committing
- Pre-commit hooks will automatically check your code

## Testing

- Write tests for new features
- Ensure all tests pass: `yarn test`
- Check coverage: `yarn test:coverage`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `test:` Test additions or modifications
