<div align="center">
<img 
  alt="Project Logo 1" 
  src="src/assets/react.svg"
  width="60px"/>
<img 
  alt="Project Logo 2" 
  src="src/assets/vite.svg" 
  width="60px"/>
</div>
<h1 align="center">
React + Vite Architecture
</h1>

## Primary Project Docs
### Quickstart
With the latest LTS (long-term support) version of Node.js, run the following from the root of the directory:
```bash
npm install
```

### Quickrun
From the root of the directory, run the following to start the web server and open the app:
```bash
npm run dev
```

### Quick Deploy
From the root of the directory, run the following shell script with your commit message:
```bash
source deploy.sh "add your commit message here"
```

### ⚠️ Gotchas ⚠️: 

#### Guide for Setting up Vite App for GitHub Pages

1️⃣ Add `base: ''`, to your `vite.config.js` file.
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [react(), tsconfigPaths()],
});
```

2️⃣ From the root of the project, run this command to add `gh-pages` as a dependency:
```bash
npm install gh-pages --save-dev
```

3️⃣ Add these two lines to `package.json` file under the `"scripts"` property `"deploy": "gh-pages -d dist"`.
```json
// package.json
{
  "name": "name-of-your-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --open",
    "build": "tsc -b && vite build",
    "deploy": "gh-pages -d dist",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  // ... rest of package.json attributes ...
}
```

4️⃣ From the root of the project, run the following commands:
```bash
npm run build && npm run deploy
```

***Or*** (optionally and recommended) from the root of the project, run the following command with you commit message:
```bash
source deploy.sh "add your commit message here"
```

5️⃣ Check your repository's pages settings, the`gh-pages` branch should be selected.

#### Image Source URIs
Ensure that you *do not* add a "`/`" at the beginning of image source URIs. For example, if you want to use the image `culture.jpg` in your app, ensure the source and URI are `src="culture.jpg"`, *not* `src="/culture.jpg"`. Otherwise, Vite will not be able to find the image.

## Generated React + Vite + SWC + TypeScript App Docs
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

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

export default tseslint.config([
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
