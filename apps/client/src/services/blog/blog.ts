import type { Blog } from '@server/modules/blog';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class Service {
    constructor() {}
}

export class BlogService {
    all = async (fromAdmin?: boolean): Promise<Blog[]> => {
        const data = await callRpc(
            serverApi.blog.$all(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return data
            .map((blog) => this.transformBlog(blog))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    };

    latest = async (fromAdmin?: boolean): Promise<Blog | null> => {
        const data = await callRpc(
            serverApi.blog.latest.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return this.transformBlog(data);
    };

    get = async (id: number, fromAdmin?: boolean): Promise<Blog> => {
        const data = await callRpc(
            serverApi.blog[':id'].$get(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return this.transformBlog(data);
    };

    add = async (
        blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<void> => {
        await callRpc(
            serverApi.blog.add.$post(
                {
                    form: blog,
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    updateBlog = async (
        blog: Omit<Blog, 'createdAt' | 'updatedAt'>,
    ): Promise<void> => {
        await callRpc(
            serverApi.blog[':id'].$patch(
                {
                    param: { id: blog.id.toString() },
                    form: {
                        title: blog.title,
                        content: blog.content,
                        author: blog.author,
                        status: blog.status,
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };
    edit = this.updateBlog;

    delete = async (id: number): Promise<void> => {
        await callRpc(
            serverApi.blog[':id'].$delete(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformBlog = (blog: any): Blog => ({
        ...blog,
        createdAt: new Date(blog.createdAt),
        updatedAt: new Date(blog.updatedAt),
    });
}

export const blogService = new BlogService();
