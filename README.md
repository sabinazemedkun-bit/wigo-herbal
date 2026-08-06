# WIGO Herbal Traditional Medical Services

A professional, fully bilingual (English & Amharic) website for WIGO Herbal Traditional Medical Services, featuring a modern frontend, secure backend API, and complete admin dashboard.

---

## 📋 Features

### Frontend (6 Pages)
- ✅ **Home Page** — Hero section with Hakim Taye quote, service previews
- ✅ **About Us** — Mission, vision, values, and philosophy
- ✅ **Services** — 19 medical services with live bilingual search
- ✅ **Address/Location** — Google Maps, directions, clinic info
- ✅ **Appointment** — Complete booking form with validation
- ✅ **Contact** — Social media (TikTok, Instagram, Facebook), 4 phone numbers, contact form

### Features
- ✅ **Bilingual** — Instant EN ⇄ አማ language switching (no page reload)
- ✅ **Responsive** — Mobile-first design for all screen sizes
- ✅ **Professional UI** — Glassmorphism cards, smooth animations, green color theme
- ✅ **Accessibility** — WCAG compliant, keyboard navigation

### Backend (Node.js + Express + MySQL)
- ✅ **RESTful API** — Full CRUD for appointments, services, contact messages
- ✅ **JWT Auth** — Secure admin login with bcrypt password hashing
- ✅ **Rate Limiting** — Protection against brute force attacks
- ✅ **Input Validation** — XSS and SQL injection prevention
- ✅ **Security** — Helmet, CORS, sanitization middleware

### Admin Dashboard
- ✅ **Overview** — Statistics dashboard with charts
- ✅ **Appointments** — Search, filter, update status, delete
- ✅ **Services** — Add, edit, delete services (bilingual)
- ✅ **Messages** — View, mark read, delete contact messages
- ✅ **Responsive** — Full mobile support

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm** or **yarn**

### Installation

#### 1. Clone/Extract the Project
```bash
cd wigo-herbal
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Configure Database

**a) Create MySQL Database**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE wigo_herbal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**b) Run Database Schema**
```bash
mysql -u root -p wigo_herbal < config/schema.sql
```

This will:
- Create all tables (users, appointments, services, contact_messages)
- Seed 19 medical services (bilingual)
- Create default admin user

#### 4. Configure Environment Variables

Edit `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Database — UPDATE THESE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=wigo_herbal

# JWT Secret — CHANGE IN PRODUCTION
JWT_SECRET=your_super_secret_jwt_key_here_change_this
```

#### 5. Start the Backend Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🌿 WIGO Herbal Server running at http://localhost:5000
📋 API Base: http://localhost:5000/api
🔑 Admin Dashboard: http://localhost:5000/admin/
```

#### 6. Open the Frontend

**Option A: With Backend (recommended)**
```
Open browser → http://localhost:5000
```

**Option B: Standalone (using VS Code Live Server)**
```
Right-click frontend/index.html → Open with Live Server
```

---

## 🔐 Admin Access

### Default Admin Credentials
```
Email:    admin@wigoherbal.com
Password: Admin@Wigo2026
```

**⚠️ IMPORTANT:** Change the default password immediately after first login!

### Admin Dashboard URL
```
http://localhost:5000/admin/
```

### Admin Features
- View appointment statistics
- Manage appointments (view, update status, delete)
- Manage services (add, edit, delete)
- View and respond to contact messages

---

## 📁 Project Structure

```
wigo-herbal/
├── frontend/                   # Frontend files
│   ├── index.html             # Home page
│   ├── about.html             # About Us page
│   ├── services.html          # Services page
│   ├── address.html           # Location page
│   ├── appointment.html       # Appointment booking
│   ├── contact.html           # Contact page
│   ├── admin/                 # Admin dashboard
│   │   ├── index.html
│   │   ├── admin.css
│   │   └── admin.js
│   ├── css/                   # Stylesheets
│   │   ├── global.css         # Global styles
│   │   ├── home.css
│   │   ├── about.css
│   │   ├── services.css
│   │   ├── address.css
│   │   ├── appointment.css
│   │   └── contact.css
│   ├── js/                    # JavaScript
│   │   ├── language.js        # Bilingual system
│   │   ├── main.js            # Common utilities
│   │   ├── services.js        # Services page logic
│   │   ├── appointment.js     # Appointment form
│   │   └── contact.js         # Contact form
│   ├── translations/          # Language files
│   │   ├── en.json           # English content
│   │   └── am.json           # Amharic content
│   └── assets/               # Images, icons, logo
│       ├── images/
│       ├── icons/
│       └── logo/
│
├── backend/                   # Backend API
│   ├── server.js             # Main Express server
│   ├── package.json
│   ├── .env                  # Environment config
│   ├── config/
│   │   ├── database.js       # MySQL connection
│   │   └── schema.sql        # Database schema
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── serviceController.js
│   │   └── contactController.js
│   ├── middleware/           # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── validate.js       # Input validation
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   ├── services.js
│   │   └── contact.js
│   └── models/               # (Reserved for future ORM)
│
└── README.md                 # This file
```

