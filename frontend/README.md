# GMM Frontend

Next.js frontend application for the GMM monorepo.

## Tech Stack

- Next.js 16 (latest)
- React 19
- TypeScript
- Tailwind CSS
- App Router
- Turbopack

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Health Check Dashboard**: Real-time connection status with the FastAPI backend
- **Auto-reconnect**: Automatically checks backend health every 10 seconds
- **Modern UI**: Built with Tailwind CSS and a beautiful gradient design
- **TypeScript**: Full type safety throughout the application

## Backend Connection

The frontend connects to the backend API at `http://localhost:8000`. Make sure the backend is running before starting the frontend.

The health check endpoint (`/health`) is used to verify the connection between frontend and backend.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
