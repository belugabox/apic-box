import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { EntityWithDefaultColumns } from '../base.module';
import { EntityStatus } from '../shared.types';

@Entity('blogs')
export class Blog implements EntityWithDefaultColumns {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();

    @Column('text', { nullable: false })
    title: string = '';

    @Column('text', { nullable: false })
    content: string = '';

    @Column('text', { nullable: false })
    author: string = '';

    @Column('text', { nullable: false })
    status: EntityStatus = EntityStatus.DRAFT;

    toDTO = () => {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            author: this.author,
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    };
}
