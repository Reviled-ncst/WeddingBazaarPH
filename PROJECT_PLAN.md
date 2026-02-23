# Wedding Bazaar - Project Plan

## 🎯 Project Overview
A modern wedding marketplace platform connecting couples with wedding providers and coordinators. Built with Next.js, Tailwind CSS, and PHP/MySQL backend on XAMPP.

**Theme:** Dark (#0a0a0a) with pastel pink accents (#f8b4cb)  
**Locale:** Philippines (PHP currency, PH phone validation)  
**User Roles:** Couple, Provider, Coordinator

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │Homepage │  │Individual│  │ Vendor  │  │  Auth System    │ │
│  │         │  │Dashboard │  │Dashboard│  │  (Login/Signup) │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (PHP on XAMPP)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Auth    │  │ Vendors │  │Bookings │  │    Services     │ │
│  │   API   │  │   API   │  │   API   │  │      API        │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                         │
│  users │ vendors │ services │ bookings │ reviews │ messages │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Development Phases

### Phase 1: Foundation ✅
- [x] Initialize Next.js project with TypeScript & Tailwind
- [x] Set up folder structure
- [x] Configure Tailwind theme (dark + pastel pink)
- [x] Create reusable UI components (Button, Card, Input, Modal, Badge)
- [x] Set up MySQL database schema
- [ ] Create PHP API endpoints

### Phase 2: Homepage ✅
- [x] Hero section with CTA buttons
- [x] Service categories grid (expandable icons)
- [x] Featured providers carousel
- [x] Testimonials section
- [x] Footer with links
- [x] Mobile responsive design

### Phase 3: Authentication ✅
- [x] Login page
- [x] Register page (Couple, Provider, Coordinator roles)
- [ ] JWT token management (PHP API pending)
- [x] Session persistence (client-side)
- [ ] Password reset flow
- [ ] Protected routes

### Phase 4: Provider System 🔄
- [x] Provider listing page with filters
- [x] Provider profile/detail page
- [x] Provider categories (Photographer, Caterer, Venue, etc.)
- [x] Gallery/portfolio display
- [ ] Reviews & ratings (API pending)
- [ ] Contact provider form

### Phase 5: Individual Dashboard 💑
- [ ] Dashboard overview
- [ ] Browse services
- [ ] My bookings
- [ ] Saved vendors
- [ ] Messages inbox
- [ ] Profile settings

### Phase 6: Vendor Dashboard 📊
- [ ] Dashboard overview (stats, revenue)
- [ ] Manage services/packages
- [ ] Booking requests
- [ ] Client messages
- [ ] Reviews management
- [ ] Business profile settings

### Phase 7: Booking System 📅
- [ ] Service selection
- [ ] Date/time picker
- [ ] Pricing calculation
- [ ] Booking confirmation
- [ ] Booking status tracking
- [ ] Cancellation flow

### Phase 8: Polish & Deploy 🚀
- [ ] Error handling
- [ ] Loading states
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] XAMPP deployment guide

---

## 📁 Folder Structure

```
wedding-bazaar-next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── (auth)/             # Auth routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── vendors/            # Vendor pages
│   │   │   ├── page.tsx        # Vendor listing
│   │   │   └── [id]/           # Vendor detail
│   │   ├── dashboard/          # Individual dashboard
│   │   │   ├── page.tsx
│   │   │   ├── bookings/
│   │   │   ├── messages/
│   │   │   └── profile/
│   │   └── vendor-dashboard/   # Vendor dashboard
│   │       ├── page.tsx
│   │       ├── services/
│   │       ├── bookings/
│   │       └── analytics/
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Base UI (Button, Card, Modal)
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── home/               # Homepage sections
│   │   └── forms/              # Form components
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Auth helpers
│   │   └── utils.ts            # General utilities
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript interfaces
│   └── context/                # React Context providers
│
├── public/                     # Static assets
│   └── images/
│
└── api/                        # PHP Backend (copy to XAMPP)
    ├── config/
    │   └── database.php
    ├── auth/
    │   ├── login.php
    │   ├── register.php
    │   └── logout.php
    ├── vendors/
    │   ├── list.php
    │   ├── detail.php
    │   └── create.php
    ├── bookings/
    │   ├── create.php
    │   ├── list.php
    │   └── update.php
    ├── services/
    │   └── categories.php
    └── .htaccess
```

