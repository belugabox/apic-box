import path from 'path';
import { DataSource } from 'typeorm';

import { User } from '@server/modules/auth';
import { Blog } from '@server/modules/blog';
import { Album, Gallery, Image } from '@server/modules/gallery';

import { DATA_FILE_PATH } from '../tools/env';

export { db, createDbInstance, getDb } from './singleton';
export { DbManager } from './manager';
export { Repository, MappedRepository } from './repositories';
export type { RunResult } from './types';
export { migrations } from './migrations';

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.resolve(DATA_FILE_PATH, 'db_typeorm.sqlite'),
    synchronize: true,
    logging: false,
    entities: [User, Blog, Gallery, Album, Image],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
});
