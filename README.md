# Typist

Minimalist but thoughtful typing speed test built with Bun, TypeScript, React, and Vite.

## Modes

- `Classic`: timed word typing (`15s`, `30s`, `60s`, `120s`)
- `Coder`: drill-based code typing in `python`, `javascript`, `c` (`30s`, `60s`, `90s`)
- `Learn`: untimed typing with post-run habit summary and heuristic suggestions

## Stack

- Runtime and scripts: `bun`
- Frontend: `react` + `typescript` + `vite`
- Persistence: browser `localStorage` only
- Deployment target: `vercel` static build

## Run

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
bun run typecheck
bun run test:run
bun run build
```

## Structure

```text
src/
  app/         # app shell and session lifecycle
  components/  # UI controls, prompt view, stats, report panels
  content/     # word lists, code drills, learn passages
  features/    # mode-specific prompt assembly
  lib/         # scoring, insights, storage, formatting
  types/       # shared contracts
```

## Notes

- Session history is capped at `50` entries.
- Streak data is updated locally by date.
- Learn mode uses deterministic heuristics, no AI backend.

## Deployment

This app is configured for static deployment on Vercel.

```bash
bun run build
```

Build output is in `dist/`.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Please follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Security

If you discover a security issue, follow [SECURITY.md](./SECURITY.md).

## License

Licensed under the [MIT License](./LICENSE).
