# How to Run the Database (Simple Guide)

## What you need first

1. **PostgreSQL** installed on your PC (you already have it)
2. **Node.js** installed

---

## Easy way (Windows) — double-click

1. Open folder: `Factory Database`
2. Double-click: **`setup-database.bat`**
3. Wait until you see **"DATABASE SETUP COMPLETE"**
4. Done!

---

## Manual way (PowerShell)

Open PowerShell in the project folder and run these **one by one**:

### Step 1 — Go to backend folder

```powershell
cd "C:\Users\Zia Ur Rehman\Desktop\My Projects 2\Factory Database\backend"
```

### Step 2 — Install packages (first time only)

```powershell
npm install
```

### Step 3 — Create database + tables

```powershell
npm run db:setup
```

### Step 4 — Add sample data (designs, stock, customers, login users)

```powershell
npm run db:seed
```

---

## Database login (for pgAdmin)

Use these when connecting in **pgAdmin**:

| Field      | Value                |
|-----------|----------------------|
| Host      | `localhost`          |
| Port      | `5432`               |
| Database  | `hamid_wali_factory` |
| Username  | `hw_factory_admin`   |
| Password  | `Postgres@123`       |

---

## If setup fails

**Error: password authentication failed for user "postgres"**

1. Open file: `backend\.env`
2. Change this line to your real PostgreSQL password (same as pgAdmin):

```
POSTGRES_ADMIN_PASSWORD=YOUR_REAL_PASSWORD
```

3. Run `setup-database.bat` again

---

## Start the website after database is ready

Double-click: **`start-app.bat`**

Or run:

```powershell
cd "C:\Users\Zia Ur Rehman\Desktop\My Projects 2\Factory Database"
npm run dev
```

Open browser: **http://localhost:3000**

| Login  | Username | Password   |
|--------|----------|------------|
| Admin  | `admin`  | `admin123` |
| Staff  | `staff`  | `staff123` |

---

## Useful commands

| Command | What it does |
|---------|----------------|
| `npm run db:setup` | Create database + tables |
| `npm run db:seed` | Add designs, stock, users |
| `npm run db:customers` | Update customer list only |
