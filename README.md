# Unfazed - Module 1: Auth, Profile & Branded Link

## Run it
1. Create a free MongoDB Atlas cluster and copy its connection string.
2. Backend:
   cd unfazed-backend
   npm install
   copy .env.example to .env, then fill in MONGO_URI and JWT_SECRET
   npm run dev          (API on http://localhost:5000)
   npm run seed         (optional demo data: anita@example.com / password123)
3. Frontend:
   cd unfazed-frontend
   npm install
   copy .env.example to .env
   npm run dev          (app on http://localhost:5173)
4. Check http://localhost:5000/api/health shows {"status":"ok"}.

## Try it
- /register -> create an account -> /dashboard -> edit profile -> open your public link /your-name
- Share http://localhost:5000/share/your-name to get Open Graph previews (WhatsApp, LinkedIn)

## Git (one branch per module)
git init && git add . && git commit -m "Module 1: auth, profile, branded link"
