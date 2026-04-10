# DIU CPC Member Portal

This project serves as a secure search portal and admin dashboard for the DIU Computer Programming Club. It utilizes an in-memory database sourced from a consolidated CSV file and is equipped with enterprise-grade backend security.

## Features & Security Measures

### Backend Security
- **Bcrypt Hash Integration**: Passwords are never stored in plain text. A cryptographically sound `bcrypt` hash is stored locally, making it immune to cracking even if the server is compromised.
- **Rate-Limiting (Brute Force Protection)**: Implemented using `express-rate-limit`. The login route allows only 5 attempts per 15 minutes per IP address.
- **Helmet HTTP Headers**: Hardens security headers to prevent common web vulnerabilities like XSS and Sniffing.
- **Secure Sessions**: Uses `express-session` with `HttpOnly` configured, meaning the browser's javascript cannot tap into the session cookie.
- **Secure CSV Management**: Utilizing `csv-writer` to reliably apply CRUD transactions safely back to the database.

### Frontend
- **Beautiful UI/UX**: An exquisitely designed "Glassmorphism" UI with smooth gradients, floating micro-animations, and a responsive dark theme.

## How to Start the App

1. Ensure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Access the Member search portal: `http://localhost:3000`
5. Access the **Admin Dashboard**: `http://localhost:3000/admin.html`

## Changing the Admin Credentials

For extreme security, we do not allow changing passwords via the Web UI (which is often a vulnerability point). Instead, it must be changed by the server owner locally. 

The default credentials are:
- **Username:** `admin`
- **Password:** `SecurePass123!`

**To generate a new highly secure password hash:**
1. Open a terminal in the project directory.
2. Run this command in your terminal (Replace `YourNewPassword123!` with your desired password):
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourNewPassword123!', 10))"
   ```
3. Copy the output hash (it will look somewhat like `$2a$10$WwO5...`).
4. Open the `.env` file in the project.
5. Replace the value of `ADMIN_PASSWORD_HASH=` with your newly copied hash.
6. Restart your server.

Your new password is now perfectly secure!
