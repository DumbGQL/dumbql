# Taiga UI v5 Practices

## Setup
- `provideTaiga()` from `@taiga-ui/core` in `app.config.ts`
- Import design tokens: `@taiga-ui/design-tokens/palette/light.css`
- Component styles: `@taiga-ui/styles`

## Import Pattern
- Import individual components: `import { TuiButton } from '@taiga-ui/core';`
- Secondary entry points ensure tree-shaking

## Theming
- Override `--tui-*` CSS custom properties in `:root`
- Theme toggling via `[tuiTheme]="'dark'"` attribute

## Custom Theme
See `src/styles.scss` for current overrides.
