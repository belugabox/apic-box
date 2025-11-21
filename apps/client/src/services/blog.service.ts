import { Blog } from '@shared';

import { BaseService } from './base.service';
import { serverApi } from './server';

class BlogService extends BaseService<Blog> {
    constructor() {
        super(serverApi.blog);
    }
}

export const blogService = new BlogService();
