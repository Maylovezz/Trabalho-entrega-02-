// @ts-ignore
import { drizzle } from 'drizzle-orm/better-sqlite3';
// @ts-ignore
import Database from 'better-sqlite3';
import * as schema from './schema.ts';

// @ts-ignore
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });