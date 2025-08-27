# Typesense Dashboard

Typesense Dashboard is a Vue 3 + Quasar Framework + TypeScript web application for managing and browsing Typesense collections. It can be built as both a web application and desktop application using Electron.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

- **Install dependencies:**
  - `npm install` -- takes 31 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- **Build the web application:**
  - `npm run build` -- takes 23 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- **Build the desktop application:**
  - `npm run build:desktop` -- takes 58 seconds. NEVER CANCEL. Set timeout to 90+ minutes.
  - Creates packages for Linux, macOS, and Windows in `dist/electron/Packaged/`
- **Run development server:**
  - Web: `npm run dev` -- starts on port 9000
  - Desktop: `npm run dev:desktop` -- fails in sandboxed environments due to Electron security requirements (this is expected)
- **Lint and format code:**
  - `npm run lint` -- takes 8 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
  - `npm run format` -- takes 2 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
- **Test the application:**
  - `npm run test` -- no actual tests exist, just echoes "No test specified"

## Validation

- **ALWAYS** run `npm run lint` and `npm run format` before committing changes or the CI (.github/workflows/build_deploy.yml) will fail.
- **ALWAYS** manually validate web application changes by:
  1. Building with `npm run build`
  2. Serving the built application from `dist/spa/` (e.g., with `python3 -m http.server 8080`)
  3. Testing that the application loads at http://localhost:8080 and shows the login form
  4. Verifying the page title shows "Typesense-Dashboard"
- **VALIDATION SCENARIOS**: When making changes to the dashboard:
  1. Test the application loads correctly and shows the login form with fields for Host, Port, Protocol, Path, and API Key
  2. Verify the navigation menu structure is intact (if making navigation changes)
  3. Test any specific functionality you modified
- You can build and run both web and desktop versions of the application
- Desktop development mode (`npm run dev:desktop`) will fail in sandboxed environments - this is expected and documented limitation
- Docker builds may fail in network-restricted environments - this is a limitation of the testing environment, not the code
- The built application should be accessible via HTTP server and display the correct login interface

## Common Tasks

The following are outputs from frequently run commands. Reference them instead of viewing, searching, or running bash commands to save time.

### Repository Root

```
ls -la
.dockerignore
.editorconfig
.git
.github
.gitignore
.prettierrc.json
.quasar/
.vscode/
Dockerfile
LICENSE.txt
README.md
config.json.autologin
config.json.sample
dist/ (created after build)
docs/
eslint.config.js
index.html
node_modules/ (created after npm install)
package-lock.json
package.json
postcss.config.js
public/
quasar.config.ts
src/
src-electron/
tsconfig.json
typesense-test-server/
```

### Package.json Scripts

```
"scripts": {
  "lint": "eslint -c ./eslint.config.js \"./src*/**/*.{ts,js,cjs,mjs,vue}\"",
  "format": "prettier --write \"**/*.{js,ts,vue,scss,html,md,json}\" --ignore-path .gitignore",
  "test": "echo \"No test specified\" && exit 0",
  "dev": "quasar dev",
  "dev:desktop": "quasar dev -m electron --devtools",
  "build": "quasar build",
  "build:desktop": "quasar build -m electron --target all",
  "postinstall": "quasar prepare"
}
```

### Key Dependencies

- Vue 3.5.17
- Quasar Framework 2.18.1
- TypeScript 5.8.3
- Electron 37.2.0 (for desktop builds)
- Typesense 2.0.3
- Monaco Editor 0.52.2 (for code editing)

### Project Structure

- `src/` - Main Vue application source code
  - `src/pages/` - Page components (Collections, Search, ApiKeys, etc.)
  - `src/components/` - Reusable components
  - `src/stores/` - Pinia stores for state management
  - `src/router/` - Vue Router configuration
  - `src/shared/` - Shared utilities and API client
- `src-electron/` - Electron-specific code for desktop builds
- `quasar.config.ts` - Quasar framework configuration
- `eslint.config.js` - ESLint configuration
- `.prettierrc.json` - Prettier formatting configuration
- `config.json.sample` - Sample configuration for auto-login

### Build Outputs

- Web build: `dist/spa/` - Static files ready for web deployment
- Desktop build: `dist/electron/Packaged/` - Contains platform-specific executables:
  - `Typesense-Dashboard-linux-x64/`
  - `Typesense-Dashboard-darwin-x64/`
  - `Typesense-Dashboard-mas-x64/`
  - `Typesense-Dashboard-win32-x64/`

### Configuration

- Development servers use port 9000 by default
- The application can be configured with `config.json` for auto-login and UI customization
- See `config.json.sample` for configuration options
- Environment can be tested with local Typesense instances using `typesense-test-server/docker-compose.yml`
  - Provides multiple Typesense versions (v17.0 to v28.0) on different ports
  - Default API key is "dev"
  - Example: Typesense v28 runs on port 8128, v27 on 8127, etc.

### CI/CD Workflows

- `.github/workflows/build_deploy.yml` - Builds and deploys to GitHub Pages
- `.github/workflows/build_docker.yml` - Builds and publishes Docker images
- `.github/workflows/release_tags.yml` - Handles release automation
