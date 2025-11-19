import path from 'path';
import { DataSource } from 'typeorm';

import { Blog } from '@server/modules/module';
import { logger } from '@server/tools/logger';

import { DATA_FILE_PATH } from '../tools/env';

/**
 * Module DB - Exports centralisés
 * Utilisation : import { AppDataSource } from '@server/db'
 */

export { db, createDbInstance, getDb } from './singleton';
export { DbManager } from './manager';
export { Repository, MappedRepository } from './repositories';
export type { RunResult } from './types';
export { migrations } from './migrations';

logger.info('Initializing TypeORM DB connection... ' + DATA_FILE_PATH);

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.resolve(DATA_FILE_PATH, 'db_typeorm.sqlite'),
    synchronize: true,
    logging: false,
    entities: [Blog],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
});
