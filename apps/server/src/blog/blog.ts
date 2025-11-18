import { db } from '@server/db';
import { MappedRepository } from '@server/db';
import { GalleryStatus } from '@server/gallery/gallery.types';
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

    protected async initializeSchema(): Promise<void> {}

    protected async mapToDomain(row: BlogRow): Promise<Blog> {
        return {
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }

    init = async () => {
        const emptyTable = await db.get<{ count: number }>(
            'SELECT COUNT(*) as count FROM blog',
        );
        if (emptyTable && emptyTable.count <= 0) {
            await this.add({
                title: `Bienvenue sur le site de l'APIC Sentelette !`,
                content: `L'association des parents d'élèves de Sains-en-Amienois, Saint-Fuscien et Estrées-sur-Noye.`,
                author: 'APIC',
                status: GalleryStatus.PUBLISHED,
            });
            logger.info(`Default admin user created with username: "admin"`);
        }
    };

    health = async () => {
        const result = await this.findOne({});
        return result ? 'healthy' : 'healthy';
    };

    all = async (isAdmin: boolean): Promise<Blog[]> => {
        return (await this.findAll()).filter((blog) => {
            return isAdmin || blog.status === 'published';
        });
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
            status: blog.status,
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
            status: blog.status,
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
