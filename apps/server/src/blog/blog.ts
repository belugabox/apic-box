import { db } from '@server/core';

import { Blog } from './blog.types';

export class BlogManager {
    constructor() {}

    init = async () => {
        await db.run(
            `CREATE TABLE IF NOT EXISTS blogs (
                id TEXT PRIMARY KEY, 
                title TEXT NOT NULL, 
                content TEXT NOT NULL,
                author TEXT NOT NULL,
                createdAt datetime NOT NULL,
                updatedAt datetime NOT NULL
            );`,
        );
    };

    health = async () => {
        return await db.run('SELECT id FROM blogs LIMIT 1').then(() => {
            return;
        });
    };

    all = async (): Promise<Blog[]> => {
        const blogs = await db.all<Blog>(
            'SELECT id, title, content, author, createdAt, updatedAt FROM blogs',
        );
        return blogs;
    };

    get = async (id: string): Promise<Blog | null> => {
        const blog = await db.get<Blog>(
            'SELECT id, title, content, author, createdAt, updatedAt FROM blogs WHERE id = ?',
            [id],
        );
        return blog || null;
    };

    add = async (blog: {
        id: string;
        title: string;
        content: string;
        author: string;
    }): Promise<void> => {
        await db.run(
            'INSERT INTO blogs (id, title, content, author, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [
                blog.id,
                blog.title,
                blog.content,
                blog.author,
                new Date().toISOString(),
                new Date().toISOString(),
            ],
        );
    };

    update = async (blog: Blog): Promise<void> => {
        await db.run(
            'UPDATE blogs SET title = ?, content = ?, author = ?, updatedAt = ? WHERE id = ?',
            [
                blog.title,
                blog.content,
                blog.author,
                new Date().toISOString(),
                blog.id,
            ],
        );
    };

    delete = async (id: string): Promise<void> => {
        await db.run('DELETE FROM blogs WHERE id = ?', [id]);
    };
}
