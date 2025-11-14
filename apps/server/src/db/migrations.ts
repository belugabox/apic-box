import { Database } from 'better-sqlite3';

import { Migration } from '../tools/migrator';

/**
 * Migrations DB versionnées
 * Chaque migration a une fonction up() et down()
 */

export const migrations: Migration[] = [
    {
        name: '001_init',
        up: (db: Database) => {
            // user
            db.exec(`
                CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL
                )
            `);

            // gallery
            db.exec(`
                CREATE TABLE IF NOT EXISTS gallery (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT NOT NULL,
                    password TEXT,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);
            db.exec(
                `CREATE TABLE IF NOT EXISTS gallery_album (
                    id INTEGER PRIMARY KEY, 
                    galleryId INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    code TEXT NOT NULL,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL,
                    FOREIGN KEY (galleryId) REFERENCES gallery(id) ON DELETE CASCADE
                );`,
            );
            db.exec(
                `CREATE TABLE IF NOT EXISTS gallery_album_image (
                            id INTEGER PRIMARY KEY, 
                            albumId INTEGER NOT NULL,
                            filename TEXT NOT NULL,
                            code TEXT NOT NULL,
                            ratio REAL NOT NULL,
                            FOREIGN KEY (albumId) REFERENCES gallery_album(id) ON DELETE CASCADE
                        );`,
            );

            // blog
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
            db.exec('DROP TABLE IF EXISTS user');
            db.exec('DROP TABLE IF EXISTS gallery');
            db.exec('DROP TABLE IF EXISTS blog');
        },
    },
];
