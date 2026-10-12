# DG Interns Hub — API Documentation

Welcome to the backend REST API documentation for **DG Interns Hub** (Week 8 Backend).

- **Base URL:** `http://localhost:5000` (or configured `PORT`)
- **Format:** JSON (`Content-Type: application/json`)
- **Authentication:** Bearer JWT in the `Authorization` header (`Authorization: Bearer <token>`)

---

## 1. Authentication APIs

### 1.1 Register User
- **Method & Route:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "user"
  }
  ```
  *(Note: Allowed roles for registration are `user` and `employer`. Defaults to `user`)*
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "670c2a8f8d9b1a0012345678",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

---

### 1.2 Login
- **Method & Route:** `POST /api/auth/login`
- **Access:** Public (Rate-limited: 5 attempts / 15 mins)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "670c2a8f8d9b1a0012345678",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

---

### 1.3 Get Current Authenticated User (Me)
- **Method & Route:** `GET /api/auth/me`
- **Access:** Private (Bearer Token)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "670c2a8f8d9b1a0012345678",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "2026-10-12T09:40:00.000Z",
      "updatedAt": "2026-10-12T09:40:00.000Z"
    }
  }
  ```

---

### 1.4 Logout
- **Method & Route:** `POST /api/auth/logout`
- **Access:** Private (Bearer Token)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully. Please discard your token."
  }
  ```

---

## 2. User Profile APIs

### 2.1 Get Profile
- **Method & Route:** `GET /api/users/profile`
- **Access:** Private (Bearer Token)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "670c2a8f8d9b1a0012345678",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "2026-10-12T09:40:00.000Z",
      "updatedAt": "2026-10-12T09:40:00.000Z"
    }
  }
  ```

---

### 2.2 Update Profile
- **Method & Route:** `PUT /api/users/profile`
- **Access:** Private (Bearer Token)
- **Request Body:**
  ```json
  {
    "name": "Jane Updated"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "user": {
      "id": "670c2a8f8d9b1a0012345678",
      "name": "Jane Updated",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

---

### 2.3 Delete Account
- **Method & Route:** `DELETE /api/users/profile`
- **Access:** Private (Bearer Token)
- **Request Body:**
  ```json
  {
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account deleted successfully"
  }
  ```

---

## 3. Job APIs

### 3.1 List Jobs (Search, Filter, Pagination, Sort)
- **Method & Route:** `GET /api/jobs`
- **Access:** Public
- **Query Parameters:**
  - `search`: Keyword searched across `title`, `company`, `location`, and `skills`.
  - `type`: Job type (`Full-time`, `Part-time`, `Internship`, `Contract`, `Remote`).
  - `location`: Partial text match for job location.
  - `skill`: Filter by skill requirement.
  - `page`: Page number (default: `1`).
  - `limit`: Items per page (default: `10`, max: `50`).
  - `sort`: Sorting order (`newest`, `oldest`, `deadline`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "jobs": [
      {
        "_id": "670c2b1234567890abcdef12",
        "title": "Backend Engineering Intern",
        "company": "TechNova Solutions",
        "description": "Develop scalable APIs with Node and MongoDB.",
        "location": "Bangalore",
        "type": "Internship",
        "skills": ["Node.js", "Express", "MongoDB"],
        "salary": { "min": 25000, "max": 40000, "currency": "INR" },
        "postedBy": {
          "_id": "670c2a8f8d9b1a0012345678",
          "name": "Acme Recruiter",
          "email": "recruiter@example.com"
        },
        "isActive": true,
        "createdAt": "2026-10-12T09:42:00.000Z"
      }
    ]
  }
  ```

---

