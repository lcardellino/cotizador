# Deployment Notes for MySQL / MariaDB Migration

## Overview
This application has been refactored to use a relational database (MySQL/MariaDB) instead of MongoDB, making it compatible with traditional cloud web hosting environments (cPanel, Plesk, etc.).

## Prerequisites
1. A hosting account with Node.js support.
2. A MySQL or MariaDB database created via your hosting control panel.
3. Node.js installed on the server (v18+ recommended).

## Database Setup
1. Create a new MySQL/MariaDB database and user in your hosting control panel.
2. Assign the user to the database with all privileges.
3. Note down the database name, username, password, and host (usually `localhost` or `127.0.0.1`).

## Environment Configuration
Create a `.env` file in the root of your project on the server and configure the following variables:

```env
# Replace with your actual database credentials
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME"

# Other required variables
APP_URL="https://your-domain.com"
```
*Note: `DB_PORT` is typically `3306`.*

## Deployment Steps
1. Upload the project files to your hosting environment.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Apply the database schema using Prisma:
   ```bash
   npx prisma migrate deploy
   ```
   *This command will create the necessary tables in your MySQL/MariaDB database based on the `prisma/migrations` folder.*
4. Build the frontend application:
   ```bash
   npm run build
   ```
5. Start the Node.js server. Depending on your hosting provider, you might need to configure a startup script or use a process manager like PM2, or configure the Node.js app through the cPanel/Plesk interface to point to `server.ts` (or a compiled `server.js` if you choose to compile it).
   ```bash
   npm start
   ```
   *(Ensure your `package.json` has a `"start": "node server.ts"` or similar script configured for production, you might need `tsx` or compile it first).*

## Architecture Changes
*   **Removed:** MongoDB, Mongoose.
*   **Added:** Prisma ORM, MySQL adapter.
*   **Schema:** The `Trip` model is now defined in `prisma/schema.prisma` and maps to a relational table.
*   **API:** Backend routes in `server.ts` have been updated to use Prisma Client for database operations.
