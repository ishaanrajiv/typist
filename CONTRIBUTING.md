# Contributing to Typist

Thanks for helping improve Typist.

## Development setup

```bash
bun install
bun run dev
```

## Quality gates

Run all checks before opening a pull request:

```bash
bun run lint
bun run typecheck
bun run test:run
bun run build
```

## Pull request expectations

- Keep changes focused and small.
- Add or update tests when behavior changes.
- Keep TypeScript strictness intact.
- Update docs when adding features or changing workflows.

## Commit guidance

Conventional Commit style is preferred:

- `feat: add learn mode scoring insight`
- `fix: correct coder whitespace accuracy`
- `docs: update setup instructions`

## Reporting issues

Use the GitHub issue templates for bugs and feature requests.

## Code of conduct

By participating in this project, you agree to follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).
