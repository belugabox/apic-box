import SQLite, { Database } from 'better-sqlite3';
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

/**
 * Repository générique pour typage type-safe des requêtes
 * Utilisation :
 * interface User { id: number; name: string; }
 * const userRepo = new Repository<User>(db, 'users');
 * const user = await userRepo.findById(1);
 */
export class Repository<T extends Record<string, unknown>> {
    constructor(
        private db: DbManager,
        private tableName: string,
    ) {}

    async findById(id: unknown): Promise<T | undefined> {
        return this.db.get<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [
            id,
        ]);
    }

    async findAll(): Promise<T[]> {
        return this.db.all<T>(`SELECT * FROM ${this.tableName}`);
    }

    async findOne(
        where: Partial<Record<keyof T, unknown>>,
    ): Promise<T | undefined> {
        const keys = Object.keys(where);
        if (keys.length === 0) {
            return this.db.get<T>(`SELECT * FROM ${this.tableName} LIMIT 1`);
        }
        const values = Object.values(where);
        const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');

        return this.db.get<T>(
            `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
            values,
        );
    }

    async findMany(where: Partial<Record<keyof T, unknown>>): Promise<T[]> {
        const keys = Object.keys(where);
        if (keys.length === 0) {
            return this.db.all<T>(`SELECT * FROM ${this.tableName}`);
        }
        const values = Object.values(where);
        const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');

        return this.db.all<T>(
            `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
            values,
        );
    }

    async create(data: Omit<T, 'id'>): Promise<RunResult> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        return this.db.run(
            `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
            values,
        );
    }

    async update(
        id: unknown,
        data: Partial<Omit<T, 'id'>>,
    ): Promise<RunResult> {
        const keys = Object.keys(data);
        const values = [...Object.values(data), id];
        const setClause = keys.map((k) => `${k} = ?`).join(', ');

        return this.db.run(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
            values,
        );
    }

    async delete(id: unknown): Promise<RunResult> {
        return this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    }
}

/**
 * Repository mappé avec transformation automatique DB -> Domaine
 * Utilisation :
 * class UserRepository extends MappedRepository<UserRow, User> {
 *   protected mapToDomain(row: UserRow): User { ... }
 * }
 */
export abstract class MappedRepository<
    DBRow extends Record<string, unknown>,
    DomainModel,
> {
    protected repo: Repository<DBRow>;

    constructor(db: DbManager, tableName: string) {
        this.repo = db.repository<DBRow>(tableName);
    }

    protected abstract mapToDomain(
        row: DBRow,
    ): DomainModel | Promise<DomainModel>;

    async findAll(): Promise<DomainModel[]> {
        const rows = await this.repo.findAll();
        return Promise.all(rows.map((row) => this.mapToDomain(row)));
    }

    async findById(id: unknown): Promise<DomainModel | undefined> {
        const row = await this.repo.findById(id);
        return row ? this.mapToDomain(row) : undefined;
    }

    async findOne(
        where: Partial<Record<keyof DBRow, unknown>>,
    ): Promise<DomainModel | undefined> {
        const row = await this.repo.findOne(where);
        return row ? this.mapToDomain(row) : undefined;
    }

    async findMany(
        where: Partial<Record<keyof DBRow, unknown>>,
    ): Promise<DomainModel[]> {
        const rows = await this.repo.findMany(where);
        return Promise.all(rows.map((row) => this.mapToDomain(row)));
    }

    async create(data: Omit<DBRow, 'id'>): Promise<RunResult> {
        return this.repo.create(data);
    }

    async update(
        id: unknown,
        data: Partial<Omit<DBRow, 'id'>>,
    ): Promise<RunResult> {
        return this.repo.update(id, data);
    }

    async delete(id: unknown): Promise<RunResult> {
        return this.repo.delete(id);
    }
}

export class DbManager {
    private dbInstance: Database | undefined;

    constructor() {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }

    health = async (): Promise<void> => {
        await this.getDb();
    };

    getDb = async (): Promise<Database> => {
        if (!this.dbInstance) {
            this.dbInstance = new SQLite(DB_FILE);
        }

        return this.dbInstance;
    };

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
