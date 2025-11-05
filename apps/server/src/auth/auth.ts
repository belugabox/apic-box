import bcrypt from 'bcryptjs';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

import { logger } from '@server/tools/logger';

import { JWT_REFRESH_SECRET, JWT_SECRET } from '../config';

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
        logger.error(error, 'Error loading users:');
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
        logger.info('No users found. Creating default admin user...');
        const hashedPassword = bcrypt.hashSync('admin', 10);
        users.push({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
        });
        saveUsers(users);
        logger.info(
            'Admin user created with username: "admin" and password: "admin"',
        );
    }
};

export const findUser = (username: string): User | undefined => {
    const users = loadUsers();
    return users.find((u) => u.username === username);
};

export const authenticateUser = (
    username: string,
    password: string,
): User | null => {
    const user = findUser(username);
    if (!user) {
        return null;
    }
    if (bcrypt.compareSync(password, user.password)) {
        return user;
    }
    return null;
};

export const generateTokens = (user: User) => {
    const payload = { username: user.username, role: user.role };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });

    return {
        accessToken,
        refreshToken,
        user: { username: user.username, role: user.role },
    };
};

export const verifyRefreshToken = (token: string): User | null => {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
        return findUser(decoded.username) || null;
    } catch (error) {
        return null;
    }
};

export const authMiddleware = () => {
    return async (c: any, next: any) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            c.set('user', { username: decoded.username, role: decoded.role });
        } catch (error) {
            logger.error(error, 'Token verification failed:');
            return c.json({ message: 'Unauthorized' }, 401);
        }

        await next();
    };
};

export const adminMiddleware = () => {
    return async (c: any, next: any) => {
        const user = c.get('user');
        if (!user || user.role !== 'admin') {
            return c.json({ message: 'Forbidden' }, 403);
        }
        await next();
    };
};
