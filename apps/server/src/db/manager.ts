import SQLite, { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { logger } from '../tools/logger';
import { Migrator } from '../tools/migrator';
import { migrations } from './migrations';
import { Repository } from './repositories';
import { RunResult } from './types';

const DB_FILE = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'db.sqlite',
);

export class DbManager {
    private dbInstance: Database | undefined;
    private migrator: Migrator | undefined;

    constructor() {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }

    health = async (): Promise<void> => {
        await this.getDb();
    };

    getDb = async (): Promise<Database> => {
        if (!this.dbInstance) {
            this.dbInstance = new SQLite(DB_FILE);
            // Auto-run migrations
            await this.runMigrations();
        }

        return this.dbInstance;
    };

    private async runMigrations() {
        if (this.dbInstance && !this.migrator) {
            this.migrator = new Migrator(this.dbInstance);
            this.migrator.registerAll(migrations);
            await this.migrator.runMigrations(this.dbInstance);
            logger.info('All migrations completed');
        }
    }

    run = async (sql: string, params?: unknown[]): Promise<RunResult> => {
        const database = await this.getDb();
        const stmt = database.prepare(sql);
        const info = stmt.run(...(params || []));

        return {
            changes: info.changes,
            ...(info.lastInsertRowid !== undefined && {
                lastID: Number(info.lastInsertRowid),
            }),
        };
    };

    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
        return this.getDb().then((database) => {
            const stmt = database.prepare(sql);
            return stmt.get(...(params || [])) as T | undefined;
        });
    }

    all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
        return this.getDb().then((database) => {
            const stmt = database.prepare(sql);
            return stmt.all(...(params || [])) as T[];
        });
    }

    /**
     * Crée un repository type-safe pour une table
     * Exemple: const userRepo = db.repository<User>('users');
     */
    repository<T extends Record<string, unknown>>(
        tableName: string,
    ): Repository<T> {
        return new Repository<T>(this, tableName);
    }
}
