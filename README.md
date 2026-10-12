# DG Interns Hub — Backend Service

Advanced, secure Node.js and Express.js REST API service for **DG Interns Hub** featuring role-based access control, JWT authentication, job postings with search/filtering/pagination, and internship applications tracking.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 5
- **Database:** MongoDB Atlas via Mongoose
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **Validation:** express-validator
- **Security:** Helmet, CORS origin whitelisting, Express Rate Limit, NoSQL injection protection, Request body size limitations

---

## 📁 Project Architecture

The backend follows an MVC (Model-View-Controller) structure:

```text
week8-backend/
├── .env                              # Environment variables (excluded from git)
├── .gitignore                         # Git exclusion rules
├── package.json                      # Project dependencies & scripts
├── API-DOCUMENTATION.md              # Detailed API endpoint references
├── README.md                         # Project overview and run guide
├── postman/
│   └── DG-Interns-Hub-API.json       # Importable Postman Collection
└── server/
    ├── server.js                     # Main Express server entry point
    ├── config/
    │   └── db.js                     # MongoDB connection setup
    ├── controllers/
    │   ├── authController.js         # Register, Login, Me, Logout, Dashboard
    │   ├── userController.js         # User profile CRUD & change password
    │   ├── jobController.js          # Job listings, search, filter, pagination, CRUD
    │   └── applicationController.js  # Applications submission, review & status tracking
    ├── middleware/
    │   ├── authMiddleware.js         # JWT verification & user session validation
    │   ├── authorize.js              # Role-based authorization guard (admin/employer)
    │   ├── errorHandler.js           # Centralized operational & system error handler
    │   └── validate.js               # Express-validator error aggregation middleware
    ├── models/
    │   ├── User.js                   # User schema (roles: user, employer, admin)
    │   ├── Job.js                    # Job schema with compound & text search indexes
    │   └── Application.js            # Internship applications schema
    ├── utils/
    │   ├── ApiError.js               # Custom operational error class
    │   ├── apiResponse.js            # Standardized JSON response helpers
    │   └── sanitize.js               # Query injection sanitizer (removes $ operators)
    └── validators/
        ├── authValidators.js         # Validation chains for registration/login
        ├── jobValidators.js          # Validation chains for job posting/updating
        └── applicationValidators.js  # Validation chains for application submission
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```ini
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dginternshub?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_random_key_here
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
```

---

## 🚀 Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

### 3. Run in Production Mode
```bash
npm start
```

The server will start at `http://localhost:5000`.

---

## 🔒 Security Implementations

1. **Helmet:** Sets modern security headers (HSTS, X-Content-Type-Options, etc.).
2. **CORS:** Only allows designated origins in `FRONTEND_URL` while allowing tools like Postman.
3. **Rate Limiting:**
   - 100 requests per 15 minutes globally across `/api`.
   - 5 attempts per 15 minutes specifically on `/api/auth/login`.
4. **NoSQL Query Injection Protection:** Recursively strips keys starting with `$` from incoming request bodies and query parameters.
5. **Body Size Limits:** Strict `10kb` limit on JSON payload bodies.
6. **Password Security:** Salted bcrypt hashing with work factor of 12. Password field is marked `select: false` by default in Mongoose.

---

## 🧪 Postman Collection

Import the included collection into Postman:
- File: `postman/DG-Interns-Hub-API.json`
- Variables:
  - `baseUrl`: Defaults to `http://localhost:5000`
  - Automatically captures and injects `userToken` and `employerToken` after login/registration.
