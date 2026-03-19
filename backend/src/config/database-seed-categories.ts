import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
// ...existing code...

const schemaPath = path.resolve(process.cwd(), '..', 'database', 'migrations', 'initial-schema.sql');
const seedPath = path.resolve(process.cwd(), '..', 'database', 'seeds', 'seed-data.sql');
const seedCategoriesPath = path.resolve(process.cwd(), '..', 'database', 'seeds', 'seed-categories.sql');

// ...existing code...

const seedCategories = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  await db.exec(fs.readFileSync(seedCategoriesPath, 'utf8'));
};

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
  await ensureUserColumns(database);
  await ensureBorrowColumns(database);
  await ensureBorrowRejectedStatus(database);
  await ensureEquipmentColumns(database);
  await ensureEquipmentQuantityIntegrity(database);
  await ensureCategoryTable(database);
  await seedCategories(database); // <-- run seed categories every time
  await seedDatabase(database);

  return database;
};

// ...existing code...
