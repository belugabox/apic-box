import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

const DB_FILE = path.resolve(
    process.env.DB_FILE_PATH ?? './config',
    'data.sqlite',
);

export interface RunResult {
    changes: number;
    lastID?: number;
}

export class DbManager {
    private dbInstance: Database | undefined;
    constructor() {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }

    health = async () => {
        return this.getDb().then(() => {
            return;
        });
    };

    getDb = async () => {
        if (!this.dbInstance) {
            const SQL = await initSqlJs();

            // Si le fichier existe, charger la base de données
            if (fs.existsSync(DB_FILE)) {
                const data = fs.readFileSync(DB_FILE);
                this.dbInstance = new SQL.Database(data);
            } else {
                this.dbInstance = new SQL.Database();
            }
        }

        return this.dbInstance;
    };

    saveDb = () => {
        if (this.dbInstance) {
            const data = this.dbInstance.export();
            fs.writeFileSync(DB_FILE, data);
        }
    };

    run = async (
        sql: string,
        params?: any[],
        callback?: Function,
    ): Promise<RunResult> => {
        try {
            const database = await this.getDb();
            const stmt = database.prepare(sql);
            if (params) stmt.bind(params);
            stmt.step();
            const changes = database.getRowsModified();
            stmt.free();

            // Récupérer le lastID pour les INSERT
            let lastID: number | undefined;
            if (sql.trim().toUpperCase().startsWith('INSERT')) {
                const lastIdStmt = database.prepare(
                    'SELECT last_insert_rowid() as id',
                );
                if (lastIdStmt.step()) {
                    const row = lastIdStmt.getAsObject();
                    lastID = row.id as number;
                }
                lastIdStmt.free();
            }

            this.saveDb();
            const result: RunResult = {
                changes,
                ...(lastID !== undefined && { lastID }),
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
            if (params) stmt.bind(params);
            stmt.step();
            const result = stmt.getAsObject();
            stmt.free();
            if (callback) callback(null, result);
            return Promise.resolve(result as T);
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
            if (params) stmt.bind(params);
            const results: T[] = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject() as T);
            }
            stmt.free();
            if (callback) callback(null, results);
            return Promise.resolve(results);
        } catch (err) {
            if (callback) callback(err);
            return Promise.reject(err);
        }
    };
}
