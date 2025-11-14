import { Database } from 'better-sqlite3';

import { logger } from './logger';

export interface Migration {
    name: string;
    up: (db: Database) => void;
    down: (db: Database) => void;
}

export class Migrator {
    private migrations: Map<string, Migration> = new Map();

    constructor(db: Database) {
        this.createMigrationsTable(db);
    }

    private createMigrationsTable(db: Database) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    register(migration: Migration) {
        this.migrations.set(migration.name, migration);
    }

    registerAll(migrations: Migration[]) {
        migrations.forEach((m) => this.register(m));
    }

    async runMigrations(db: Database) {
        const applied = db.prepare('SELECT name FROM migrations').all() as {
            name: string;
        }[];
        const appliedNames = new Set(applied.map((m) => m.name));

        for (const [name, migration] of this.migrations) {
            if (!appliedNames.has(name)) {
                logger.info(`Running migration: ${name}`);
                try {
                    migration.up(db);
                    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(
                        name,
                    );
                    logger.info(`Migration applied: ${name}`);
                } catch (err) {
                    logger.error(err, `Migration failed: ${name}`);
                    throw err;
                }
            }
        }
    }

    async rollback(db: Database, steps: number = 1) {
        const applied = db
            .prepare('SELECT * FROM migrations ORDER BY id DESC LIMIT ?')
            .all(steps) as { id: number; name: string }[];

        for (const { id, name } of applied) {
            const migration = this.migrations.get(name);
            if (migration) {
                logger.info(`Rolling back: ${name}`);
                try {
                    migration.down(db);
                    db.prepare('DELETE FROM migrations WHERE id = ?').run(id);
                    logger.info(`✓ Rolled back: ${name}`);
                } catch (err) {
                    logger.error(err, `Rollback failed: ${name}`);
                    throw err;
                }
            }
        }
    }
}
