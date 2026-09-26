<div align="center">

# 🪔 Digital Vargani

### Ganpati Mandal Management & Vargani Collection System

A modern digital platform for managing **households, Vargani collections, digital Pauti, collectors, expenses, income and Hishob** — replacing traditional paper-based Mandal management with a centralized and secure system.

<br/>

<a href="https://digital-vargani-main.vercel.app/">
<img src="https://img.shields.io/badge/Live%20Application-Visit-7C3AED?style=for-the-badge&logo=vercel&logoColor=white"/>
</a>

<a href="https://github.com/Pradyum-02/digital-vargani">
<img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github"/>
</a>

<br/><br/>


---

## ✨ About

**Digital Vargani** is a full-stack web application built to digitize the complete Vargani collection and accounting workflow of a Ganpati Mandal.

Instead of maintaining paper registers, handwritten Pauti receipts and separate expense records, the system provides a centralized platform where authorized users can manage:

- 🏠 Households
- 💰 Vargani Collections
- 🧾 Digital Pauti
- 👥 Collectors
- 💸 Expenses
- 📈 Income
- 📊 Hishob
- 🔐 Role-Based Access
- 📱 Public Pauti Verification

The system is currently configured for:

> **Vedant Residency Ganpati Mandal — 2026**

---

# 🚀 Features

<table>
<tr>

<td width="50%" valign="top">

### 🏠 Household Management

Manage every household through a structured hierarchy:

**Phase → Wing → Floor → Flat**

Each household can contain:

- Resident name
- Mobile number
- Flat number
- Expected Vargani
- Previous year amount
- Assigned collector
- Notes
- Exemption status

</td>

<td width="50%" valign="top">

### 💰 Vargani Collection

Record collections using multiple payment methods:

- UPI
- Cash
- Bank
- Cheque

Each collection maintains:

- Pauti number
- Amount
- Date
- Collector
- Payment method
- Notes
- Household reference

</td>

</tr>

<tr>

<td width="50%" valign="top">

### 🧾 Digital Pauti

Generate professional digital Pauti receipts containing:

- Mandal information
- Pauti number
- Collection date
- Resident details
- Flat information
- Amount
- Payment method
- Amount in words
- Collector
- Notes

Pauti can be downloaded, printed and shared.

</td>

<td width="50%" valign="top">

### 📊 Hishob

Centralized financial management for:

- Vargani
- Sponsorship
- Other income
- Expenses
- Remaining balance

The system provides a clear view of the Mandal's financial position.

</td>

</tr>

<tr>

<td width="50%" valign="top">

### 👥 Collector Management

Manage multiple collectors with:

- Name
- Mobile
- Email
- Role
- Active status
- Wing assignments
- Authentication mapping

</td>

<td width="50%" valign="top">

### 🔐 Role-Based Access

Supported roles:

**SUPER_ADMIN · COLLECTOR · VIEWER**

Access is controlled through authentication and database-level security.

</td>

</tr>

</table>

---

# 🏗️ Architecture

<p align="center">

<img src="https://img.shields.io/badge/Mandal-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Buildings-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Wings-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Households-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Collections-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Pauti-7C3AED?style=for-the-badge"/>

</p>

The core application hierarchy is:

**Mandal → Phase → Wing → Floor → Flat → Household → Collection → Pauti**

### Application Flow

**Collector**

↓  

**Authentication**

↓

**Dashboard**

↓

**Household**

↓

**Collection**

↓

**Digital Pauti**

Alongside the collection workflow, administrators can manage:

**Hishob → Income → Expenses → Reports**

---

# 🛠️ Tech Stack

<p align="center">

<img src="https://skillicons.dev/icons?i=typescript,react,vite,tailwind,nodejs,supabase,postgres,docker,git,github,vercel" />

</p>

<p align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>

</p>

<p align="center">

<img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase%20Auth-Authentication-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
<img src="https://img.shields.io/badge/RLS-Enabled-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/jsPDF-PDF-E34F26?style=for-the-badge"/>

</p>

---

# 🗄️ Database

Digital Vargani uses **PostgreSQL through Supabase**.

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | Authenticated user profiles and roles |
| `mandals` | Mandal configuration |
| `buildings` | Phase/building records |
| `wings` | Wing records |
| `collectors` | Collector management |
| `households` | Resident and flat records |
| `collections` | Vargani collection records |
| `expenses` | Mandal expense records |
| `incomes` | Sponsorship and other income |
| `notifications` | Application notifications |
| `audit_logs` | Activity and audit records |

### Database Relationships

**Mandal**

→ Buildings

→ Wings

→ Households

→ Collections

→ Expenses

→ Income

→ Collectors

→ Audit Logs

---

# 🔐 Security

Digital Vargani uses **Supabase Authentication and PostgreSQL Row Level Security (RLS)** to protect application data.

### Security Features

- 🔑 Supabase Authentication
- 🛡️ PostgreSQL Row Level Security
- 👤 Role-Based Access Control
- 🔒 Protected administrative workflows
- 🔐 Security-definer database functions
- 🚫 Controlled public Pauti access
- 🌐 Environment-based configuration

### Environment Variables

The frontend requires:

`VITE_SUPABASE_URL`

`VITE_SUPABASE_ANON_KEY`

Example:

    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key

Private service-role credentials are **never exposed to the frontend**.

---

# 🧾 Digital Pauti

Every collection can generate a professional digital Pauti.

A Pauti contains:

- Mandal name
- Mandal year
- Pauti number
- Collection date
- Resident name
- Flat number
- Mobile number
- Collection amount
- Payment method
- Amount in words
- Collector
- Notes

### Pauti Workflow

**Household**

↓

**Collection**

↓

**Pauti Number**

↓

**PDF Generation**

↓

**Download / Print / Share**

