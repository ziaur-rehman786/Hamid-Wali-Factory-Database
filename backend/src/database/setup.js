import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const postgresPassword = process.env.POSTGRES_ADMIN_PASSWORD;
if (!postgresPassword || postgresPassword === 'YOUR_POSTGRES_PASSWORD_HERE') {
  console.error('\nERROR: Set your real PostgreSQL password in backend/.env\n');
  console.error('  POSTGRES_ADMIN_PASSWORD=your_pgadmin_postgres_password\n');
  console.error('This is the password for user "postgres" in pgAdmin — NOT DB_PASSWORD.\n');
  process.exit(1);
}

const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: 'postgres',
  password: postgresPassword,
};

const dbName = process.env.DB_NAME || 'hamid_wali_factory';
const dbUser = process.env.DB_USER || 'hw_factory_admin';
const dbPassword = process.env.DB_PASSWORD || 'HWFactory@2026Secure';

async function setup() {
  const adminPool = new pg.Pool({ ...adminConfig, database: 'postgres' });

  try {
    console.log('Setting up Hamid Wali Shoe Factory database...\n');

    const userExists = await adminPool.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [dbUser]
    );

    if (userExists.rows.length === 0) {
      await adminPool.query(`CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}'`);
      console.log(`Created database user: ${dbUser}`);
    } else {
      await adminPool.query(`ALTER USER ${dbUser} WITH PASSWORD '${dbPassword}'`);
      console.log(`Updated password for user: ${dbUser}`);
    }

    const dbExists = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (dbExists.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName} OWNER ${dbUser}`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
    }

    await adminPool.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`);
    await adminPool.end();

    const appPool = new pg.Pool({
      host: adminConfig.host,
      port: adminConfig.port,
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await appPool.query(schema);
    console.log('Schema applied successfully.');

    await appPool.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO ' + dbUser);
    await appPool.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ' + dbUser);
    await appPool.end();

    console.log('\n========================================');
    console.log('DATABASE SETUP COMPLETE');
    console.log('========================================');
    console.log(`Database Name: ${dbName}`);
    console.log(`Username:      ${dbUser}`);
    console.log(`Password:      ${dbPassword}`);
    console.log(`Host:          ${adminConfig.host}`);
    console.log(`Port:          ${adminConfig.port}`);
    console.log('========================================\n');
    console.log('Run: npm run db:seed  (to add sample data)');
  } catch (err) {
    console.error('Setup failed:', err.message);
    if (err.message.includes('password authentication')) {
      console.log('\nWrong POSTGRES_ADMIN_PASSWORD in backend/.env');
      console.log('Use the same password you enter in pgAdmin for user "postgres".');
      console.log('Open pgAdmin → connect to your server → that password goes in .env\n');
    }
    process.exit(1);
  }
}

setup();
