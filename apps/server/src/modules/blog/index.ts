import { type } from 'arktype';
import { Column, Entity } from 'typeorm';

import { BaseModule, EntityWithDefaultColumns } from '../base.module';
import { EntityStatus } from '../shared.types';

export class BlogModule extends BaseModule<Blog> {
    constructor() {
        super('Blog', Blog, BlogAddSchema, BlogEditSchema);
    }

    init = async (): Promise<void> => {
        await super.init();

        // Add default blog post if table is empty
        await this.addIfEmpty({
            title: `Bienvenue sur le site de l'APIC Sentelette !`,
            content: `L'association des parents d'élèves de Sains-en-Amienois, Saint-Fuscien et Estrées-sur-Noye.`,
            author: 'APIC',
            status: EntityStatus.PUBLISHED,
        });
    };
}

@Entity('blogs')
export class Blog extends EntityWithDefaultColumns {
    @Column('text', { nullable: false })
    title: string = '';

    @Column('text', { nullable: false })
    content: string = '';

    @Column('text', { nullable: false })
    author: string = '';

    @Column('text', { nullable: false })
    status: EntityStatus = EntityStatus.DRAFT;
}

const BlogAddSchema = type({
    title: 'string',
    content: 'string',
    author: 'string',
    status: type.valueOf(EntityStatus),
});

const BlogEditSchema = type({
    title: 'string',
    'content?': 'string',
    'author?': 'string',
    'status?': type.valueOf(EntityStatus),
});
