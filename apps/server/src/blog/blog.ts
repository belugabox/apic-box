import { db } from '@server/db';
import { MappedRepository } from '@server/db';
import { logger } from '@server/tools/logger';

import { Blog } from './blog.types';

type BlogRow = Omit<Blog, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export class BlogManager extends MappedRepository<BlogRow, Blog> {
    constructor() {
        super(db, 'blog');
    }

    protected async initializeSchema(): Promise<void> {
        await db.run(`
            CREATE TABLE IF NOT EXISTS blog (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL, 
                content TEXT NOT NULL,
                author TEXT NOT NULL,
                createdAt datetime NOT NULL,
                updatedAt datetime NOT NULL
            );`);
    }

    protected async mapToDomain(row: BlogRow): Promise<Blog> {
        return {
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }

    init = async () => {};

    health = async () => {
        const result = await this.findOne({});
        return result ? 'healthy' : 'healthy';
    };

    all = async (): Promise<Blog[]> => {
        return this.findAll();
    };

    get = async (id: string): Promise<Blog | undefined> => {
        const blog = await this.findById(id);
        return blog;
    };

    add = async (
        blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<void> => {
        logger.info(`Creating blog post: ${blog.title} by ${blog.author}`);
        await this.repo.create({
            title: blog.title,
            content: blog.content,
            author: blog.author,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as any);
        logger.info(`Blog post created: ${blog.title}`);
    };

    updateBlog = async (
        blog: Omit<Blog, 'createdAt' | 'updatedAt'>,
    ): Promise<void> => {
        logger.info(`Updating blog post: ${blog.title}`);
        await this.repo.update(blog.id, {
            title: blog.title,
            content: blog.content,
            author: blog.author,
            updatedAt: new Date().toISOString(),
        });
        logger.info(`Blog post updated: ${blog.title}`);
    };

    deleteBlog = async (id: string): Promise<void> => {
        logger.info(`Deleting blog post with ID: ${id}`);
        await this.repo.delete(id);
        logger.info(`Blog post deleted: ${id}`);
    };
}
