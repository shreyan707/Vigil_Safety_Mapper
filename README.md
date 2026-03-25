<div align="center">
  <img width="800" alt="Vigil Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>🛡️VIGIL</h1>
  <p><strong>A Geographic Safety Mapper and Response Hub</strong></p>
</div>

VIGIL is an intelligent, full-stack geographic safety mapper and incident reporting platform. It empowers individuals to find support services rapidly and file safety requests, while giving active service providers (like NGOs or Police Stations) a structured dashboard to track, manage, and resolve incidents in their jurisdiction.

---

## ✨ Features

- **🗺️ Interactive Map View**: Visualize local support services (like NGOs, law enforcement, and medical centers) geographically using Leaflet maps.
- **🏥 Service Directory**: Explore detailed service portfolios with operating hours, contact numbers, and supported languages.
- **🚨 Incident Reporting**: Quickly raise safety requests, pinning your exact or preferred location (powered by Leaflet mapping). Assign urgency levels and provide crucial context.
- **🔍 Request Tracking**: Generates unique tracking IDs for each user to monitor the real-time status of their generated support request.
- **🛡️ Provider Dashboard**: Secure authentication enables registered service providers to see specialized analytics, view incoming requests, and update request statuses.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Tooling**: Vite (configured for Single Page App & Express fallback)
- **Styling**: Tailwind CSS v4, utility-first UI
- **Routing**: React Router v7
- **Maps**: Leaflet & React-Leaflet
- **Animations / Visuals**: Framer Motion & Lucide React
- **Data Visualization**: Recharts

### Backend
- **Server**: Express.js (Node.js) runtime with `tsx`
- **Database**: PostgreSQL
- **ORM**: Prisma ORM (Migration-ready schema encompassing Users, Services, and Requests)
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs`

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database (local instance or a cloud database string)

### 1. Clone the repository and install dependencies
```bash
# Since you're likely already in the directory:
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory. You can use `.env.example` as a template.
Ensure you have the following variables securely defined:
```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/vigildb" # Replace with your Postgres string
JWT_SECRET="your_secure_jwt_secret_key"
GEMINI_API_KEY="your_optional_gemini_api_key"
```

### 3. Setup the Database
Run Prisma to map the schemas to your PostgreSQL database.
```bash
npx prisma generate
npx prisma db push
# Note: On startup, the server automatically checks and seeds default service providers if empty.
```

### 4. Run the Development Server
```bash
npm run dev
```

This will concurrently start the Vite dev server and proxy requests through the Express backend running on `http://localhost:3000`.

---

## 📂 Project Structure

- `/src/pages` - Standalone page components for routing.
- `/src/components` - Reusable interface components (Navbar, UI elements).
- `/server.ts` - The primary Express routing file that acts as our backend controller.
- `/prisma/schema.prisma` - The PostgreSQL data structure modeling Services, Users, and Requests.

---

*“Safety is not just an emergency response; it is ongoing diligence and systemic support.”*
