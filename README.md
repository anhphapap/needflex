<div align="center">
  <br />
  <img src="public/readme/banner.webp" alt="Needflex Banner" />
  <br />

  <div>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
    <img src="https://img.shields.io/badge/Ophim_API-111827?style=for-the-badge" />
    <img src="https://img.shields.io/badge/TMDB_API-01B4E4?style=for-the-badge" />
  </div>

  <h3 align="center">Needflex</h3>

  <p align="center">
    A Netflix-inspired online movie streaming platform built with React,
    focusing on performance optimization, modern UI/UX, and real-world frontend architecture.
  </p>
</div>

---

## 📋 Table of Contents

1. ✨ Introduction
2. ⚙️ Tech Stack
3. 🔋 Features
4. 🤸 Quick Start
5. 🌐 API Data Sources
6. 🧠 Architecture Overview
7. 🚀 Future Improvements

---

## ✨ Introduction

**Needflex** is a Netflix-inspired movie streaming web application that allows users to explore, watch, and manage movies directly from the browser.

The project was built as a **frontend portfolio project** to demonstrate modern React architecture, performance optimization, and real-world user features without a custom backend.

---

## 🚀 Demo

**Needflex** is deployed and accessible at: **https://needflex.site**

---

## ⚙️ Tech Stack

- **React** – Component-based UI development
- **Vite** – Fast build tool and development server
- **Tailwind CSS** – Utility-first styling framework
- **Firebase** – Authentication & Cloud Firestore
- **Public Movie APIs** – Ophim & TMDB

---

## 🔋 Features

- Browse trending, popular, and categorized movies
- Search and filter content easily
- View detailed movie pages with trailers and metadata
- Stream movies using `.m3u8` sources
- Continue Watching – Save and resume movie playback progress per user
- Favorite Movies – Save and manage a personal movie watchlist per user
- Firebase Authentication (Email/Password, Google)
- Responsive Netflix-style UI with optimized loading

---

## 🤸 Quick Start

### Prerequisites

- Git
- Node.js (v18+)
- npm

### Clone the Repository

```bash
git clone https://github.com/anhphapap/needflex.git
cd needflex
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure Firebase services:

- Enable **Authentication** (Email/Password, Google)
- Create **Cloud Firestore Database**

Fill in Firebase credentials in the `.env` file.

### Run the Project

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Data Sources

- **Ophim API** – Movie lists, metadata, and streaming sources

  - https://ophim17.cc/api-document

- **TMDB API** – Trending data, posters, backdrops, and extended metadata
  - https://developer.themoviedb.org

---

## 🧠 Architecture Overview

- React Components for UI rendering
- Context API for global state management
- Firebase Firestore for user data (watch progress, favorites)
- External APIs (Ophim, TMDB) for movie content
- Frontend-only architecture without a custom backend

---

## 🚀 Future Improvements

- Watch party
- Multi-language support
- PWA support

---

## 📌 License

This project is created for learning and personal portfolio purposes.
