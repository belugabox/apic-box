import path from 'path';
import { DataSource } from 'typeorm';

import { User } from '../modules/auth/types';
import { Blog } from '../modules/blog/types';
import { Album, Gallery, Image } from '../modules/gallery/types';
import { DATA_FILE_PATH } from '../tools/env';

export const db = new DataSource({
    type: 'better-sqlite3',
    database: path.resolve(DATA_FILE_PATH, 'db_typeorm.sqlite'),
    synchronize: true,
    logging: false,
    entities: [User, Blog, Gallery, Album, Image],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
});
