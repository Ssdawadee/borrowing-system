import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { config } from './env';

let database: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const schemaPath = path.resolve(process.cwd(), '..', 'database', 'migrations', 'initial-schema.sql');
const seedPath = path.resolve(process.cwd(), '..', 'database', 'seeds', 'seed-data.sql');

export const initializeDatabase = async () => {
  if (database) {
    return database;
  }

  fs.mkdirSync(path.dirname(config.DATABASE_PATH), { recursive: true });

  database = await open({
    filename: config.DATABASE_PATH,
    driver: sqlite3.Database,
  });

  await database.exec('PRAGMA foreign_keys = ON;');
  await database.exec(fs.readFileSync(schemaPath, 'utf8'));
  await ensureBorrowColumns(database);
  await ensureBorrowRejectedStatus(database);
  await ensureEquipmentQuantityIntegrity(database);
  await ensureCategoryTable(database);
  await seedDatabase(database);
  await database.run(
    `UPDATE users
     SET student_id = '6501000001'
     WHERE email = 'alice@student.edu' AND student_id = '65010001'`
  );

  return database;
};

const ensureBorrowColumns = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  const columns = await db.all<Array<{ name: string }>>('PRAGMA table_info(borrows)');
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('borrow_reason')) {
    await db.exec('ALTER TABLE borrows ADD COLUMN borrow_reason TEXT');
  }

  if (!columnNames.has('quantity')) {
    await db.exec('ALTER TABLE borrows ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1');
  }

  if (!columnNames.has('approved_at')) {
    await db.exec('ALTER TABLE borrows ADD COLUMN approved_at TEXT');
  }

  if (!columnNames.has('rejected_at')) {
    await db.exec('ALTER TABLE borrows ADD COLUMN rejected_at TEXT');
  }

  if (!columnNames.has('return_confirmed_at')) {
    await db.exec('ALTER TABLE borrows ADD COLUMN return_confirmed_at TEXT');
  }
};

const ensureBorrowRejectedStatus = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  const table = await db.get<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'borrows'"
  );

  const tableSql = table?.sql || '';
  if (tableSql.includes("'REJECTED'")) {
    return;
  }

  await db.exec('BEGIN');

  try {
    await db.exec(`
      CREATE TABLE borrows_tmp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        borrow_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT NOT NULL,
        return_date TEXT,
        approved_at TEXT,
        rejected_at TEXT,
        return_confirmed_at TEXT,
        borrow_reason TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURN_PENDING', 'RETURNED')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      INSERT INTO borrows_tmp (id, user_id, equipment_id, quantity, borrow_date, due_date, return_date, approved_at, rejected_at, return_confirmed_at, borrow_reason, status)
      SELECT id, user_id, equipment_id, quantity, borrow_date, due_date, return_date, NULL, NULL, NULL, borrow_reason, status
      FROM borrows
    `);

    await db.exec('DROP TABLE borrows');
    await db.exec('ALTER TABLE borrows_tmp RENAME TO borrows');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_borrows_user_id ON borrows(user_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_borrows_equipment_id ON borrows(equipment_id)');

    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
};

const ensureCategoryTable = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const defaultCategories = ['Audio', 'Computing', 'Media', 'Presentation'];

  for (const name of defaultCategories) {
    await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', name);
  }

  const existingEquipmentCategories = await db.all<Array<{ category: string }>>(
    'SELECT DISTINCT category FROM equipment WHERE TRIM(category) != ""'
  );

  for (const row of existingEquipmentCategories) {
    await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', row.category.trim());
  }
};

const ensureEquipmentQuantityIntegrity = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  // Repair legacy data where available quantity is outside valid range.
  await db.exec(`
    UPDATE equipment
    SET available_quantity = CASE
      WHEN available_quantity < 0 THEN 0
      WHEN available_quantity > total_quantity THEN total_quantity
      ELSE available_quantity
    END
  `);
};

const seedDatabase = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  const existingAdmin = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');

  if ((existingAdmin?.count || 0) > 0) {
    return;
  }

  await db.exec(fs.readFileSync(seedPath, 'utf8'));
};

export const getDatabase = () => {
  if (!database) {
    throw new Error('Database has not been initialized.');
  }

  return database;
};