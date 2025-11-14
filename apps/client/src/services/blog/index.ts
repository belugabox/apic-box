import { Blog } from '@server/blog/blog.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { blogService } from './blog';

export const useBlogs = (deps?: React.DependencyList) =>
    usePromise(() => blogService.all(), [...(deps || [])]);

export const useBlog = (blogId?: number, deps?: React.DependencyList) =>
    usePromise(
        () => (blogId ? blogService.get(blogId) : Promise.resolve(null)),
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
