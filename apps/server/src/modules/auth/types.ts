import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { EntityWithDefaultColumns } from '../base.module';

@Entity('users')
export class User implements EntityWithDefaultColumns {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();

    @Column('text', { nullable: false })
    username: string = '';

    @Column('text', { nullable: false })
    password: string = '';

    @Column('text', { nullable: false })
    role: UserRole = UserRole.USER;

    toDTO = () => {
        return {
            id: this.id,
            username: this.username,
            role: this.role,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    };
}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}
