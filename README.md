# Nijar API (Backend)

RESTful API backend for the Nijar E-commerce and Catalog platform. Built with Node.js, Express, and MongoDB, this service provides robust endpoints for managing products, categories, bundles, and platform settings.

## Architecture & Technologies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) via HttpOnly Cookies
- **File Storage:** Cloudinary integration for image management
- **Security:** Helmet, Express Rate Limit, CORS, and strictly enforced HttpOnly cookie sessions.

## Core Features

- **Product & Category Management:** Full CRUD operations for detailed catalog entries, including multi-variant pricing, sizing, and technical specifications.
- **Bundle System:** Endpoints to group multiple products into discounted bundles.
- **Dynamic Platform Settings:** Centralized management of social links, contact numbers, and SEO default metadata.
- **Media Uploads:** Integrated with Multer and Cloudinary for optimized image processing and remote storage.
- **Secure Admin Access:** JWT-based authentication explicitly managed via secure HttpOnly cookies, protecting the admin routes against XSS attacks.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (Local or Atlas)
- Cloudinary Account

### Environment Variables
Create a `.env` file in the root directory and populate it based on the provided `.env.production.example`:

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
```

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Seed initial admin user (Optional but recommended for first setup):
   ```bash
   npm run seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

## API Structure

The API is versioned under `/api/v1`. Core route modules include:
- `/api/v1/auth` - Admin login, logout, and session verification.
- `/api/v1/catalog` - Public and protected endpoints for products, categories, and bundles.
- `/api/v1/settings` - Global application configuration and contact info.
- `/api/v1/upload` - Secure image uploading to Cloudinary.

## Deployment Notes

This backend is structured for seamless deployment on platforms like Render, Railway, or Heroku. Ensure that `FRONTEND_URL` is accurately set in the production environment variables to maintain CORS integrity and allow the secure transfer of HttpOnly cookies.
