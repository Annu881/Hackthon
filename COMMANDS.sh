#!/bin/bash
# ABAC System - Command Reference
# सभी commands यहां दिए गए हैं

# ============================================================
# 📦 INSTALLATION & SETUP
# ============================================================

# Backend setup करो (first time)
cd backend
npm install

# Frontend setup करो (first time)
cd frontend
npm install

# ============================================================
# 🚀 START SERVERS
# ============================================================

# MongoDB start करो (Terminal 1)
mongod

# Redis start करो (Terminal 2) - Optional but recommended
redis-server
# या Docker में
docker run -d -p 6379:6379 redis:latest

# Backend start करो (Terminal 3)
cd backend
npm run dev
# Runs on http://localhost:5000

# Frontend start करो (Terminal 4)
cd frontend
npm start
# Runs on http://localhost:3000

# ============================================================
# 🧪 TESTING
# ============================================================

# सभी tests run करो
npm test

# Tests को watch mode में run करो (auto-rerun)
npm run test:watch

# Tests with detailed output
npm run test:verbose

# Coverage report के साथ
npm test -- --coverage

# Clear Jest cache if having issues
npm test -- --clearCache

# ============================================================
# 📚 DOCUMENTATION
# ============================================================

# Backend start करने के बाद access करो:
# http://localhost:5000/api-docs

# या direct curl से check करो:
curl http://localhost:5000/api-docs

# ============================================================
# 🔌 QUICK API TESTS (using curl)
# ============================================================

# 1. Login करो (token get करने के लिए)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@abac.com",
    "password": "password123"
  }'

# Response में token मिलेगा, उसे export करो:
export TOKEN="your-jwt-token-here"

# 2. Access check करो
curl -X POST http://localhost:5000/api/access/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceUon": "uon://reports/production/report/sales",
    "action": "read"
  }'

# 3. Policies list करो (with caching!)
curl http://localhost:5000/api/policies \
  -H "Authorization: Bearer $TOKEN"

# 4. New policy create करो
curl -X POST http://localhost:5000/api/policies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Policy",
    "domain": "test",
    "actorMatcher": {
      "type": "role",
      "value": "manager"
    },
    "permissions": [{
      "resourceMatcher": "uon://test/*",
      "actions": ["read", "write"],
      "effect": "allow"
    }],
    "priority": 10
  }'

# 5. Audit logs देखो
curl http://localhost:5000/api/audit \
  -H "Authorization: Bearer $TOKEN"

# 6. Audit statistics देखो
curl http://localhost:5000/api/audit/stats \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# 💾 DATABASE & CACHING
# ============================================================

# MongoDB को check करो
mongosh
# Command: show dbs; use abac_system; db.policies.find();

# Redis को check करो
redis-cli
# Commands: ping, keys *, get policy:123

# ============================================================
# 🔧 TROUBLESHOOTING COMMANDS
# ============================================================

# Port 5000 को check करो (Backend)
lsof -i :5000
# Kill करो अगर stuck है:
kill -9 <PID>

# Port 3000 को check करो (Frontend)
lsof -i :3000

# Port 27017 को check करो (MongoDB)
lsof -i :27017

# Port 6379 को check करो (Redis)
lsof -i :6379

# Redis को ping करो
redis-cli ping
# Should return: PONG

# MongoDB को check करो
mongosh --eval "db.adminCommand('ping')"

# Browser से API को check करो
# Health check:
curl http://localhost:5000

# Node dependencies को reinstall करो
cd backend
rm -rf node_modules
npm install
npm run dev

# ============================================================
# 📊 PERFORMANCE TESTING
# ============================================================

# Policy list को measure करो (first call)
time curl http://localhost:5000/api/policies \
  -H "Authorization: Bearer $TOKEN"

# Again (second call - should be faster with cache)
time curl http://localhost:5000/api/policies \
  -H "Authorization: Bearer $TOKEN"

# Compare response times!

# ============================================================
# 🎯 DEMO COMMANDS
# ============================================================

# 1. Demo के लिए servers start करो:
# Terminal 1:
mongod

# Terminal 2:
redis-server

# Terminal 3 - Backend:
cd backend && npm run dev

# Terminal 4 - Frontend:
cd frontend && npm start

# 2. Login करो browser में:
# Go to http://localhost:3000
# Email: admin@abac.com
# Password: password123

# 3. Navigate करो:
# Dashboard → Policies → Create Policy
# Access Check → Enter resource & action
# Audit → View all decisions

# 4. Show API Documentation:
# Open http://localhost:5000/api-docs
# Try endpoints directly in Swagger UI

# 5. Run tests to show quality:
cd backend
npm test

# ============================================================
# 🧹 CLEANUP & RESET
# ============================================================

# सभी MongoDB data को delete करो
mongosh
> use abac_system
> db.dropDatabase()
> exit

# फिर seed करो:
npm run seed

# Redis को clear करो:
redis-cli
> FLUSHALL
> exit

# Node modules को delete करो (if issues):
rm -rf node_modules
npm install

# ============================================================
# 📱 USEFUL ENVIRONMENT VARIABLES
# ============================================================

# backend/.env file में add करो:
PORT=5000
MONGO_URI=mongodb://localhost:27017/abac_system
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
REDIS_HOST=localhost
REDIS_PORT=6379

# ============================================================
# 🔐 DEMO ACCOUNTS
# ============================================================

# Admin Account
# Email: admin@abac.com
# Password: password123
# Role: admin
# Department: security

# Manager Account
# Email: priya@abac.com
# Password: password123
# Role: manager
# Department: engineering

# Analyst Account
# Email: rahul@abac.com
# Password: password123
# Role: analyst
# Department: data

# Developer Account
# Email: sneha@abac.com
# Password: password123
# Role: developer
# Department: engineering

# Viewer Account
# Email: amit@abac.com
# Password: password123
# Role: viewer
# Department: sales

# ============================================================
# 📚 DOCUMENTATION FILES
# ============================================================

# Check these files for more info:
# - ENHANCEMENT_SUMMARY.md      (What was added)
# - ENHANCED_FEATURES_SETUP.md  (Detailed setup guide)
# - QUICK_REFERENCE.md          (Quick commands)
# - FEATURE_ANALYSIS.md         (Feature breakdown)
# - STATUS_REPORT.md            (Project status)
# - TESTING_GUIDE.md            (Testing scenarios)

# ============================================================
# ✅ PRE-FLIGHT CHECKLIST
# ============================================================

# Demo से पहले run करो:

# 1. Check MongoDB
mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# 2. Check Redis
redis-cli ping
# Expected: PONG

# 3. Check Backend
curl http://localhost:5000
# Expected: { message: "ABAC System API Running" }

# 4. Check Frontend
curl http://localhost:3000
# Expected: HTML content

# 5. Check Tests
npm test
# Expected: All tests passing

# 6. Check Swagger
curl http://localhost:5000/api-docs
# Expected: Swagger UI HTML

# ============================================================
# 🎉 YOU'RE READY!
# ============================================================

# सभी setup complete होने के बाद demo दे सकते हो!
# Good luck! 🚀
