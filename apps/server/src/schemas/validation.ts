/**
 * Zod Schemas pour validation centralisée
 * Utilisé dans les managers pour valider les inputs
 */
import z from 'zod';

import { ActionStatus, ActionType } from '../action/action.types';
import { AuthRole } from '../auth/auth.types';

// ===== Action Schemas =====
export const createActionSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    type: z.enum(ActionType),
    status: z.enum(ActionStatus),
});

export const updateActionSchema = createActionSchema.extend({
    id: z.number().positive(),
});

// ===== Auth Schemas =====
export const loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = loginSchema.extend({
    role: z.enum(AuthRole),
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    newPasswordConfirm: z.string().min(6),
});

// ===== Gallery Schemas =====
export const createGallerySchema = z.object({
    name: z.string().min(1, 'Gallery name is required').max(255),
});

export const createAlbumSchema = z.object({
    galleryId: z.number().positive(),
    name: z.string().min(1, 'Album name is required').max(255),
});

// ===== Blog Schemas =====
export const createBlogSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().min(1, 'Content is required').max(10000),
    author: z.string().min(1, 'Author is required').max(255),
});

export const updateBlogSchema = createBlogSchema.extend({
    id: z.string(),
});

// Type exports for TypeScript
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
