# Villa Solstice — Cinematic Architectural Real Estate Showcase

An investor-facing, high-end architectural real estate website featuring a scroll-driven cinematic walkthrough, milestone narrative overlays, and an institutional investment portfolio presentation.

---

## 🏛️ Project Overview

**Villa Solstice** presents a premier private residential estate. Instead of an uncontrollable video autoplay, the website utilizes an interactive, high-performance HTML5 `<canvas>` sequence driven by user scroll. As the investor scrolls through the page, the architectural walkthrough advances seamlessly forward or in reverse with smooth inertia, fluidly unveiling key design philosophies, financial metrics, and curated portfolio highlights.

---

## 💻 Tech Stack

- **Frontend Core:** Semantic HTML5, Vanilla CSS3 (Custom Properties, Fluid Clamp Typography, CSS Grid, Flexbox, `overflow-x: clip`).
- **Canvas Rendering Engine:** HTML5 2D Canvas with `requestAnimationFrame` interpolation, linear lerp smoothing, and aspect-ratio cover geometry.
- **Asset Pipeline:** FFmpeg 9.0.1 Essentials (Lanczos scaling, custom quantization, high-framerate extraction).
- **Typography:** Fraunces (Editorial Serif Display), Manrope (Architectural Body Sans), IBM Plex Mono (Financial Data).
- **Deployment Platform:** Static web architecture optimized for **GitHub → Vercel** with global Edge CDN caching.

---

## 🎬 How the Cinematic Scroll Animation Works

1. **Scroll Tracking:** The document scroll position (`window.scrollY`) relative to the hero section (`500vh`) is measured on each scroll event.
2. **Progress Calculation:** Progress is normalized from `0.0` (estate entrance) to `1.0` (grand garden terrace).
3. **Interpolation Loop:** A `requestAnimationFrame` loop uses linear interpolation (`currentFrameFloat += (target - currentFrameFloat) * 0.5`) to eliminate jitter and give the playback natural cinematic momentum without lag.
4. **Adaptive Canvas Drawing:** The targeted frame is projected onto the responsive `<canvas>` using dynamic scale-to-cover math that preserves the native 16:9 aspect ratio without stretching or letterboxing.
5. **Intelligent Frame Preloader:**
   - Preloads the critical initial frame for instant first contentful paint.
   - Loads the first 15 frames immediately to unlock interactivity in under 150ms.
   - Background-streams the remaining frames in non-blocking batches.
   - Dynamically prioritizes frames within a 25-frame radius of the user's active scroll target.
   - Uses an instant nearest-frame fallback so the canvas never drops to black or freezes during rapid scrubbing.
6. **Synchronized 5-Phase Narrative Overlays:**
   - **0% – 20%:** Brand & Entrance Facade (`Where Architecture Meets Opportunity`).
   - **20% – 40%:** Architectural Rigor & Material Truth (`Sculpted With Material Truth`).
   - **40% – 60%:** Curated Portfolio & Living Spaces (`Crafted for Visionary Living`).
   - **60% – 80%:** Capital Preservation & Institutional Value (`Invest With Absolute Confidence`).
   - **80% – 100%:** Private Allocations & Acquisition CTAs (`Secure Your Private Residence`).

---

## 🎞️ Frame Generation & Specifications

Frames were extracted directly from the master 20-second 4K/HD drone walkthrough video using FFmpeg:

### Desktop Frame Sequence (`frames-desktop/`)
- **Source:** `videos/VID_20260921_133805_972.mp4`
- **Duration:** 20.01 seconds
- **Frame Rate:** 24 fps (native playback speed)
- **Frame Count:** **480 frames** (`frame_0001.jpg` – `frame_0480.jpg`)
- **Resolution:** `854 × 480 px` (16:9 landscape)
- **Total Folder Size:** `19.06 MB` (~40.6 KB per frame average)

### Mobile Frame Sequence (`frames-mobile/`)
- **Source:** `videos/VID_20260921_133805_972.mp4`
- **Duration:** 20.01 seconds
- **Frame Rate:** 20 fps (optimized for mobile bandwidth & memory)
- **Frame Count:** **400 frames** (`frame_0001.jpg` – `frame_0400.jpg`)
- **Resolution:** `640 × 360 px` (Lanczos scaled)
- **Total Folder Size:** `9.36 MB` (~23.9 KB per frame average)

### Architectural Stills (`images/`)
- 6 high-resolution stills extracted at key architectural milestones for project portfolio cards and modal views (`solstice-dusk-estate.jpg`, `solstice-travertine-entry.jpg`, `azure-pavilion.jpg`, `horizon-terrace.jpg`, `verona-atrium.jpg`, `solstice-grand-salon.jpg`).

---

## 🚀 Local Development

To run and preview the website locally on your computer:

1. Open PowerShell or Command Prompt in the project directory:
   ```powershell
   cd "path/to/Realestate_website"
   ```

2. Start the local development server:
   ```powershell
   python -m http.server 8000
   ```

3. Open your browser to:
   - **http://localhost:8000** (or http://localhost:8000/index.html)

---

## 📦 GitHub Setup & Push Instructions

1. Initialize git and commit the production assets:
   ```bash
   git init
   git add .
   git commit -m "feat: production-ready cinematic architectural real estate showcase"
   ```

2. Link your GitHub repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

*(Note: `.gitignore` is already configured to exclude heavy raw MP4 files from `videos/` and temporary test screenshots, keeping your GitHub repository lean, fast to clone, and within GitHub file-size limits).*

---

## ⚡ Vercel Deployment Instructions

### Method A: Deploy via GitHub (Recommended / Easiest)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** → **"Project"**.
3. Select your newly created GitHub repository.
4. Framework Preset: **Other** (Root directory: `./`).
5. Click **"Deploy"**.
6. In ~15 seconds, your site will be live with free global HTTPS, CDN caching, and custom domain support!

### Method B: Deploy via Vercel CLI
If you have Node.js and Vercel CLI installed:
```bash
npm i -g vercel
vercel
```
Follow the interactive prompts and choose default settings.

---

## 🔒 Production Compatibility & Caching (`vercel.json`)
The included `vercel.json` applies immutable caching (`Cache-Control: public, max-age=31536000, immutable`) to all frames in `frames-desktop/`, `frames-mobile/`, and `images/`. When deployed on Vercel's Edge Network, assets are served from regional points of presence with sub-10ms response times worldwide.
