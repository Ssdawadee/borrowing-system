# API Routes for University Club Equipment Borrowing System

## Authentication Routes
- **POST** `/api/auth/login`
  - Description: Authenticates a user and returns a JWT token.
  - Request Body: 
    - `email`: string
    - `password`: string
  - Response: 
    - `token`: string

- **POST** `/api/auth/register`
  - Description: Registers a new user.
  - Request Body: 
    - `name`: string
    - `email`: string
    - `password`: string
  - Response: 
    - `message`: string

## User Management Routes
- **GET** `/api/users`
  - Description: Retrieves a list of all users (Admin only).
  - Response: 
    - `users`: array of user objects

- **GET** `/api/users/:id`
  - Description: Retrieves a specific user by ID (Admin only).
  - Response: 
    - `user`: user object

- **PUT** `/api/users/:id`
  - Description: Updates user information (Admin only).
  - Request Body: 
    - `name`: string (optional)
    - `email`: string (optional)
    - `role`: string (optional)
  - Response: 
    - `message`: string

- **DELETE** `/api/users/:id`
  - Description: Deletes a user (Admin only).
  - Response: 
    - `message`: string

## Equipment Management Routes
- **GET** `/api/equipment`
  - Description: Retrieves a list of all equipment.
  - Response: 
    - `equipment`: array of equipment objects

- **GET** `/api/equipment/:id`
  - Description: Retrieves details of a specific equipment item.
  - Response: 
    - `equipment`: equipment object

- **POST** `/api/equipment`
  - Description: Adds a new equipment item (Admin only).
  - Request Body: 
    - `name`: string
    - `description`: string
    - `quantity`: number
  - Response: 
    - `message`: string

- **PUT** `/api/equipment/:id`
  - Description: Updates an existing equipment item (Admin only).
  - Request Body: 
    - `name`: string (optional)
    - `description`: string (optional)
    - `quantity`: number (optional)
  - Response: 
    - `message`: string

- **DELETE** `/api/equipment/:id`
  - Description: Deletes an equipment item (Admin only).
  - Response: 
    - `message`: string

## Borrow Request Routes
- **GET** `/api/borrow-requests`
  - Description: Retrieves a list of all borrow requests (Admin only).
  - Response: 
    - `requests`: array of borrow request objects

- **GET** `/api/borrow-requests/:id`
  - Description: Retrieves details of a specific borrow request.
  - Response: 
    - `request`: borrow request object

- **POST** `/api/borrow-requests`
  - Description: Creates a new borrow request.
  - Request Body: 
    - `equipmentId`: string
    - `userId`: string
    - `borrowDate`: string (ISO date)
    - `returnDate`: string (ISO date)
  - Response: 
    - `message`: string

- **PUT** `/api/borrow-requests/:id`
  - Description: Updates an existing borrow request (Admin only).
  - Request Body: 
    - `status`: string (e.g., "approved", "rejected")
  - Response: 
    - `message`: string

- **DELETE** `/api/borrow-requests/:id`
  - Description: Deletes a borrow request (Admin only).
  - Response: 
    - `message`: string

## Audit Log Routes
- **GET** `/api/audit-logs`
  - Description: Retrieves a list of all audit logs (Admin only).
  - Response: 
    - `logs`: array of audit log objects

## Notes
- All routes require appropriate authentication and authorization based on user roles.
- Ensure to handle errors and return meaningful messages for each route.