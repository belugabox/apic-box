/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { ClientResponse } from 'hono/client';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { authService } from './auth.service';

export interface EntityWithDefaults {
    id: number;
    createdAt: string;
    updatedAt: string;
}

export abstract class BaseService {
    constructor() {}

    // Utilitaires
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getHeaders = (fromAdmin?: boolean, _id?: number) => ({
        headers: fromAdmin ? authService.headers() : {},
    });

    protected normalizeDeps = (deps?: React.DependencyList) => [
        ...(deps || []),
    ];

    protected idParam = (id: number) => ({ id: id.toString() });

    /**
     * Crée un hook générique pour les opérations GET (liste)
     * Utilisation : this.createAllHook(serverApi.blog.all.$get)
     */
    protected createGetHook<ResponseType, ReturnType = ResponseType>(
        endpoint: {
            $get: (
                params: any,
                headers: any,
            ) => Promise<ClientResponse<ResponseType>>;
        },
        wrapper: (data: ResponseType) => ReturnType,
        fromAdmin?: boolean,
        deps?: React.DependencyList,
    ) {
        return usePromise(async () => {
            const response = await callRpc<ResponseType>(
                endpoint.$get({}, this.getHeaders(fromAdmin)),
            );
            return wrapper(response);
        }, this.normalizeDeps(deps));
    }

    /**
     * Crée un hook générique pour les opérations GET (par ID)
     * Utilisation : this.createGetHook(serverApi.blog[':id'].$get)
     */
    protected createGetByIdHook<ResponseType, ReturnType = ResponseType>(
        endpoint: {
            $get: (
                params: { param: { id: string } },
                headers: any,
            ) => Promise<ClientResponse<ResponseType>>;
        },
        wrapper: (data: ResponseType) => ReturnType,
        id: number,
        fromAdmin?: boolean,
        deps?: React.DependencyList,
    ) {
        return usePromise(async () => {
            const response = await callRpc<ResponseType>(
                endpoint.$get(
                    { param: this.idParam(id) },
                    this.getHeaders(fromAdmin, id),
                ),
            );
            return wrapper(response);
        }, this.normalizeDeps(deps));
    }

    /**
     * Crée un hook générique pour les opérations POST (création)
     * Utilisation : this.createPostHook(serverApi.blog.add)
     */
    protected createPostHook<
        E extends { $post: (...args: any) => any },
        FormType = ExtractFormType<E['$post']>,
    >(endpoint: E) {
        return usePromiseFunc(async (form: FormType) => {
            await callRpc(endpoint.$post({ form }, this.getHeaders(true)));
        });
    }
    protected createPostHookWithId<
        E extends { $post: (...args: any) => any },
        FormType = ExtractFormType<E['$post']>,
    >(endpoint: E, id: number) {
        return usePromiseFunc(async (form: FormType) => {
            await callRpc(
                endpoint.$post(
                    { param: this.idParam(id), form },
                    this.getHeaders(true),
                ),
            );
        });
    }

    /**
     * Crée un hook générique pour les opérations PATCH (modification)
     * Utilisation : this.createPatchHook(serverApi.blog[':id'])
     */
    protected createPatchHook<
        E extends { $patch: (...args: any) => any },
        FormType = ExtractPatchFormType<E['$patch']>,
    >(endpoint: E) {
        return usePromiseFunc(async (id: number, form: FormType) => {
            await callRpc(
                endpoint.$patch(
                    {
                        param: this.idParam(id),
                        form,
                    },
                    this.getHeaders(true),
                ),
            );
        });
    }
    protected createPatchHookWithId<
        E extends { $patch: (...args: any) => any },
        FormType = ExtractPatchFormType<E['$patch']>,
    >(endpoint: E, id: number) {
        return usePromiseFunc(async (form: FormType) => {
            await callRpc(
                endpoint.$patch(
                    {
                        param: this.idParam(id),
                        form,
                    },
                    this.getHeaders(true),
                ),
            );
        });
    }

    /**
     * Crée un hook générique pour les opérations DELETE
     * Utilisation : this.createDeleteHook(serverApi.blog[':id'])
     */
    protected createDeleteHook<E extends { $delete: (...args: any) => any }>(
        endpoint: E,
    ) {
        return usePromiseFunc(async (id: number): Promise<void> => {
            await callRpc(
                endpoint.$delete(
                    { param: this.idParam(id) },
                    this.getHeaders(true),
                ),
            );
        });
    }
}

/**
 * Extrait le type du form d'une fonction POST/PUT
 * @example type BlogForm = ExtractFormType<typeof serverApi.blog.add.$post>;
 */
type ExtractFormType<T extends (...args: any) => any> =
    Parameters<T>[0]['form'];

/**
 * Extrait le type du form d'une fonction PATCH
 * @example type BlogEditForm = ExtractPatchFormType<typeof serverApi.blog[':id'].$patch>;
 */
type ExtractPatchFormType<T extends (...args: any) => any> =
    Parameters<T>[0]['form'];
