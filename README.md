# DreaMax — Personal Academic Portfolio

A cyber-programmer aesthetic personal website built with Astro + Tailwind CSS, showcasing academic research, machine learning projects, algorithm solutions, and tech industry insights.

> **Live site**: [dreamax.pages.dev](https://dreamax.pages.dev)

---

## ✨ Features

- **DreaMax Landing** — Full-screen cyber background with flowing diagonal lines, floating color particles, and VS Code–style decorative code blocks
- **Academic Portfolio** — Featured research papers with clickable links to arXiv publications
- **Content Modules** — Machine Learning, Agentic Scholar, Algorithm & Data Structure with cutting-edge research notes
- **Magic Corner** — Tech industry articles and deep dives (AI commercialization, NVIDIA WAM, DiffusionGemma)
- **Global Click Effects** — Ripple + floating HTML tag characters on left-click
- **Dark Cyber Theme** — #121216 deep charcoal background, Poppins + JetBrains Mono fonts, cyan/pink/orange accent system
- **SEO Optimized** — Auto-generated sitemap, unique meta descriptions per page, semantic heading hierarchy
- **Deploy Ready** — Static output in `dist/`, compatible with Cloudflare Pages / Vercel / any static host

---

## 🚀 Project Structure

```text
/
├── public/
│   ├── images/              # Avatar, article images
│   ├── files/               # Resume PDF
│   └── robots.txt           # Search engine crawl config
├── src/
│   ├── components/
│   │   ├── home/            # DreaMax, ResearchHighlights, ProjectHighlights, RecentUpdates
│   │   ├── navigation/      # Header with glassmorphism, mobile nav
│   │   ├── ui/              # Button, Card, Timeline, BackToTop, ScrollIndicator, etc.
│   │   └── content/         # ArticleCard (reusable content card)
│   ├── content/             # Future MDX content collections
│   ├── data/
│   │   ├── profile.ts       # Personal info, avatar path, CV path, social links
│   │   ├── navigation.ts    # Nav item config
│   │   ├── featured.ts      # Featured research papers and projects
│   │   └── timeline.ts      # Recent updates timeline
│   ├── layouts/
│   │   ├── BaseLayout.astro     # HTML shell + fonts + global styles
│   │   ├── PageLayout.astro     # Header + main + Footer
│   │   └── ContentLayout.astro  # Article detail layout
│   ├── pages/
│   │   ├── index.astro                          # Homepage
│   │   ├── join.astro                           # Contact / About / CV
│   │   ├── machine-learning/index.astro          # ML research notes
│   │   ├── agentic-scholar/index.astro           # Agentic AI notes
│   │   ├── algorithms/index.astro                # Algorithm notes
│   │   └── magic-corner/
│   │       ├── index.astro                       # Article listing
│   │       ├── ai-charging/index.astro           # Article: AI pricing
│   │       ├── nvidia-wam/index.astro            # Article: NVIDIA WAM
│   │       └── diffusion-gemma/index.astro       # Article: DiffusionGemma
│   └── styles/
│       └── global.css        # Tailwind + custom theme + animations
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

---

## 🧞 Commands

| Command                   | Action                                          |
| :------------------------ | :---------------------------------------------- |
| `npm install`             | Install dependencies                            |
| `npm run dev`             | Start dev server at `localhost:4321`            |
| `npm run build`           | Build production site to `./dist/`              |
| `npm run preview`         | Preview build locally before deployment         |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

---

## 🛠 Tech Stack

| Technology    | Purpose                                 |
| :------------ | :-------------------------------------- |
| Astro v6      | Static site generation, View Transitions |
| Tailwind CSS v4 | Utility-first styling                 |
| astro-sitemap | Auto-generated sitemap.xml              |
| Poppins + JetBrains Mono | Primary & mono fonts      |

---

## 🚀 Deployment

This project outputs a fully static `dist/` folder. Deploy to any static host:

### Cloudflare Pages (recommended)
1. Push to GitHub
2. Connect repo in Cloudflare Pages
3. Build command: `npm run build`
4. Build output: `dist`

### Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Framework preset: **Astro**

---

## 📝 Customization

Edit `src/data/` files to update your:

- **profile.ts** — Name, email, bio, avatar path, CV path, social links
- **featured.ts** — Research papers and projects
- **timeline.ts** — Recent updates
- **navigation.ts** — Navigation menu items

Place your avatar at `public/images/avatar.jpg` and CV at `public/files/cv.pdf`.

---

## 📄 License

MIT — feel free to use this as a template for your own academic portfolio.
