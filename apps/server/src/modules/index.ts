import { Hono } from 'hono';

import { ModuleRepository } from './module-repository';

export { RouteBuilder } from './route-builder';
export { ModuleRepository } from './module-repository';

export interface Module {
    name: string;
    init: () => Promise<void>;
    health: () => Promise<void>;
    routes: () => Hono;
    repo: () => ModuleRepository<any>;
}
