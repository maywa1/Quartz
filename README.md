# Overview

This is a very early-stage offline note-taking and drawing app (it's made for math, but there isn't anything math specific yet) built on TanStack Start.

It uses excalidraw as the current drawing engine and adds a layer that connects drawings to coordinates in PDF documents.

The project is far from done. The structure, features, and even core systems might change as the project evolves.

Contributions are welcome :)

*(I won't be developing much now because the app is in a usable state and I'm currently studying for some exams using it)*

---

# Try out the app!
[App still in early stages be nice :)](https://quartz.maywai.net)

---
# TODO
- Make a landing page in /about
- Dark Mode / Appearance options
- Write tests
- Make a fixed pdfs for things that you constantly have to check, for example a formula sheet provided by exams
- add a calculator to the sidebar
- Add more filtering options to the Explorer component
- Everything else that turns this into a real project

I plan on building a custom GPU-accelerated drawing engine designed for math use cases, which will be a separate project of mine which I won't touch yet.


---
# Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```
---

# Building For Production

```bash
npm run build
```

---

# Testing

This project uses Vitest.

```bash
npm run test
```

Tests are not implemented :p

---

# Styling
use the css variables in styles.css

---
# Linting & Formatting

```bash
npm run lint
npm run format
npm run check
```

---
# Notes

This project is still in early development. But I'll try not implementing breaking changes.

If you want to contribute, feel free to open a PR or discussion.

