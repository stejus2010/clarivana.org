# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Hosting on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. The included workflow builds and deploys automatically to `https://<user>.github.io/<repo>/`.
4. In Firebase Console → Authentication → Settings → Authorized domains, add `<user>.github.io`.

Local static build: `PAGES_BASE=/<repo>/ bun run build:pages` → output in `dist/client`.
