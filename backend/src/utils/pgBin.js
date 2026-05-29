import fs from 'fs';
import path from 'path';

/**
 * Resolve pg_dump / psql executables on Windows when not in PATH.
 */
export function findPgBin() {
  const fromEnv = process.env.PG_BIN;
  if (fromEnv && fs.existsSync(path.join(fromEnv, 'pg_dump.exe'))) {
    return fromEnv;
  }
  if (fromEnv && fs.existsSync(path.join(fromEnv, 'pg_dump'))) {
    return fromEnv;
  }

  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pgRoot = path.join(programFiles, 'PostgreSQL');
  if (fs.existsSync(pgRoot)) {
    const versions = fs.readdirSync(pgRoot).sort().reverse();
    for (const ver of versions) {
      const bin = path.join(pgRoot, ver, 'bin');
      if (fs.existsSync(path.join(bin, 'pg_dump.exe')) || fs.existsSync(path.join(bin, 'pg_dump'))) {
        return bin;
      }
    }
  }

  return null;
}

export function pgExecutable(name) {
  const bin = findPgBin();
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  if (bin) {
    return path.join(bin, exe);
  }
  return exe;
}

export function pgToolsAvailable() {
  const bin = findPgBin();
  if (bin) {
    return (
      fs.existsSync(path.join(bin, 'pg_dump.exe')) ||
      fs.existsSync(path.join(bin, 'pg_dump'))
    );
  }
  return false;
}
