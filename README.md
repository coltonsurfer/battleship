# Cattle Clash - Western Battleship

A western-themed battleship game with cowboy aesthetics and immersive audio.

## Features

### Game Modes & Difficulty
- **Easy Mode**: Random shot selection
- **Medium Mode**: Uses parity/checkerboard pattern for efficient searching
- **Hard Mode**: **SUPER CHALLENGING** - Advanced AI with:
  - Probability-based heatmap targeting
  - Ship-length weighted calculations
  - Pattern recognition and line detection
  - Strategic center-board prioritization
  - Aggressive hunt mode with 50x bonus for adjacent hits
  - Intelligent line-following when ships are detected
  - Checkerboard optimization for maximum efficiency

### Audio System
The game includes a complete western-themed audio system using the Web Audio API:

- **Entrance Theme**: Triumphant western chord progression when entering the game
- **Gunshot Sounds**: Sharp gunshot effects when firing at enemy ships
- **Hit Sounds**: Metallic clang when successfully hitting a ship
- **Miss Sounds**: Water splash effects when missing
- **Victory/Defeat**: Celebratory or somber tunes when the game ends

**Audio Controls**: Use the 🔊/🔇 button in the control panel to toggle audio on/off.

### Typography
- **Hero Title**: Rye font for authentic western branding
- **Headers**: Cinzel font for elegant section headers
- **Body Text**: Roboto Slab for comfortable readability

### Visual Design
- Modern gaming hero section with gradient backgrounds
- Animated particle effects
- Real-time ship status tracking in Arsenal Showcase
- Ship sprites with damage indicators
- **Western Map Animation**: Vintage paper map with compass rose and radar-style scanning while AI is thinking

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
