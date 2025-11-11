import { Database } from 'better-sqlite3';

import { Migration } from '../tools/migrator';

/**
 * Migrations DB versionnées
 * Chaque migration a une fonction up() et down()
 */

export const migrations: Migration[] = [
    {
        name: '001_create_user_table',
        up: (db: Database) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL
                )
            `);
        },
        down: (db: Database) => {
            db.exec('DROP TABLE IF EXISTS user');
        },
    },
    {
        name: '002_create_action_table',
        up: (db: Database) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS action (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    galleryId INTEGER,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);
        },
        down: (db: Database) => {
            db.exec('DROP TABLE IF EXISTS action');
        },
    },
    {
        name: '003_create_gallery_table',
        up: (db: Database) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS gallery (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    password TEXT,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);
        },
        down: (db: Database) => {
            db.exec('DROP TABLE IF EXISTS gallery');
        },
    },
    {
        name: '004_create_blog_table',
        up: (db: Database) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS blog (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    author TEXT NOT NULL,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);
        },
        down: (db: Database) => {
            db.exec('DROP TABLE IF EXISTS blog');
        },
    },
    {
        name: '005_add_indexes',
        up: (db: Database) => {
            db.exec(`
                CREATE INDEX IF NOT EXISTS idx_action_galleryId ON action(galleryId);
                CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);
                CREATE INDEX IF NOT EXISTS idx_gallery_name ON gallery(name);
            `);
        },
        down: (db: Database) => {
            db.exec(`
                DROP INDEX IF EXISTS idx_action_galleryId;
                DROP INDEX IF EXISTS idx_user_username;
                DROP INDEX IF EXISTS idx_gallery_name;
            `);
        },
    },
];
