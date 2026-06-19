1 -# Astro Starter Kit: Minimal
        1 +# DreaMax — Personal Academic Portfolio
        2
        3 -```sh
        4 -npm create astro@latest -- --template minimal
        5 -```
        3 +A cyber-programmer aesthetic personal website built with Astro + Tailwind CSS, showcasing academic research, machine learning projects, algorithm solutions, and
          +tech industry insights.
        4
        7 -> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!
        5 +> **Live site**: [dreamax.pages.dev](https://dreamax.pages.dev)
        6
        9 -## 🚀 Project Structure
        7 +---
        8
       11 -Inside of your Astro project, you'll see the following folders and files:
        9 +## ✨ Features
       10
       11 +- **DreaMax Landing** — Full-screen cyber background with flowing diagonal lines, floating color particles, and VS Code–style decorative code blocks
       12 +- **Academic Portfolio** — Featured research papers with clickable links to arXiv publications
       13 +- **Content Modules** — Machine Learning, Agentic Scholar, Algorithm & Data Structure with cutting-edge research notes
       14 +- **Magic Corner** — Tech industry articles and deep dives (AI commercialization, NVIDIA WAM, DiffusionGemma)
       15 +- **Global Click Effects** — Ripple + floating HTML tag characters on left-click
       16 +- **Dark Cyber Theme** — #121216 deep charcoal background, Poppins + JetBrains Mono fonts, cyan/pink/orange accent system
       17 +- **SEO Optimized** — Auto-generated sitemap, unique meta descriptions per page, semantic heading hierarchy
       18 +- **Deploy Ready** — Static output in `dist/`, compatible with Cloudflare Pages / Vercel / any static host
       19 +
       20 +---
       21 +
       22 +## 🚀 Project Structure
       23 +
       24  ```text
       25  /
       26  ├── public/
       27 +│   ├── images/              # Avatar, article images
       28 +│   ├── files/               # Resume PDF
       29 +│   └── robots.txt           # Search engine crawl config
       30  ├── src/
       17 -│   └── pages/
       18 -│       └── index.astro
       31 +│   ├── components/
       32 +│   │   ├── home/            # DreaMax, ResearchHighlights, ProjectHighlights, RecentUpdates
       33 +│   │   ├── navigation/      # Header with glassmorphism, mobile nav
       34 +│   │   ├── ui/              # Button, Card, Timeline, BackToTop, ScrollIndicator, etc.
       35 +│   │   └── content/         # ArticleCard (reusable content card)
       36 +│   ├── content/             # Future MDX content collections
       37 +│   ├── data/
       38 +│   │   ├── profile.ts       # Personal info, avatar path, CV path, social links
       39 +│   │   ├── navigation.ts    # Nav item config
       40 +│   │   ├── featured.ts      # Featured research papers and projects
       41 +│   │   └── timeline.ts      # Recent updates timeline
       42 +│   ├── layouts/
       43 +│   │   ├── BaseLayout.astro     # HTML shell + fonts + global styles
       44 +│   │   ├── PageLayout.astro     # Header + main + Footer
       45 +│   │   └── ContentLayout.astro  # Article detail layout
       46 +│   ├── pages/
       47 +│   │   ├── index.astro                          # Homepage
       48 +│   │   ├── join.astro                           # Contact / About / CV
       49 +│   │   ├── machine-learning/index.astro          # ML research notes
       50 +│   │   ├── agentic-scholar/index.astro           # Agentic AI notes
       51 +│   │   ├── algorithms/index.astro                # Algorithm notes
       52 +│   │   └── magic-corner/
       53 +│   │       ├── index.astro                       # Article listing
       54 +│   │       ├── ai-charging/index.astro           # Article: AI pricing
       55 +│   │       ├── nvidia-wam/index.astro            # Article: NVIDIA WAM
       56 +│   │       └── diffusion-gemma/index.astro       # Article: DiffusionGemma
       57 +│   └── styles/
       58 +│       └── global.css        # Tailwind + custom theme + animations
       59 +├── astro.config.mjs
       60 +├── tailwind.config.mjs
       61 +├── tsconfig.json
       62  └── package.json
       63  ```
       64
       22 -Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.
       65 +---
       66
       24 -There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.
       25 -
       26 -Any static assets, like images, can be placed in the `public/` directory.
       27 -
       67  ## 🧞 Commands
       68
       30 -All commands are run from the root of the project, from a terminal:
       31 -
       69  | Command                   | Action                                           |
       70  | :------------------------ | :----------------------------------------------- |
       34 -| `npm install`             | Installs dependencies                            |
       35 -| `npm run dev`             | Starts local dev server at `localhost:4321`      |
       36 -| `npm run build`           | Build your production site to `./dist/`          |
       37 -| `npm run preview`         | Preview your build locally, before deploying     |
       71 +| `npm install`             | Install dependencies                             |
       72 +| `npm run dev`             | Start dev server at `localhost:4321`             |
       73 +| `npm run build`           | Build production site to `./dist/`               |
       74 +| `npm run preview`         | Preview build locally before deployment          |
       75  | `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
       39 -| `npm run astro -- --help` | Get help using the Astro CLI                     |
       76
       41 -## 👀 Want to learn more?
       77 +---
       78
       43 -Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
       79 +## 🛠 Tech Stack
       80 +
       81 +| Technology | Purpose |
       82 +|------------|---------|
       83 +| [Astro](https://astro.build) v6 | Static site generation, View Transitions |
       84 +| [Tailwind CSS](https://tailwindcss.com) v4 | Utility-first styling |
       85 +| [astro-sitemap](https://github.com/alextim/astro-sitemap) | Auto-generated sitemap.xml |
       86 +| [Poppins](https://fonts.google.com/specimen/Poppins) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Primary & mono fonts |
       87 +
       88 +---
       89 +
       90 +## 🚀 Deployment
       91 +
       92 +This project outputs a fully static `dist/` folder. Deploy to any static host:
       93 +
       94 +**Cloudflare Pages** (recommended):
       95 +1. Push to GitHub
       96 +2. Connect repo in Cloudflare Pages
       97 +3. Build command: `npm run build`
       98 +4. Build output: `dist`
       99 +
      100 +**Vercel**:
      101 +1. Push to GitHub
      102 +2. Import repo in Vercel
      103 +3. Framework preset: Astro
      104 +
      105 +---
      106 +
      107 +## 📝 Customization
      108 +
      109 +Edit `src/data/` files to update your:
      110 +- **profile.ts** — Name, email, bio, avatar path, CV path, social links
      111 +- **featured.ts** — Research papers and projects
      112 +- **timeline.ts** — Recent updates
      113 +- **navigation.ts** — Navigation menu items
      114 +
      115 +Place your avatar at `public/images/avatar.jpg` and CV at `public/files/cv.pdf`.
      116 +
      117 +---
      118 +
      119 +## 📄 License
      120 +
      121 +MIT — feel free to use this as a template for your own academic portfolio.
