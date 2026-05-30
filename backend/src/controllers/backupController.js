import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { pgExecutable, findPgBin, pgToolsAvailable } from '../utils/pgBin.js';
import { msg } from '../i18n/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const execAsync = promisify(exec);
const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const pgEnv = () => ({
  ...process.env,
  PGPASSWORD: process.env.DB_PASSWORD,
});

export const getBackupStatus = async (req, res) => {
  const bin = findPgBin();
  res.json({
    toolsAvailable: pgToolsAvailable(),
    pgBin: bin || 'PATH',
    backupDir,
  });
};

export const createBackup = async (req, res) => {
  try {
    if (!pgToolsAvailable()) {
      return res.status(500).json({
        message:
          'pg_dump not found. Install PostgreSQL or set PG_BIN in backend/.env (e.g. C:\\Program Files\\PostgreSQL\\16\\bin)',
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const pgDump = pgExecutable('pg_dump');
    const cmd = `"${pgDump}" -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f "${filepath}"`;

    await execAsync(cmd, { env: pgEnv() });

    res.json({ message: msg(req, 'backupCreated'), filename, path: filepath });
  } catch (err) {
    res.status(500).json({
      message: 'Backup failed',
      error: err.message,
    });
  }
};

export const listBackups = async (req, res) => {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => ({
        name: f,
        size: fs.statSync(path.join(backupDir, f)).size,
        created: fs.statSync(path.join(backupDir, f)).mtime,
      }))
      .sort((a, b) => b.created - a.created);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    if (!pgToolsAvailable()) {
      return res.status(500).json({ message: msg(req, 'psqlNotFound') });
    }

    const { filename } = req.body;
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: msg(req, 'backupNotFound') });
    }

    const psql = pgExecutable('psql');
    const cmd = `"${psql}" -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f "${filepath}"`;

    await execAsync(cmd, { env: pgEnv() });

    res.json({ message: msg(req, 'restoreSuccess') });
  } catch (err) {
    res.status(500).json({
      message: 'Restore failed',
      error: err.message,
    });
  }
};

export const downloadBackup = async (req, res) => {
  try {
    const filepath = path.join(backupDir, req.params.filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ message: msg(req, 'notFound') });
    res.download(filepath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
