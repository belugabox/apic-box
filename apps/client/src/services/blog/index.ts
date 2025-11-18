import { Blog } from '@server/blog/blog.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { blogService } from './blog';

export const useBlogs = (fromAdmin?: boolean, deps?: React.DependencyList) =>
    usePromise(() => blogService.all(fromAdmin), [...(deps || [])]);

export const useLatestBlog = (fromAdmin?: boolean) =>
    usePromise(() => blogService.latest(fromAdmin), []);

export const useBlog = (
    blogId?: number,
    fromAdmin?: boolean,
    deps?: React.DependencyList,
) =>
    usePromise(
        () =>
            blogId ? blogService.get(blogId, fromAdmin) : Promise.resolve(null),
        [blogId, ...(deps || [])],
    );

export const useBlogAdd = () =>
    usePromiseFunc((blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>) =>
        blogService.add(blog),
    );

export const useBlogUpdate = () =>
    usePromiseFunc((blog: Omit<Blog, 'createdAt' | 'updatedAt'>) =>
        blogService.updateBlog(blog),
    );

export const useBlogDelete = () =>
    usePromiseFunc((id: number) => blogService.delete(id));
