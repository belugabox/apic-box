import { BaseService } from './base.service';
import { serverApi } from './server';

class BlogService extends BaseService {
    constructor() {
        super();
    }

    // Hooks
    useAll = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetHook(
            serverApi.blog.all,
            (res) => res.blogs,
            fromAdmin,
            deps,
        );

    useLatest = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetHook(
            serverApi.blog.latest,
            (res) => res.blog,
            fromAdmin,
            deps,
        );

    useGet = (id: number, fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetByIdHook(
            serverApi.blog[':id'],
            (res) => res.blog,
            id,
            fromAdmin,
            deps,
        );

    useAdd = () => this.createPostHook(serverApi.blog.add);

    useEdit = () => this.createPatchHook(serverApi.blog[':id']);

    useDelete = () => this.createDeleteHook(serverApi.blog[':id']);
}

export const blogService = new BlogService();
