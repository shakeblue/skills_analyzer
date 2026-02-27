# Skills & Project Fit Analyzer

AI-powered internal platform that helps project managers match team members to projects based on skills extracted from CVs, GitHub repos, and source code.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Run with Docker Compose

```bash
cp .env.example .env
docker compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Frontend:**

```bash
cd frontend
pnpm install
pnpm dev
```

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11+
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts

## Project Structure

```
skills_analyzer/
├── frontend/          # Next.js 14 App Router
├── backend/           # FastAPI Python
├── docker-compose.yml
├── .env.example
└── README.md
```

## Phase 1 (Current)

Demo-ready system with mock data:
- 10 team members with realistic skill profiles
- 5 platform profiles (Magento, Shopify, React/Next.js, Laravel, Node.js)
- Scoring engine with weighted category averaging
- Gap analysis and comparison dashboard
- Upskilling roadmap generation
