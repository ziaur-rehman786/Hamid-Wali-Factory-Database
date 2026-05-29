# PostgreSQL Database Credentials

Use these credentials whenever you open **pgAdmin**, **DBeaver**, or connect to the database directly.

| Setting      | Value                    |
|-------------|--------------------------|
| **Host**    | `localhost`              |
| **Port**    | `5432`                   |
| **Database**| `hamid_wali_factory`     |
| **Username**| `hw_factory_admin`       |
| **Password**| `HWFactory@2026Secure`   |

## How to Connect in pgAdmin

1. Open **pgAdmin**
2. Right-click **Servers** → **Register** → **Server**
3. **General** tab: Name = `Hamid Wali Factory`
4. **Connection** tab:
   - Host: `localhost`
   - Port: `5432`
   - Database: `hamid_wali_factory`
   - Username: `hw_factory_admin`
   - Password: `HWFactory@2026Secure`
5. Click **Save**

## PostgreSQL Superuser (for first-time setup only)

During initial setup, the script uses the default PostgreSQL admin user:

| Setting  | Default Value |
|----------|---------------|
| Username | `postgres`    |
| Password | `postgres`    |

If your PostgreSQL `postgres` password is different, add this to `backend/.env`:

```
POSTGRES_ADMIN_PASSWORD=your_postgres_password
```

Then run: `npm run db:setup`

## Security Note

Change `HWFactory@2026Secure` before deploying to Hostinger production.
