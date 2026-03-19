import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

// 1. ต้อง Import config เข้ามา (แก้ path ให้ตรงกับที่เก็บไฟล์ config ของคุณ)
import { config } from './env'; // หรือพาทที่ถูกต้องของโปรเจกต์คุณ

// 2. ต้อง Import ฟังก์ชัน ensure ต่างๆ และ seedDatabase เข้ามาด้วย
// (แก้ path ให้ตรงกับไฟล์ที่คุณเขียนฟังก์ชันพวกนี้ไว้)
import { 
  ensureUserColumns, 
  ensureBorrowColumns, 
  ensureBorrowRejectedStatus, 
  ensureEquipmentColumns, 
  ensureEquipmentQuantityIntegrity, 
  ensureCategoryTable,
  seedDatabase 
} from './database'; 

// 3. ต้องประกาศตัวแปร database ไว้ด้านนอกฟังก์ชัน เพื่อเก็บสถานะการเชื่อมต่อ
let database: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const schemaPath = path.resolve(process.cwd(), '..', 'database', 'migrations', 'initial-schema.sql');
const seedPath = path.resolve(process.cwd(), '..', 'database', 'seeds', 'seed-data.sql');
const seedCategoriesPath = path.resolve(process.cwd(), '..', 'database', 'seeds', 'seed-categories.sql');

const seedCategories = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  await db.exec(fs.readFileSync(seedCategoriesPath, 'utf8'));
};

export const initializeDatabase = async () => {
  // ตอนนี้มันจะรู้จัก database แล้ว
  if (database) {
    return database;
  }

  // ตอนนี้มันจะรู้จัก config แล้ว
  fs.mkdirSync(path.dirname(config.DATABASE_PATH), { recursive: true });

  database = await open({
    filename: config.DATABASE_PATH,
    driver: sqlite3.Database,
  });

  await database.exec('PRAGMA foreign_keys = ON;');
  await database.exec(fs.readFileSync(schemaPath, 'utf8'));
  
  // ตอนนี้มันจะรู้จักฟังก์ชันพวกนี้แล้ว
  await ensureUserColumns(database);
  await ensureBorrowColumns(database);
  await ensureBorrowRejectedStatus(database);
  await ensureEquipmentColumns(database);
  await ensureEquipmentQuantityIntegrity(database);
  await ensureCategoryTable(database);
  await seedCategories(database);
  await seedDatabase(database);

  return database;
};