### Pauti Numbering

Current configuration:

| Setting | Value |
|---|---|
| Mandal | Vedant Residency Ganpati Mandal |
| Year | 2026 |
| Prefix | GM |

Examples:

`GM-0001`

`GM-0002`

`GM-0003`

---

# 🌐 Public Pauti Verification

Residents can verify their collection through the public Pauti interface.

Supported lookup methods:

- Pauti Number
- Mobile Number
- Pauti Number + Mobile Number

The public Pauti system is separated from the administrative dashboard and does not expose the complete collection database.

---

# 💵 Financial Management

Digital Vargani provides centralized financial management.

### Income

The system can track:

- Vargani
- Sponsorship
- Other Income

### Expenses

The system can track Mandal expenditure separately.

### Financial Flow

**Vargani + Sponsorship + Other Income**

↓

**Total Income**

↓

**Expenses**

↓

**Remaining Balance**

This provides a clear yearly Hishob for the Mandal.

---

# 🏘️ Current Mandal Structure

The current Vedant Residency structure is:

| Phase | Wings |
|---|---|
| Phase 1 | A, B, C |
| Phase 2 | A, B, C |
| Phase 3 | A, B |

Households are organized using:

**Phase → Wing → Floor → Flat**

---

# 👥 Collector Management

Collectors are managed through the application and linked with their authenticated accounts where applicable.

Collector records contain:

- Name
- Mobile
- Email
- Role
- Active status
- Assigned wings
- Authentication identity

### Supported Roles

**SUPER_ADMIN**

Full administrative access to permitted system functionality.

**COLLECTOR**

Collection-focused access for authorized Mandal collectors.

**VIEWER**

Read-only access for permitted information.

---

# 📱 Mobile First

The application is designed around real-world collection workflows.

Collectors can use the application directly while visiting households.

### Collection Workflow

**Search Household**

↓

**Open Household**

↓

**Record Collection**

↓

**Generate Pauti**

↓

**Share / Print**

The interface is optimized for both mobile collection work and desktop administration.

---

# ⚙️ Installation

### Clone Repository

    git clone https://github.com/Pradyum-02/digital-vargani.git
    cd digital-vargani

### Install Dependencies

    npm install

### Configure Environment

Create a `.env` file in the project root.

    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

### Start Development Server

    npm run dev

### Production Build

    npm run build

---

# 🚀 Deployment

Digital Vargani is deployed using **Vercel**.

### Production Configuration

| Setting | Value |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Required Environment Variables

`VITE_SUPABASE_URL`

`VITE_SUPABASE_ANON_KEY`

The production environment variables must point to the active Supabase project.

---

# 📂 Project Structure

    digital-vargani/
    │
    ├── public/
    │   └── ganpati-pauti.png
    │
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   │   └── supabase.ts
    │   ├── routes/
    │   ├── types/
    │   ├── utils/
    │   └── main.tsx
    │
    ├── .env
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── README.md

---

# 📈 Roadmap

### Collection

- [x] Household management
- [x] Vargani collection
- [x] Multiple payment methods
- [x] Digital Pauti
- [x] Public Pauti verification

### Management

- [x] Collector management
- [x] Role-based access
- [x] Expense management
- [x] Income management
- [x] Hishob
- [x] Mobile responsive interface

### Planned

- [ ] WhatsApp Business API integration
- [ ] Automated Pauti delivery
- [ ] Collection reminders
- [ ] Pending-payment notifications
- [ ] Advanced financial analytics
- [ ] Excel export
- [ ] Advanced reporting
- [ ] Collector performance analytics
- [ ] Automated yearly archival
- [ ] Multi-Mandal support
- [ ] Offline collection support
- [ ] Payment reconciliation

---

# 🧠 Design Principles

### Simple

Collection workflows should be quick and easy to understand.

### Accurate

Household and financial records should remain structured and traceable.

### Secure

Administrative and household information should only be accessible to authorized users.

### Transparent

Collections, income, expenses and remaining balance should be clearly represented.

### Maintainable

The application should remain easy to update and extend.

### Mobile First

The collection experience is designed primarily for mobile devices used in the field.

---

# 📊 Project Status

<div align="center">

<img src="https://img.shields.io/badge/Status-Production-22C55E?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel"/>
<img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase"/>
<img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql"/>

</div>

Digital Vargani currently provides:

- Household management
- Vargani collection
- Digital Pauti generation
- Collector management
- Expense tracking
- Income tracking
- Hishob
- Public Pauti verification
- Role-based access control

---

# 🔮 Future Vision

Digital Vargani is designed to evolve beyond a single Mandal deployment.

The architecture can eventually support multiple Mandals while maintaining separate:

- Households
- Collectors
- Collections
- Pauti
- Expenses
- Income
- Financial reports

The long-term goal is to create a reliable digital operating system for community-level Mandal management.

---

# 🔒 Privacy

The application may process potentially sensitive information including:

- Resident names
- Mobile numbers
- Flat numbers
- Collection records
- Payment information
- Financial records

Production data should only be accessed by authorized Mandal personnel.

Never commit the following files to Git:

`.env`

`.env.local`

`.env.*.local`

Never expose private database credentials or Supabase service-role keys.

---

# 🤝 Contributing

Digital Vargani is currently a private, project-specific application.

Contribution guidelines may be introduced if the project is opened for external contributions in the future.

---

# 📜 License

This project is developed for the management of **Vedant Residency Ganpati Mandal**.

Unless a separate open-source license is added, the source code and application should be treated as proprietary.

---

<div align="center">

# 🪔 Digital Vargani

### Digitizing Vargani. Simplifying Hishob. Preserving Every Pauti.

<br/>

**Ganpati Bappa Morya! 🙏**

<br/>

<img src="https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>

</div>
