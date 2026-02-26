<p align="center">
  <a href="https://pilot-ops.vercel.app" rel="noopener">
 <img width=750px height=394px src="https://pilot-ops.vercel.app/og.png" alt="Pilot - Marketing & Waitlist Site"></a>
</p>

<h3 align="center">Pilot - Marketing & Waitlist Website</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/pilot-ops-crm/website.svg)](https://github.com/pilot-ops-crm/website/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/pilot-ops-crm/website.svg)](https://github.com/pilot-ops-crm/website/pulls)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()

</div>

---

<p align="center">
  The front door to Pilot — a simple, friendly site where you can learn what Pilot is all about and join the waitlist to get early access when we launch.
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Usage](#usage)
- [Built Using](#built_using)
- [Integration with Main App](#integration)
- [Deployment](#deployment)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

This is the frontend that introduces people to Pilot. It's a clean, simple site that explains what the app does and lets visitors join a waitlist for early access.

The main idea is straightforward: show off the app's features, tell the story of how it helps creators turn Instagram followers into customers, and collect email addresses from people who want to try it first.

It doesn't handle any of the heavy lifting — that all happens in the main app. This site just looks good, explains things clearly, and passes along signups to the real application through a secure API connection.

**We built it** to be fast and focused. It uses modern web tools but keeps things simple so it loads quickly and works on any device. The waitlist form is the key feature — when someone signs up, it securely sends their info to the main app for processing.

## 🏁 Let's Get You Set Up

Want to run this marketing site locally? Here's what you need to do.

### What You Need First

- Node.js version 18 or newer
- pnpm (it's like npm but faster)
- The WAITLIST_API_TOKEN from the main app (you'll get this from the main app's environment)

### Getting It Running

1. **Grab the code**

   ```bash
   git clone https://github.com/pilot-ops-crm/website.git
   cd website
   ```

2. **Install everything**

   ```bash
   pnpm install
   ```

3. **Set up your environment**
   Copy `.env.example` to `.env.local` and add your WAITLIST_API_TOKEN:
   ```env
   WAITLIST_API_TOKEN=your_token_from_main_app
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

The site should be running at `http://localhost:3000`.

## 🎈 How to Use It

### What It Does

1. **Landing Page**
   Shows what Pilot is all about, explains the main features, and guides people toward signing up.

2. **Waitlist Form**
   A simple form where visitors enter their email and name. When they submit, it securely sends this info to the main app for processing.

3. **Responsive Design**
   Looks good on phones, tablets, and computers. Uses modern styling that matches the main app's design.

### The Waitlist Flow

1. Someone visits the site and reads about Pilot
2. They click to join the waitlist
3. They enter their email and name in the form
4. The site sends this info to the main app using a secure token
5. The main app processes it and adds them to the waitlist
6. They get confirmation that they're signed up

It's all handled behind the scenes — the marketing site just collects the info and passes it along.

## 🔧 Integration with Main App

This site talks to the main Pilot app through a secure API connection. Here's how it works:

### The Connection

- Uses a special token (`WAITLIST_API_TOKEN`) to authenticate with the main app
- Sends waitlist signups to `https://pilot-ops-app.vercel.app/api/waitlist`
- The main app handles storing the data and managing the waitlist

### Getting the WAITLIST_API_TOKEN

To set up the connection between the marketing site and main app, you just need to generate the same token in both repositories' environment variables:

1. **Generate a secure token** (can be any random string like `your-super-secret-token-12345`)
2. **Add to marketing site** (this repo): Set `WAITLIST_API_TOKEN=your-token-here` in your `.env.local`
3. **Add to main app** (`pilot-ops-crm/app`): Set `WAITLIST_API_TOKEN=your-token-here` in your `.env.local`

The token doesn't need to be complex - just make sure it's the same in both places and keep it secure.

### Security

- The token is stored as an environment variable (never in the code)
- All communication happens over HTTPS
- The marketing site doesn't store any sensitive data — it just passes it along

### Why This Setup?

It keeps things separate: the marketing site handles the pretty frontend, and the main app handles the real work. This way, the marketing site stays fast and focused, while the main app can grow and change without affecting the public face of the project.

## 🚀 Putting It Live

This site is set up to deploy on Vercel, just like the main app.

### Getting It Live

1. **Vercel Setup**
   Connect your GitHub repo to Vercel, set up the environment variables in their dashboard, and it will deploy automatically when you push to main.

2. **Environment Variables You Need**
   ```env
   WAITLIST_API_TOKEN=your_token_from_main_app
   ```

3. **Custom Domain**
   Set up your custom domain in Vercel and make sure it matches what you want.

The site will be live and ready to collect waitlist signups!

## ⛏️ What We Built It With

### Core Stuff

- **Next.js** with the App Router for the main framework
- **React** for the user interface (version 19)
- **TypeScript** to catch errors before they happen
- **Node.js** to run everything

### UI and Design

- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Next Themes** for dark/light mode

### Making It Work

- **Axios** for sending data to the main app
- **Vercel Analytics** for tracking how people use the site

### Development Tools

- **Vercel** for hosting and deployment
- **pnpm** for managing packages
- **ESLint** to check code quality

## ✍️ Who Built This

- **ArjunCodess** - **We made this and we keep working on it**

**We believe** in open source because it keeps things honest and helps everyone get better together. If you want to collaborate or have questions, just reach out.

## 🎉 Thanks to

- **Vercel** for making deployment so smooth
- **shadcn/ui** for great components we could build on
- **The main Pilot app** for handling all the real work behind the scenes
- **Everyone in open source** who shares their work and makes this possible

---

<div align="center">

**Pilot** - Transforming Instagram interactions into business opportunities

_Built with ❤️ for creators and entrepreneurs_

</div>
