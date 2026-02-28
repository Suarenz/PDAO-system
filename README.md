<div align="center">

# ♿ PDAO System

### Person with Disability Affairs Office — Management System

> A comprehensive full-stack web application for managing PWD (Person with Disability) records, services, appointments, and ID generation for the Municipality of Pagsanjan.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

---

## 🌟 Overview

The **PDAO System** is a digital solution designed for the Persons with Disability Affairs Office of Pagsanjan. It streamlines the management of PWD records, automates ID generation, handles appointment scheduling, and provides powerful data analytics through an intuitive dashboard — empowering government staff to deliver better services to the PWD community.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Admin & Staff Portal
- **Dashboard Analytics** — Real-time statistics with interactive charts (age groups, gender, barangay, employment, disability types)
- **PWD Records Management** — Register, search, update, and manage PWD profiles
- **Approval Queue** — Review and approve/reject new PWD applications
- **Appointment Scheduling** — Manage ID claim appointments
- **Service Request Management** — Track and fulfill service requests
- **ID Layout Editor** — Customize and generate PWD ID cards
- **Reports & Export** — Generate masterlist, statistical, and demographic reports (Excel/CSV/PDF)
- **Backup & Restore** — Database backup and restore functionality
- **Audit History Log** — Track all system activities
- **User Account Management** — Role-based account administration

</td>
<td width="50%">

### 🧑‍🦽 PWD User Portal
- **Online Registration** — Submit PWD applications digitally
- **Application Tracking** — Monitor registration status in real-time
- **Digital ID** — View and access PWD ID digitally
- **Appointment Booking** — Schedule ID pickup appointments
- **Service Requests** — Request services and assistance online
- **Profile Management** — Update personal and contact information
- **Accessibility Options** — Built-in accessibility features (font size, high contrast, screen reader support)

</td>
</tr>
</table>

### 🏛️ Executive Dashboard
- **Mayor's Dashboard** — High-level overview for the Municipal Mayor with key metrics and trends

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite |
| **Backend** | Laravel 11, PHP 8.2+, Sanctum (Auth) |
| **Database** | MySQL 8.0 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF, DomPDF |
| **Excel Export** | Maatwebsite Excel |
| **Routing** | React Router DOM v6 |

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│          (Vite + TypeScript + Tailwind CSS)              │
│                                                          │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │ PWD Mgmt  │ │ Reports  │ │User Portal│  │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────────┼────────────┼──────────────┘        │
│                     │  Axios API Client                  │
└─────────────────────┼────────────────────────────────────┘
                      │  REST API (JSON)
┌─────────────────────┼────────────────────────────────────┐
│               Laravel Backend API                        │
│           (PHP 8.2 + Sanctum Auth)                       │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐  │
│  │Auth/RBAC │ │Controllers│ │ Models   │ │ Exports   │  │
│  └──────────┘ └───────────┘ └──────────┘ └───────────┘  │
│                     │                                    │
└─────────────────────┼────────────────────────────────────┘
                      │
               ┌──────┴──────┐
               │   MySQL DB  │
               └─────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x & **npm**
- **PHP** ≥ 8.2
- **Composer**
- **MySQL** 8.0+
- **XAMPP** (or any local MySQL/Apache server)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Suarenz/PDAO-system.git
cd PDAO-system
```

### 2️⃣ Install Frontend Dependencies

```bash
npm install
```

### 3️⃣ Setup Backend

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
```

Configure your database credentials in `server/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pdao_system
DB_USERNAME=root
DB_PASSWORD=
```

### 4️⃣ Run Migrations

```bash
php artisan migrate --seed
```

### 5️⃣ Start the Application

From the project root, run both frontend and backend concurrently:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 — Backend API (port 8000)
cd server
php artisan serve

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

### 6️⃣ Access the Application

| Service | URL |
|:---|:---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8000/api` |

---

## 👥 User Roles

| Role | Access Level |
|:---|:---|
| 🔑 **Admin** | Full system access — manage users, records, settings, backups |
| 📋 **Staff** | Manage PWD records, approvals, appointments, reports |
| ⌨️ **Encoder** | Add and register new PWD records |
| 🏛️ **Mayor** | Executive dashboard with high-level analytics and reports |
| 🧑‍🦽 **PWD Member** | Personal portal — view profile, digital ID, services |
| 👤 **User** | Public portal — submit applications, track status |

---

## 📁 Project Structure

```
PDAO-system/
├── public/                  # Static assets (logos, images)
├── src/                     # React frontend source
│   ├── api/                 # API service layer (Axios clients)
│   ├── components/          # Reusable UI components
│   ├── context/             # React context (Auth)
│   ├── pages/               # Admin/Staff page components
│   │   ├── Dashboard.tsx
│   │   ├── AddPwd.tsx
│   │   ├── ListPwd.tsx
│   │   ├── ApprovalQueue.tsx
│   │   ├── Reports.tsx
│   │   └── ...
│   ├── portal/              # PWD User Portal components
│   │   ├── UserPortal.tsx
│   │   ├── PortalDashboard.tsx
│   │   ├── MyDigitalId.tsx
│   │   └── ...
│   ├── App.tsx              # Main application router
│   └── types.ts             # TypeScript type definitions
├── server/                  # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Observers/
│   ├── config/
│   ├── database/migrations/
│   ├── routes/api.php       # API route definitions
│   └── ...
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔌 API Endpoints

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/login` | User login |
| POST | `/api/register` | User registration |
| POST | `/api/logout` | User logout |
| GET | `/api/me` | Get current user profile |
| POST | `/api/change-password` | Change password |

</details>

<details>
<summary><b>PWD Management</b></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/pwd` | List all PWD records |
| POST | `/api/pwd` | Create new PWD record |
| GET | `/api/pwd/{id}` | Get PWD record details |
| PUT | `/api/pwd/{id}` | Update PWD record |
| GET | `/api/pwd/search-by-number` | Search by PWD number |
| GET | `/api/pwd/lookups` | Get lookup data (barangays, disabilities, etc.) |

</details>

<details>
<summary><b>Dashboard & Reports</b></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/reports/generate` | Generate reports (Excel/CSV/PDF) |

</details>

<details>
<summary><b>Appointments & Services</b></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/service-requests` | List service requests |
| POST | `/api/service-requests` | Create service request |

</details>

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ for the PWD community of Pagsanjan**

</div>
