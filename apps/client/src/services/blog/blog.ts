import type { Blog } from '@shared';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class Service {
    constructor() {}
}

export class BlogService {
    all = async (fromAdmin?: boolean): Promise<Blog[]> => {
        const response = await callRpc(
            serverApi.blog.all.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        const data = response.blogs;
        return data
            .map((blog) => this.transformBlog(blog))
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
    };

    latest = async (fromAdmin?: boolean): Promise<Blog | null> => {
        const response = await callRpc(
            serverApi.blog.latest.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return this.transformBlog(response.blog);
    };

    get = async (id: number, fromAdmin?: boolean): Promise<Blog> => {
        const response = await callRpc(
            serverApi.blog[':id'].$get(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return this.transformBlog(response.blog);
    };

    add = async (
        blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
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

    // Hooks
    useAll = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<Blog[]>(() => this.all(fromAdmin), [...(deps || [])]);

    useLatest = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<Blog | null>(
            () => this.latest(fromAdmin),
            [...(deps || [])],
        );

    useGet = (id: number, fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<Blog>(() => this.get(id, fromAdmin), [...(deps || [])]);

    useAdd = () =>
        usePromiseFunc(
            (item: Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>) =>
                this.add(item),
        );

    useEdit = () =>
        usePromiseFunc(
            (
                id: number,
                item: Partial<
                    Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>
                >,
            ) => this.edit({ ...item, id } as Blog),
        );

    useDelete = () => usePromiseFunc((id: number) => this.delete(id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformBlog = (blog: any): Blog => ({
        ...blog,
        createdAt: new Date(blog.createdAt),
        updatedAt: new Date(blog.updatedAt),
    });
}

export const blogService = new BlogService();
