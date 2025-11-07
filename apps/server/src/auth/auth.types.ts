export interface User {
    id: number;
    username: string;
    password: string;
    role: AuthRole;
}

export enum AuthRole {
    ADMIN = 'admin',
    USER = 'user',
}
