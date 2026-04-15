// @ts-ignore - Ignora a falta da biblioteca drizzle
import { drizzle } from 'drizzle-orm/better-sqlite3';
// @ts-ignore - Ignora a falta da biblioteca better-sqlite3
import Database from 'better-sqlite3';

// IMPORTANTE: Use o caminho relativo COM a extensão .ts 
// ou sem extensão nenhuma, dependendo do erro.
import * as schema from './schema.ts'; // Force a extensão .ts aqui

// @ts-ignore
const sqlite = new Database('sqlite.db');

// @ts-ignore
export const db = drizzle(sqlite, { schema });