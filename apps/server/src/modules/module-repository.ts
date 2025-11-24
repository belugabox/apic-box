import {
    DeepPartial,
    FindOptionsOrder,
    FindOptionsWhere,
    ObjectLiteral,
    Repository,
} from 'typeorm';

export class ModuleRepository<
    T extends ObjectLiteral & { id: number; createdAt: Date; updatedAt: Date },
> extends Repository<T> {
    constructor(repo: Repository<T>) {
        super(repo.target, repo.manager, repo.queryRunner);
    }

    health = async (): Promise<void> => {
        await this.count();
    };

    all = async (
        where?: FindOptionsWhere<T>,
        order?: FindOptionsOrder<T>,
    ): Promise<T[]> => {
        return this.find({
            where,
            order: order
                ? order
                : ({
                      createdAt: 'DESC' as const,
                  } as FindOptionsOrder<T>),
        });
    };

    get = async (
        id: number,
        where?: FindOptionsWhere<T>,
    ): Promise<T | null> => {
        const item = await this.findOneBy({
            id,
            ...where,
        } as FindOptionsWhere<T>);
        return item;
    };

    latest = async (where?: FindOptionsWhere<T>): Promise<T | null> => {
        const item = await this.findOne({
            where,
            order: {
                createdAt: 'DESC' as const,
            } as FindOptionsOrder<T>,
        });
        return item;
    };

    add = async (
        item: Omit<Partial<T>, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ): Promise<T> => {
        const newItem = this.create({
            ...item,
            id: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.save(newItem);
        return savedItem;
    };

    addIfEmpty = async (
        item: Omit<Partial<T>, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ): Promise<T | null> => {
        if ((await this.count()) > 0) return null;
        return this.add(item);
    };

    edit = async (
        id: number,
        item: Omit<Partial<T>, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ): Promise<T | null> => {
        const existing = await this.findOneBy({
            id,
        } as FindOptionsWhere<T>);
        if (!existing) {
            return null;
        }
        const updatedItem = this.merge(existing, {
            ...item,
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.save(updatedItem);
        return savedItem;
    };

    deleteById = async (id: number): Promise<boolean> => {
        const result = await this.delete(id);
        return !!result.affected && result.affected > 0;
    };
}
