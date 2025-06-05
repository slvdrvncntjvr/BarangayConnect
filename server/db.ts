import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Create a new SQLite database file in the project directory
const sqlite = new Database('database.db');

// Initialize drizzle with SQLite
export const db = drizzle(sqlite, { schema });