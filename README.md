# Random Shape Whiteboard

This project is a standard Vite + React app that generates a whiteboard full of randomly arranged shapes.

For usage instructions, see [TRAINING_MANUAL.md](./TRAINING_MANUAL.md).

## Local development

```bash
nvm use
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
npm run build
npm run test:smoke
```

The smoke test serves the built app with Vite preview and verifies that the main UI renders in Chromium without page-level JavaScript errors.

## GitHub Pages deployment

The repository includes `.github/workflows/deploy.yml` for GitHub Pages deployment via GitHub Actions.

After pushing to `main`, enable Pages in the repository settings and choose **GitHub Actions** as the source. The deploy workflow runs dependency install, unit tests, production build, Playwright smoke test, and then uploads the Pages artifact.
