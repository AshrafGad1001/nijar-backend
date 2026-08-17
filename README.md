# Nijar (النجار) - Core API (Backend)

The robust, RESTful backend engine powering the **Nijar E-commerce and Catalog Platform**. Built on top of **Node.js, Express, and MongoDB**, this service handles everything from complex catalog variants and media uploads to secure, strict administrative authentication.

## ✨ Core Capabilities

- **Advanced Catalog Management:** Full CRUD operations for categories, multi-variant products (pricing, dimensions, components), and curated promotional bundles.
- **Enterprise-Grade Media Handling:** Native integration with **Cloudinary** and Multer for seamless image uploads, transformation, and optimized remote storage for both products and categories.
- **Dynamic Settings & Revalidation:** Centralized management of global platform settings (SEO defaults, social links). Integrated natively with the Next.js frontend via an On-Demand ISR Revalidation hook to ensure instant cache invalidation upon updates.
- **Uncompromising Security:** 
  - **JWT via HttpOnly Cookies:** Tokens are never exposed to the client-side JavaScript.
  - **Hardened Edge:** Configured with Helmet, Express Rate Limit, and strict CORS policies.
  - **XSS & NoSQL Injection Protection:** Sanitization pipelines in place for all incoming requests.

## 🛠️ Architecture & Technologies

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB (Atlas/Local) with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) explicitly scoped and transmitted via Secure/HttpOnly Cookies.
- **Media Storage:** Cloudinary API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.17 or higher)
- MongoDB instance (Local or Atlas)
- Cloudinary Account (for image management)

### Environment Variables
Create a `.env` file in the root directory based on the `.env.production.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
FRONTEND_REVALIDATE_TOKEN=your_secure_secret_token
```

### Installation & Execution

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/AshrafGad1001/nijar-backend.git
   cd nijar-backend
   npm install
   ```

2. Seed initial admin user (Recommended for initial setup):
   ```bash
   npm run seed
   ```
   *Default Admin credentials will be generated and printed to the console.*

3. Start the development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000/api/v1`.

## 📂 API Structure (v1)

The API is fully modularized and versioned under `/api/v1`. Key route domains:
- **`/api/v1/auth`** - Secure admin authentication, logout, and active session verification.
- **`/api/v1/catalog`** - Public and strictly protected endpoints managing products, categories, and bundles.
- **`/api/v1/settings`** - Global application configuration and contact info.
- **`/api/v1/upload`** - Specialized route handling multipart form data for Cloudinary integration.

## 🚢 Deployment Notes

This backend is structured for horizontal scaling and seamless deployment on platforms like Render, Railway, or Heroku. 
**Crucial:** Ensure that `FRONTEND_URL` is accurately set in your production environment variables to maintain CORS integrity. Cross-origin HttpOnly cookies require `credentials: true` on both the Express CORS configuration and the frontend fetch requests.

---
*Engineered for reliability, speed, and security.*