### 3.2 Get Job by ID
- **Method & Route:** `GET /api/jobs/:id`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "job": {
      "_id": "670c2b1234567890abcdef12",
      "title": "Backend Engineering Intern",
      "company": "TechNova Solutions",
      "description": "Develop scalable APIs...",
      "location": "Bangalore",
      "type": "Internship",
      "skills": ["Node.js", "Express"],
      "salary": { "min": 25000, "max": 40000, "currency": "INR" },
      "postedBy": {
        "_id": "670c2a8f8d9b1a0012345678",
        "name": "Acme Recruiter",
        "email": "recruiter@example.com"
      }
    }
  }
  ```

---

### 3.3 Create Job
- **Method & Route:** `POST /api/jobs`
- **Access:** Private (`admin` or `employer` role required)
- **Request Body:**
  ```json
  {
    "title": "Frontend Engineer Intern",
    "company": "TechNova Solutions",
    "description": "Build high-performance UIs in React.",
    "location": "Remote",
    "type": "Internship",
    "skills": ["React", "JavaScript", "CSS"],
    "salary": { "min": 20000, "max": 30000, "currency": "INR" },
    "deadline": "2026-12-31T23:59:59.000Z"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Job created successfully",
    "job": { ... }
  }
  ```

---

### 3.4 Update Job
- **Method & Route:** `PUT /api/jobs/:id`
- **Access:** Private (`admin` or the user who posted the job)
- **Request Body:** Any valid fields to update.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Job updated successfully",
    "job": { ... }
  }
  ```

---

### 3.5 Delete Job
- **Method & Route:** `DELETE /api/jobs/:id`
- **Access:** Private (`admin` or the user who posted the job)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Job deleted successfully"
  }
  ```

---

## 4. Application APIs

### 4.1 Submit Application
- **Method & Route:** `POST /api/applications`
- **Access:** Private (Authenticated user)
- **Request Body:**
  ```json
  {
    "job": "670c2b1234567890abcdef12",
    "jobTitle": "Backend Engineering Intern",
    "company": "TechNova Solutions",
    "location": "Bangalore",
    "category": "Engineering",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91 9876543210",
    "resumeUrl": "https://example.com/resumes/jane.pdf",
    "coverLetter": "Excited for this role!"
  }
  ```
  *(Note: The existing internship application form format is preserved and fully supported with or without `job` ID).*
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Your application was submitted successfully!",
    "application": {
      "id": "670c2c34567890abcdef1234",
      "jobTitle": "Backend Engineering Intern",
      "company": "TechNova Solutions",
      "status": "Pending",
      "createdAt": "2026-10-12T09:45:00.000Z"
    }
  }
  ```

---

### 4.2 Get My Applications
- **Method & Route:** `GET /api/applications/my`
- **Access:** Private (Authenticated user)
- **Query Parameters:** `page`, `limit`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "applications": [
      {
        "_id": "670c2c34567890abcdef1234",
        "jobTitle": "Backend Engineering Intern",
        "company": "TechNova Solutions",
        "status": "Pending",
        "createdAt": "2026-10-12T09:45:00.000Z"
      }
    ]
  }
  ```

---

### 4.3 Get Application by ID
- **Method & Route:** `GET /api/applications/:id`
- **Access:** Private (Applicant owner, employer, or admin)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "application": {
      "_id": "670c2c34567890abcdef1234",
      "jobTitle": "Backend Engineering Intern",
      "company": "TechNova Solutions",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+91 9876543210",
      "resumeUrl": "https://example.com/resumes/jane.pdf",
      "status": "Pending"
    }
  }
  ```

---

### 4.4 Update Application Status
- **Method & Route:** `PUT /api/applications/:id/status`
- **Access:** Private (`admin` or `employer` only; applicant cannot alter own status)
- **Request Body:**
  ```json
  {
    "status": "Accepted"
  }
  ```
  *(Allowed values: `Pending`, `Reviewed`, `Accepted`, `Rejected`)*
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Application status updated successfully",
    "application": {
      "id": "670c2c34567890abcdef1234",
      "status": "Accepted",
      "updatedAt": "2026-10-12T09:50:00.000Z"
    }
  }
  ```

---

### 4.5 Delete Application
- **Method & Route:** `DELETE /api/applications/:id`
- **Access:** Private (Applicant owner or admin)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Application deleted successfully"
  }
  ```
