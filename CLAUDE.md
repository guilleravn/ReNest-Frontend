# ReNest Frontend

- UI: reuse the shared components in `src/components/` (catalog: `src/components/README.md`, live preview at `/ui-kit`). Don't create a new component when one there fits; extend it with a prop/variant instead.
- Styling: only the design tokens from `src/index.css` (via Tailwind utilities like `bg-surface`, `text-text-muted`, `bg-green-strong`). No hard-coded colors, font sizes, radii or shadows. If a value is missing, add a token to `index.css`.
- Light mode only for now.
- Import `cn` from `@/lib/utils`.
- Language: code, comments, docs and commit messages in English. User-facing copy stays in Spanish.
