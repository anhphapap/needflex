<div align="center">
  <br />
  <img src="public/readme/banner.png" alt="Dev Event Platform Banner" />
  <br />

  <div>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Cloudinary-002C73?style=for-the-badge&logo=cloudinary&logoColor=white" />
  </div>

  <h3 align="center">Dev Event Platform</h3>

  <p align="center">
    A full-stack event management platform built with Next.js App Router,
    focusing on modern server-side rendering, caching strategies, and clean architecture.
  </p>
</div>

---

## 📋 Table of Contents

1. ✨ Introduction
2. ⚙️ Tech Stack
3. 🔋 Features
4. 🤸 Quick Start
5. 🧠 Architecture Overview
6. 🚀 Future Improvements

---

## ✨ Introduction

**Dev Event Platform** is a full-stack web application designed to manage and showcase events in a modern, scalable, and performant way.

This project was built as a **hands-on learning project** to deeply understand **Next.js App Router**, with a strong focus on:

- Server Components & Server Actions
- Data fetching and caching strategies
- MongoDB integration with Mongoose
- Client / Server component separation
- Clean and maintainable UI using Tailwind CSS

Users can browse events, view detailed event pages, register for events, and explore similar events.

---

## ⚙️ Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **MongoDB**
- **Mongoose**
- **Cloudinary**

---

## 🔋 Features

- Home page listing upcoming and featured events
- Event detail pages with agenda, tags, and organizer info
- Secure event booking using Server Actions
- Similar event recommendations
- Cloudinary image uploads
- Optimized caching and revalidation
- Clean separation of Server and Client Components

---

## 🤸 Quick Start

### Prerequisites

- Git
- Node.js (v18+)
- npm

### Clone the Repository

```bash
git clone <your-github-repository-url>
cd dev-event-platform
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGODB_URI=
CLOUDINARY_URL=
```

### Run the Project

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🧠 Architecture Overview

- Server Components handle data fetching and rendering
- Client Components manage UI state and interactions
- Server Actions handle mutations securely
- MongoDB connections are reused safely
- Fetch-level caching improves performance

---

## 🚀 Future Improvements

- Authentication and authorization
- Booking confirmation emails
- Admin dashboard
- Advanced search and filtering
- Pagination and performance enhancements

---

## 📌 License

This project is created for learning and personal portfolio purposes.
