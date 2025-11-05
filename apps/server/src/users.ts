import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface User {
    username: string;
    password: string;
    role: 'admin' | 'user';
}

const USERS_FILE = path.resolve(
    process.env.CONFIG_FILE_PATH ?? './config',
    'users.json',
);

// Ensure config directory and file exist
const ensureUsersFile = () => {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
};

export const loadUsers = (): User[] => {
    ensureUsersFile();
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
};

export const saveUsers = (users: User[]) => {
    ensureUsersFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

export const createAdminIfNoneExists = () => {
    const users = loadUsers();
    if (users.length === 0) {
        console.log('No users found. Creating default admin user...');
        const hashedPassword = bcrypt.hashSync('admin', 10);
        users.push({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
        });
        saveUsers(users);
        console.log(
            'Admin user created with username: "admin" and password: "admin"',
        );
    }
};

export const findUser = (username: string): User | undefined => {
    const users = loadUsers();
    return users.find((u) => u.username === username);
};

export const createUser = (
    username: string,
    password: string,
    role: 'admin' | 'user' = 'user',
): User => {
    const users = loadUsers();
    const existing = users.find((u) => u.username === username);
    if (existing) {
        throw new Error('User already exists');
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user: User = { username, password: hashedPassword, role };
    users.push(user);
    saveUsers(users);
    return user;
};

export const verifyPassword = (
    storedHash: string,
    password: string,
): boolean => {
    return bcrypt.compareSync(password, storedHash);
};

export const updateUserPassword = (
    username: string,
    newPassword: string,
): void => {
    const users = loadUsers();
    const user = users.find((u) => u.username === username);
    if (!user) {
        throw new Error('User not found');
    }
    user.password = bcrypt.hashSync(newPassword, 10);
    saveUsers(users);
};