---

## 🛠️ API Endpoints

### Public Endpoints (No Auth Required)

**Appointments**
```
POST   /api/appointments              # Book appointment
```

**Services**
```
GET    /api/services                  # Get all services
GET    /api/services/:id              # Get single service
```

**Contact**
```
POST   /api/contact                   # Submit contact message
```

### Admin Endpoints (Auth Required)

**Authentication**
```
POST   /api/auth/login                # Admin login
GET    /api/auth/profile              # Get admin profile
PUT    /api/auth/change-password      # Change password
POST   /api/auth/register             # Create admin (superadmin only)
```

**Appointments**
```
GET    /api/appointments              # List appointments (paginated, filterable)
GET    /api/appointments/:id          # Get single appointment
PUT    /api/appointments/:id          # Update appointment status
DELETE /api/appointments/:id          # Delete appointment
GET    /api/appointments/stats/overview # Dashboard statistics
```

**Services**
```
POST   /api/services                  # Create service
PUT    /api/services/:id              # Update service
DELETE /api/services/:id              # Delete service
```

**Contact Messages**
```
GET    /api/contact                   # List messages
PATCH  /api/contact/:id/read          # Mark as read
DELETE /api/contact/:id               # Delete message
```

### Example API Request

**Book Appointment (cURL)**
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "gender": "male",
    "age": 35,
    "phone": "0911234567",
    "email": "john@example.com",
    "address": "Addis Ababa",
    "language": "en",
    "service": "waist-pain",
    "appointment_date": "2026-08-15",
    "appointment_time": "10:00",
    "symptoms": "Lower back pain for 2 weeks"
  }'
```

---

## 🎨 Customization

### Change Colors

Edit `frontend/css/global.css`:
```css
:root {
    --primary-green: #0B6E4F;       /* Main green */
    --secondary-green: #E8F5E9;     /* Light green */
    --accent-green: #2E7D32;        /* Dark green */
    --emerald-green: #43A047;
    --gold: #FFC107;                /* Accent color */
}
```

### Add/Edit Services

1. **Via Admin Dashboard:**
   - Login → Services → Add Service
   - Fill bilingual titles and descriptions

2. **Via Database:**
```sql
INSERT INTO services (title_en, title_am, description_en, description_am, sort_order)
VALUES ('New Service', 'አዲስ አገልግሎት', 'Description', 'መግለጫ', 20);
```

### Update Translations

Edit `frontend/translations/en.json` or `am.json`:
```json
{
  "nav": {
    "home": "Home",
    "about": "About Us"
  }
}
```

---

## 🔒 Security Best Practices

### Production Deployment Checklist

1. ✅ **Change Default Admin Password**
2. ✅ **Update JWT Secret** in `.env`
3. ✅ **Set Strong MySQL Password**
4. ✅ **Set `NODE_ENV=production`** in `.env`
5. ✅ **Enable HTTPS** (use reverse proxy like nginx)
6. ✅ **Restrict CORS Origins** in `server.js`
7. ✅ **Regular Database Backups**
8. ✅ **Keep Dependencies Updated** (`npm audit fix`)

### Secure Environment Variables
Never commit `.env` to version control. Add to `.gitignore`:
```
backend/.env
node_modules/
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
❌ Database connection failed: Access denied
```
**Solution:** Check MySQL credentials in `backend/.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `.env` or kill process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Language Not Switching
**Solution:** Check browser console for errors. Ensure `language.js` is loaded and translations files are accessible.

### Admin Login Not Working
**Solution:**
1. Verify database has admin user (run schema.sql again)
2. Check JWT_SECRET in `.env`
3. Clear browser cache/session storage

---

## 📞 Support & Contact

**WIGO Herbal Traditional Medical Services**

📍 Address: Addis Ababa, North Sub-City, opposite Sarem Hotel

📱 Phone Numbers:
- 0921 808 191
- 0974 001 444
- 0954 262 600
- 0976 763 030

🌐 Social Media:
- **TikTok:** @Wigolove3
- **Instagram:** @AFEWERKABAT
- **Facebook:** @HakimTaye

---

## 📄 License

© 2026 WIGO Herbal Traditional Medical Services. All Rights Reserved.

---

## 🙏 Credits

- **Hakim Taye Tesema** — Founder & Traditional Healer
- Built with ❤️ for natural healing and Ethiopian traditional medicine

---

**Happy Healing! 🌿**
