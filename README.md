<div align="center">
<!-- <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" /> -->

# Image Color Editor

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Upload an image, pick a color, and replace it — entirely in the browser. No backend, no API keys.

</div>

---

## Demo

<!-- Add a product demo video or GIF here -->
<!-- Example: <video src="demo.mp4" controls width="100%"></video> -->
<!-- Or: ![Demo](demo.gif) -->

> **Coming soon** — drop a screen recording or GIF in this section.

---

## Features

- **Upload any image** — PNG, JPG, and other common formats
- **Auto color extraction** — detects prominent colors from your image on upload
- **Targeted replacement** — pick a specific color to replace, or apply to all colors at once
- **Tolerance slider** — fuzzy-match similar shades (0–150 range) for natural-looking results
- **Live preview** — side-by-side original vs. result as you adjust settings
- **Undo / Redo** — full history for every change you make
- **One-click download** — export the final image as a PNG
- **Stacks changes** — apply multiple color replacements in sequence

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS (CDN) |
| Icons | Lucide React |
| Image processing | HTML5 Canvas API |

All processing runs client-side — no server, no external AI service, no data leaves your browser.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later

### Installation

```bash
git clone https://github.com/your-username/imagecoloreditor.git
cd imagecoloreditor
npm install
```

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

---

## License

MIT
