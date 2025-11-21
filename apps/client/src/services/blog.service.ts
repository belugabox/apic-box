import type { Blog } from '@server/modules/blog';

import { BaseService } from './base.service';
import { serverApi } from './server';

class BlogService extends BaseService<Blog> {
    constructor() {
        super(serverApi.blog);
    }
}

export const blogService = new BlogService();
