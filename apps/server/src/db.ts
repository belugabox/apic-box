import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'db.sqlite',
);

export interface RunResult {
    changes: number;
    lastID?: number;
}

export class DbManager {
    private dbInstance: Database.Database | undefined;
    constructor() {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }

    health = async () => {
        return this.getDb().then(() => {
            return;
        });
    };

    getDb = async (): Promise<any> => {
        if (!this.dbInstance) {
            this.dbInstance = new Database(DB_FILE);
        }

        return this.dbInstance;
    };

    run = async (
        sql: string,
        params?: any[],
        callback?: Function,
    ): Promise<RunResult> => {
        try {
            const database = await this.getDb();
            const stmt = database.prepare(sql);
            const info = stmt.run(...(params || []));

            const result: RunResult = {
                changes: info.changes,
                ...(info.lastInsertRowid !== undefined && {
                    lastID: Number(info.lastInsertRowid),
                }),
            };
            if (callback) callback(null, result);
            return Promise.resolve(result);
        } catch (err) {
            if (callback) callback(err);
            return Promise.reject(err);
        }
    };

    get = async <T = any>(
        sql: string,
        params?: any[],
        callback?: Function,
    ): Promise<T> => {
        try {
            const database = await this.getDb();
            const stmt = database.prepare(sql);
            const result = stmt.get(...(params || [])) as T;
            if (callback) callback(null, result);
            return Promise.resolve(result);
        } catch (err) {
            if (callback) callback(err);
            return Promise.reject(err);
        }
    };

    all = async <T = any>(
        sql: string,
        params?: any[],
        callback?: Function,
    ): Promise<T[]> => {
        try {
            const database = await this.getDb();
            const stmt = database.prepare(sql);
            const results = stmt.all(...(params || [])) as T[];
            if (callback) callback(null, results);
            return Promise.resolve(results);
        } catch (err) {
            if (callback) callback(err);
            return Promise.reject(err);
        }
    };
}
