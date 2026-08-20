# Logseq Plugin Bidi

Bidirectional text and RTL block layout support for modern [Logseq](https://github.com/logseq/logseq) builds.

This plugin ports the important behavior from [Logseq PR #12526](https://github.com/logseq/logseq/pull/12526) into a plugin that works on newer Logseq versions. It keeps the implementation deliberately small: infer each block's direction from its rendered content, apply `dir="auto"` where Logseq needs browser bidi handling, and patch only the block layout CSS needed for RTL rows.

![Logseq Plugin Bidi showing LTR and RTL blocks aligned by content direction](./screenshot.png)

## What It Does

- Applies `dir="auto"` to block content, page title, editor textarea, and Logseq's hidden `#mock-text` editor mirror.
- Delegates Unicode first-strong direction detection to the browser.
- Uses `dir="auto"` and `:dir(rtl)` on desktop when the graph DOM is accessible.
- Uses Logseq API data plus compact block-id-targeted CSS on Logseq web, where the plugin iframe cannot access the host DOM.
- Adds block context-menu actions for automatic, right-to-left, and left-to-right direction; stores forced choices as a hidden Logseq block property.
- Keeps settings minimal; the only plugin setting is debug logging.

## Development Note

This plugin was developed with AI-assisted coding. Changes are still reviewed, tested, and released by the maintainer.

## Runtime Paths

- `src/direction.ts`: browser-native bidi probing and inline/page-reference text extraction.
- `src/desktop-runtime.ts`: host-DOM `dir="auto"` runtime.
- `src/web-fallback-runtime.ts`: Logseq web API/CSS fallback runtime.
- `src/host-css.ts`: static desktop RTL layout CSS.
- `src/web-fallback-css.ts`: compact generated CSS for web fallback block ids.
- `src/base-css.ts`: startup CSS composition.

Debug logging reports which runtime is active when enabled. Web row mirroring depends on Logseq's current-page APIs; aggregate routes that expose no current page receive only the static text-direction handling until Logseq supplies block context.

## Manual Direction

Right-click a block's bullet and choose:

- **Automatic direction** to remove the override and return to first-strong detection.
- **Right-to-left direction** to force RTL.
- **Left-to-right direction** to force LTR.

Context-menu overrides are stored as hidden Logseq properties so they do not clutter the block. Manually written `direction:: rtl`, `direction:: ltr`, and `direction:: auto` properties remain supported.

## Development

```bash
pnpm install
pnpm run build
pnpm run dev
```

The Vite server is configured through [`vite-plugin-domain`](https://github.com/mustafa0x/vite-plugin-domain) for:

```text
https://logseq-plugin-bidi.localhost
```

If the local HTTPS domain has not been trusted yet, install Caddy and run:

```bash
sudo caddy trust
caddy run
```

Then install the plugin in Logseq from:

```text
https://logseq-plugin-bidi.localhost
```

Logseq fetches `package.json` from that URL and loads the configured `dist/index.html` entry.

## Desktop Loading

1. Enable Developer mode in Logseq.
2. Open Plugins > Load unpacked plugin.
3. Select this directory: `logseq-plugin-bidi`.
4. After code changes, rebuild and reload the plugin:

```bash
pnpm run build
```

## Validation

Run the full local check before shipping changes:

```bash
pnpm run check
```

Or run individual steps:

```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

## Release

1. Confirm the package version in `package.json`.
2. Run the local release checks:

```bash
pnpm outdated
pnpm run check
```

3. Create and push a version tag:

```bash
git tag v<package-version>
git push origin v<package-version>
```

4. Wait for `.github/workflows/publish.yml` to create the GitHub release from `CHANGELOG.md` and attach `logseq-plugin-bidi.zip`.
5. Install the release ZIP in Logseq and verify desktop and web behavior before submitting to the marketplace.

The release ZIP contains the built plugin files at the archive root:

```text
package.json
README.md
CHANGELOG.md
LICENSE
icon.png
screenshot.png
dist/
```

## Marketplace

Submit the plugin to `logseq/marketplace` with a package directory like:

```text
packages/logseq-plugin-bidi/
  manifest.json
  icon.png
```

Marketplace manifest draft:

```json
{
  "title": "Logseq Plugin Bidi",
  "description": "Bidirectional text and RTL block layout support for Logseq.",
  "author": "yshalsager",
  "repo": "yshalsager/logseq-plugin-bidi",
  "icon": "icon.png",
  "theme": false,
  "web": true,
  "effect": false,
  "supportsDB": true
}
```

Before opening the marketplace PR, make sure the GitHub release has a ZIP asset and the ZIP installs cleanly.

## Troubleshooting

Use debug logging only while diagnosing a direction or layout issue.

If `dev` reports that port `5173` is already in use, stop the old Vite process first. To inspect or clear local domain mappings:

```bash
pnpm run domain:manage
```