---

## 🗄️ Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | Unique email |
| password | VARCHAR(255) | Hashed password |
| name | VARCHAR(100) | Full name |
| role | ENUM('individual','vendor','admin') | User type |
| phone | VARCHAR(20) | Contact number |
| avatar | VARCHAR(255) | Profile image URL |
| created_at | TIMESTAMP | Registration date |

### vendors
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | FK to users |
| business_name | VARCHAR(255) | Company name |
| category | VARCHAR(50) | Service category |
| description | TEXT | About the business |
| location | VARCHAR(255) | City/area |
| price_range | VARCHAR(50) | Budget range |
| rating | DECIMAL(2,1) | Average rating |
| images | JSON | Gallery images |
| is_verified | BOOLEAN | Verified badge |

### services
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| vendor_id | INT | FK to vendors |
| name | VARCHAR(255) | Service name |
| description | TEXT | Details |
| price | DECIMAL(10,2) | Cost |
| duration | VARCHAR(50) | Time period |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | FK to users (customer) |
| vendor_id | INT | FK to vendors |
| service_id | INT | FK to services |
| event_date | DATE | Wedding date |
| status | ENUM('pending','confirmed','completed','cancelled') | |
| total_price | DECIMAL(10,2) | Booking total |
| notes | TEXT | Special requests |
| created_at | TIMESTAMP | Booking date |

### reviews
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | FK to users |
| vendor_id | INT | FK to vendors |
| booking_id | INT | FK to bookings |
| rating | INT | 1-5 stars |
| comment | TEXT | Review text |
| created_at | TIMESTAMP | |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| sender_id | INT | FK to users |
| receiver_id | INT | FK to users |
| content | TEXT | Message body |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | |

---

## 🎨 Design System

### Colors
```css
/* Primary - Wedding Pink */
--pink-50: #fdf2f8;
--pink-100: #fce7f3;
--pink-200: #fbcfe8;
--pink-300: #f9a8d4;
--pink-400: #f472b6;
--pink-500: #ec4899;

/* Neutral */
--white: #ffffff;
--black: #000000;
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;

/* Accent */
--gold: #d4af37;
```

### Typography
- **Headings**: Playfair Display (elegant serif)
- **Body**: Inter (clean sans-serif)

### Components
- Glassmorphism cards (backdrop-blur, transparency)
- Rounded corners (rounded-2xl, rounded-3xl)
- Soft shadows
- Hover animations (scale, glow effects)

---

## 🔧 XAMPP Setup

1. **Start XAMPP** - Apache & MySQL
2. **Create Database**:
   ```sql
   CREATE DATABASE wedding_bazaar;
   ```
3. **Import Schema**: Run the SQL from `api/config/schema.sql`
4. **Copy API folder**: `api/` → `C:\xampp\htdocs\wedding-bazaar-api\`
5. **Configure CORS** in `.htaccess`
6. **Update API URL** in Next.js `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost/wedding-bazaar-api
   ```

---

## 🚦 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Project Setup | ✅ Done | Next.js + Tailwind ready |
| Folder Structure | 🔄 Next | Create all folders |
| Database Schema | ⏳ Pending | |
| PHP API | ⏳ Pending | |
| Homepage | ⏳ Pending | |
| Authentication | ⏳ Pending | |
| Vendor System | ⏳ Pending | |
| Dashboards | ⏳ Pending | |
| Booking System | ⏳ Pending | |

---

## 📝 Next Steps

1. **Create folder structure** - Set up all directories
2. **Build base UI components** - Button, Card, Modal, Input
3. **Create layout** - Header, Footer with navigation
4. **Build Homepage** - Hero, Services, Vendors sections
5. **Set up MySQL database** - Create tables in XAMPP
6. **Build PHP API endpoints** - Start with auth

---

*Last Updated: February 14, 2026*
