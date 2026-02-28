Glam2ena ✨
Qena's Premier Beauty & Cosmetics Platform

📋 Overview
Glam2ena is a comprehensive e-commerce platform connecting beauty product shop owners with customers across Qena Governorate. We provide an integrated ecosystem featuring secure authentication, role-based dashboards, and a trusted network of vetted delivery workers for guaranteed fast, in-time delivery.

✨ Key Features
For Clients 👤
Personalized Beauty Profile: Track skin type, concerns, and preferences

Smart Product Discovery: Browse categorized products with real reviews

Secure Shopping Cart: Save items, track spending history

Multi-payment Options: Card, cash, or wallet payments

Order Tracking: Real-time delivery status

For Shop Owners 🏪
Store Management Dashboard: Add/edit products, track inventory

Sales Analytics: Real-time revenue, commissions, and payouts

Commission Tracking: Clear breakdown of platform fees (configurable rates)

Customer Reviews: Moderate and respond to feedback

For Delivery Workers 🚚
Delivery Dashboard: View assigned orders, optimize routes

Earnings Tracker: Commission-based payments (85% of delivery fee)

Status Updates: Mark orders as picked up/delivered

Customer Communication: In-app contact when needed

For Administrators 👨‍💼
Full Platform Oversight: Manage users, stores, and delivery workers

Analytics Dashboard: Revenue, user growth, platform performance

Permission System: Granular admin roles with specific permissions

Content Moderation: Approve reviews, monitor platform activity

🛡️ Security Architecture
Based on our discussions, Glam2ena implements defense-in-depth security:

Authentication & Session Management
JWT-based authentication with dual-token strategy

access_token: 15-minute lifespan (limits damage if stolen)

refresh_token: 7-day lifespan (rotated on each use)

HTTP-only cookies for refresh tokens (prevents XSS theft)

2FA support with SMS/email verification

Session tracking with device fingerprinting

OTP & Verification Flow
text
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  /otp/email │───▶│  /otp/verify │───▶│  Verified  │
│   /send     │    │   /email     │    │   Status   │
└─────────────┘    └──────────────┘    └─────────────┘
Data Protection
MongoDB sanitization (prevents NoSQL injection)

Input validation using Zod schemas

Password hashing with bcrypt (salt rounds: 12)

Rate limiting per endpoint:

Login: 5 attempts/15min

OTP requests: 3/hour

General API: 100/15min

Security Headers
Helmet.js for secure HTTP headers

CORS properly configured for production domains

XSS protection enabled

HSTS for production environment

🏗️ Technology Stack (MERN)
Layer	Technology	Purpose
Database	MongoDB with Mongoose	Data persistence with schema validation
Backend	Express.js + Node.js	RESTful API server
Frontend	React.js (planned)	Dynamic user interfaces
Mobile	React Native (planned)	Cross-platform mobile apps
Key Packages
json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.22.0",
    "express-rate-limit": "^6.10.0",
    "helmet": "^7.0.0",
    "express-mongo-sanitize": "^2.2.0",
    "validator": "^13.11.0",
    "nodemailer": "^6.9.0",
    "twilio": "^4.19.0"
  }
}


We follow strict secret management:

gitignore
# .gitignore
.env
.env.local
.env.production
*.env
Share Securely with Team
bash
# Using lazy-vault for encrypted sharing
lazy-vault encrypt    # Creates .env.enc (commit this!)
lazy-vault decrypt    # Teammates decrypt with shared password

Installation
Clone the repository

bash
git clone https://github.com/your-org/glam2ena.git
cd glam2ena
Install dependencies

bash
npm install
Set up environment

bash
cp .env.example .env
# Edit .env with your values (never commit this!)
Run development server

bash
npm run dev
📁 Project Structure
text
glam2ena/
├── server/
│   ├── models/          # Mongoose models with discriminators
│   │   ├── user.js      # Base user model
│   │   ├── client.js    # Client discriminator
│   │   ├── shop-owner.js
│   │   └── ...
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints (RESTful)
│   │   ├── auth.js      # /auth/*, /otp/*, /password/*
│   │   └── ...
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── utils/           # Helpers, email, SMS
│   └── config/          # Database, environment
├── client/              # React frontend (planned)

🧪 API Endpoint Conventions
Following RESTful best practices:

javascript
// Auth routes
POST   /api/v1/auth/register
POST   /api/v1/auth/login
DELETE /api/v1/auth/logout

// OTP routes
POST   /api/v1/otp/email/send
POST   /api/v1/otp/email/verify
POST   /api/v1/otp/sms/send
POST   /api/v1/otp/sms/verify

// Password management
POST   /api/v1/password/reset
POST   /api/v1/password/change


🛡️ Security Checklist
Authentication: JWT with refresh token rotation

Validation: Zod schemas for all inputs

Rate Limiting: Per-endpoint limits

Sanitization: MongoDB query sanitization

Headers: Helmet.js for security headers

Password: Bcrypt hashing with salt

Secrets: Never committed, shared via encrypted vault (lazy-vault)

2FA: Optional email/SMS verification


🧪 Testing
bash
# Unit tests
npm test

# Integration tests
npm test:integration

# Security audit
npm audit


* securing envirinment privacy

use lazy-vault for securly share .env file to github in encrypted format and password-based access.

- npx lazy-vault init (create lazy.config.json file)
- npx lazy-vault lock (Encrypts local .env file and saves it to env.enc)
- npx lazy-vault sync (Decrypts .env.enc and merges it with local .env)
  
