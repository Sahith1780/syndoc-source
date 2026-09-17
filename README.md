# SynDoc 2.0 📝⚡

> **Write together. Never lose a keystroke.**
> A real-time, conflict-free collaborative document editor featuring CRDT merging, live presence, personalized cursors, and cross-device failure recovery.

---

## 📌 Overview

**SynDoc 2.0** is a full-stack real-time collaborative rich text editor built for the **Track 3: Full Stack Engineering** hackathon challenge. 

In distributed environments, synchronizing simultaneous multi-user edits without race conditions, data loss, or visual stutter is a major engineering hurdle. SynDoc 2.0 addresses this by using **Yjs CRDTs (Conflict-free Replicated Data Types)** to merge concurrent character-level edits deterministically across clients without relying on "Last-Write-Wins" (LWW) strategies.

---

## ✨ Features

- **⚡ Conflict-Free Real-Time Collaboration:** Powered by Yjs CRDTs. Simultaneous character-level changes merge deterministically without overwriting concurrent edits.
- **👥 Live Presence & Active Selection:** See who is actively editing in real time with synchronized user avatars, online user counters, dynamic selection highlighting, and remote caret positions.
- **🔄 Robust Failure Recovery:** State persistence ensures full document recovery after mid-session network drops or page reloads. The saved CRDT state restores first, followed by peer-to-peer state synchronization.
- **🎨 Account Personalization & Multi-Device Sync:** User profiles preserve personalized styling across devices:
  - Generated avatars & dynamic profile identity.
  - Custom accent colors for carets and selections.
  - Cursor styles (*Arrow, Beam, Crosshair, Pointer, Cell*).
  - Caret styles (*Bar, Block, Underline*).
  - Flexible typography choices (*Grotesk, Mono, Serif*).
- **🔒 Authentication:** Account-based access via Google OAuth or Email/Password credentials.

---

## 🏗️ Architecture & How It Works

SynDoc 2.0 decouples **real-time event propagation** from **durable persistence**, providing instant feedback to users while maintaining a resilient system state.
## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
