---
description: how to run the ABAC system (backend and frontend)
---

### 🚀 Setup and Run Flow

Follow these steps to get the ABAC system up and running:

**1. MongoDB (Local)**
Ensure your MongoDB service is running on `mongodb://localhost:27017`.
// turbo
```bash
mongod
```

**2. Backend Setup**
// turbo
1. Navigate to backend: `cd backend`
// turbo
2. Install dependencies: `npm install`
// turbo
3. Seed demo data: `npm run seed`
// turbo
4. Start backend: `npm run dev`

**3. Frontend Setup**
// turbo
1. Navigate to frontend: `cd frontend`
// turbo
2. Install dependencies: `npm install`
// turbo
3. Start frontend: `npm start`

---
The system will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
