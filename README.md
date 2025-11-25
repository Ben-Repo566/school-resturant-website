# School Website Project

A web application with user authentication (login and register) using Node.js, Express, MySQL, and bcrypt for password hashing.

## Features

- User Registration
- User Login
- Session Management
- Password Hashing (bcrypt)
- MySQL Database
- Responsive Design

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- macOS Terminal

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up MySQL Database**

   Open MySQL in Terminal:
   ```bash
   mysql -u root -p
   ```

   Then run the SQL commands from `database.sql`:
   ```bash
   mysql -u root -p < database.sql
   ```

3. **Configure Environment Variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=school_project
   SESSION_SECRET=your_random_secret_key
   PORT=3000
   ```

4. **Start the Server**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the Application**

   Open your browser and go to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
schoolwebsiteproject/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── register.js
│   │   ├── login.js
│   │   └── dashboard.js
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   └── dashboard.html
├── server.js
├── database.sql
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Security**: bcrypt (password hashing), express-session
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Mac Keyboard Shortcuts for VS Code

- **⌘ + S** - Save file
- **⌘ + P** - Quick file open
- **⌘ + Shift + P** - Command palette
- **⌘ + /** - Toggle comment
- **⌘ + B** - Toggle sidebar
- **⌃ + `** - Toggle terminal

## Author

Ben (benabutbul1980@gmail.com)
