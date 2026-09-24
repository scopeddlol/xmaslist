# xmaslist

A sleek, self-hostable Christmas wishlist. Share one link, and whoever is buying knows exactly
what to get — names, pictures, prices and the sizes you keep forgetting to mention.

One Docker container, one SQLite file, no accounts and no passwords.

```bash
docker run -d -p 3000:3000 -v xmaslist-data:/data ghcr.io/scopeddlol/xmaslist:latest
# → http://localhost:3000
```

## What it does

- **Shopper's view by default.** Opening the site shows the list as a guest sees it: a clean
  grid of gifts, each linking straight out to where it can be bought. Nothing about editing is
  in the way — the pencil in the top right switches to editor mode when you need it.
- **Multiple named lists.** One per person, or one per occasion. Each gets its own shareable URL
  (`/l/ellie`), and the tab bar switches between them.
- **Paste a link, get a gift.** The server fetches the page and pulls out the name, image and
  price from Open Graph tags, Twitter cards or JSON-LD product data. Every field stays editable,
  so you can override anything the site gets wrong — or skip the link entirely.
- **Markdown import.** Drop in a `.md` file (or paste it) and it becomes a list. See
  [`example-list.md`](./example-list.md).
- **Light and dark, phone and desktop.** Built with [Untitled UI](https://www.untitledui.com/)'s
  design system — its colour ramps, type scale, shadows and component patterns — on Tailwind CSS
  v4 and React Aria Components for keyboard and screen-reader support.

## Running it

### From the published image (recommended)

GitHub Actions builds a multi-arch image (`linux/amd64` and `linux/arm64`, so a Raspberry Pi
works too) and publishes it to GitHub Container Registry on every push to `main` and every
`v*.*.*` tag. [`docker-compose.ghcr.yml`](./docker-compose.ghcr.yml) is the only file you need:

```bash
curl -O https://raw.githubusercontent.com/scopeddlol/xmaslist/main/docker-compose.ghcr.yml
docker compose -f docker-compose.ghcr.yml up -d
```

Or without Compose:

```bash
docker run -d --name xmaslist -p 3000:3000 -v xmaslist-data:/data \
    ghcr.io/scopeddlol/xmaslist:latest
```

Updating is a pull and an up:

```bash
docker compose -f docker-compose.ghcr.yml pull && docker compose -f docker-compose.ghcr.yml up -d
```

Tags published: `latest` (the tip of `main`), `v1.2.3`, `1.2`, `1`, the branch name, and
`sha-<short>` if you want to pin exactly. Set `XMASLIST_TAG` to pick one:
`XMASLIST_TAG=v1.0.0 docker compose -f docker-compose.ghcr.yml up -d`.

> **First publish:** new GHCR packages are private. After the first successful run, open the
> package on GitHub → *Package settings* → *Change visibility* → **Public**, otherwise anyone
> pulling it (including you, on another machine) needs `docker login ghcr.io` first.

### Building from source

[`docker-compose.yml`](./docker-compose.yml) builds the image from this checkout instead of
pulling it:

```bash
docker compose up -d --build
```

Or by hand:

```bash
docker build -t xmaslist .
docker run -d --name xmaslist -p 3000:3000 -v xmaslist-data:/data xmaslist
```

Either way the list lives in the `xmaslist-data` volume, so it survives rebuilds. Change the
published port with `PORT=8080 docker compose up -d`.

### Local development

```bash
npm install
npm run dev        # http://localhost:3000, database at ./data/xmaslist.db
npm run typecheck
```

There is a browser smoke test covering the whole flow — creating a list, pulling details from a
link, adding and reordering gifts and importing markdown. It drives a running
server and serves its own fake shop page, so nothing external is needed:

```bash
npm run build && npm start
npx playwright@latest install chromium
npm run test:e2e   # BASE_URL=http://localhost:3000 by default
```

### Configuration

| Variable        | Default              | What it does                          |
| --------------- | -------------------- | ------------------------------------- |
| `PORT`          | `3000`               | Port the server listens on            |
| `DATABASE_PATH` | `/data/xmaslist.db`  | Where the SQLite file is written      |

### Backups

Everything is in one SQLite file. To take a copy:

```bash
docker run --rm -v xmaslist-data:/data -v "$PWD:/backup" busybox \
    sh -c "cp /data/xmaslist.db* /backup/"
```

## Continuous integration

[`.github/workflows/docker-publish.yml`](./.github/workflows/docker-publish.yml) runs on pushes to
`main`, on `v*.*.*` tags, on pull requests and on demand:

1. **check** — `npm ci`, `npm run typecheck`, `npm run build`. Fails fast without touching Docker.
2. **image** — builds for `linux/amd64` and `linux/arm64` with Buildx, layer-caching through GitHub
   Actions cache, and pushes to GHCR with a provenance attestation.

Pull requests build the image but do not push it, so a fork's PR cannot publish. Nothing to
configure: it authenticates with the automatic `GITHUB_TOKEN`.

To cut a release:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Markdown import format

Bullets, numbered lists, checkboxes and tables all work. The parser picks out the link, price,
currency, quantity and notes; anything it cannot classify becomes the gift name.

```markdown
# Ellie's Christmas list

- [Lego Millennium Falcon](https://lego.com/…) — £159.99 — the big display one
- [Merino wool socks](https://example.com/socks) — £32 ×3 — size medium
- Wax candle set — £24

| Item | Link | Price | Notes |
| --- | --- | --- | --- |
| Chemex filters | https://example.com/filters | £12 | the square ones |
```

- An `# H1` names the new list; the paragraph under it becomes the description.
- Prices are read from `$`, `£`, `€`, `¥`, `₹`, `kr`, `zł` or an ISO code, in either
  `1,299.00` or `1.299,00` form.
- `×3` or `x3` sets the quantity.
- Import into an existing list or a brand new one — your choice, in the dialog.

## How it is put together

| Path                  | What lives there                                            |
| --------------------- | ----------------------------------------------------------- |
| `src/app/`            | Pages and the JSON API (`/api/lists`, `/api/items`, …)       |
| `src/components/`     | The app shell, gift cards and dialogs                        |
| `src/components/ui/`  | Untitled UI primitives: button, fields, badge, modal         |
| `src/lib/db.ts`       | SQLite connection and schema (created on first run)          |
| `src/lib/scrape.ts`   | Link metadata extraction                                     |
| `src/lib/markdown.ts` | Markdown list parser                                         |
| `src/app/globals.css` | Untitled UI design tokens, light and dark                    |

Next.js builds to a standalone bundle, so the runtime image is just Node, the server and the
traced dependencies — no `npm install` at boot.

## A note on trust

There are no accounts by design: anyone with the link can view and edit. That is the point
for a family list on a home network or behind a reverse proxy — but do not put it on the open
internet with anything you would mind a stranger changing. If you need it public, put it behind
your proxy's basic auth or a VPN.
