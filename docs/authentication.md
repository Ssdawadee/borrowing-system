# Authentication Documentation for University Club Equipment Borrowing System

## Overview
The University Club Equipment Borrowing System implements a secure authentication mechanism to manage user access and ensure that only authorized users can perform specific actions within the application. This document outlines the authentication process, including user registration, login, and token management.

## User Roles
The system supports the following user roles:
- **Admin**: Has full access to manage users, equipment, and borrow requests.
- **Member**: Can borrow equipment and manage their own requests.
- **Guest**: Can view equipment but cannot borrow or manage requests.

## Authentication Flow

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  - `username`: String, required
  - `email`: String, required
  - `password`: String, required
  - `role`: String, optional (default is "Member")

- **Response**:
  - `201 Created`: User successfully registered.
  - `400 Bad Request`: Validation errors or user already exists.

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  - `email`: String, required
  - `password`: String, required

- **Response**:
  - `200 OK`: Returns a JWT token and user information.
  - `401 Unauthorized`: Invalid credentials.

### 3. Token Management
- Upon successful login, a JWT (JSON Web Token) is issued to the user. This token must be included in the `Authorization` header for all subsequent requests that require authentication.
- **Example Header**:
  ```
  Authorization: Bearer <token>
  ```

### 4. Middleware for Authentication
- The application uses middleware to protect routes that require authentication. The `authMiddleware.ts` checks for the presence of a valid JWT in the request headers.
- If the token is valid, the user information is extracted and attached to the request object for further processing.

### 5. Role-Based Access Control
- The `roleMiddleware.ts` is used to enforce role-based access control. It checks the user's role against the required permissions for specific routes.
- Example of protected route:
  - **Endpoint**: `GET /api/admin/users`
  - **Required Role**: Admin

## Conclusion
This authentication system ensures that users can securely register, log in, and access resources based on their roles. Proper implementation of JWT and middleware enhances the security of the University Club Equipment Borrowing System.