/**
 * Module DB - Exports centralisés
 * Utilisation : import { db, DbManager, Repository } from '@server/db'
 */

export { db, createDbInstance, getDb } from './singleton';
export { DbManager } from './manager';
export { Repository, MappedRepository } from './repositories';
export type { RunResult } from './types';
export { migrations } from './migrations';
