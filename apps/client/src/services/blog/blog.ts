import { Blog } from '@server/blog/blog.types';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class BlogService {
    all = async (): Promise<Blog[]> => {
        const data = await callRpc(serverApi.blog.all.$get({}));
        return data
            .map((blog) => this.transformBlog(blog))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    };

    get = async (id: number): Promise<Blog> => {
        const data = await callRpc(
            serverApi.blog[':id'].$get({
                param: { id: id.toString() },
            }),
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
            serverApi.blog.update.$post(
                {
                    form: {
                        id: blog.id.toString(),
                        title: blog.title,
                        content: blog.content,
                        author: blog.author,
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    delete = async (id: number): Promise<void> => {
        await callRpc(
            serverApi.blog.delete[':id'].$delete(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    private transformBlog = (blog: any): Blog => ({
        ...blog,
        createdAt: new Date(blog.createdAt),
        updatedAt: new Date(blog.updatedAt),
    });
}

export const blogService = new BlogService();
