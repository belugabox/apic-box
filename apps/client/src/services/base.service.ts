/* eslint-disable react-hooks/rules-of-hooks */
import { ClientRequestOptions } from 'hono';
import { ClientResponse } from 'hono/client';
import { ContentfulStatusCode } from 'hono/utils/http-status';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { authService } from './auth';

export interface EntityWithDefaults {
    id: number;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceWithDefaults<T> {
    $all: (
        args?: object | undefined,
        options?: ClientRequestOptions<unknown> | undefined,
    ) => Promise<ClientResponse<T[], ContentfulStatusCode, 'json'>>;

    all: {
        $get: (
            args?: object | undefined,
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<ClientResponse<T[], ContentfulStatusCode, 'json'>>;
    };

    latest: {
        $get: (
            args?: object | undefined,
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<ClientResponse<T, ContentfulStatusCode, 'json'>>;
    };

    add: {
        $post: (
            args: {
                form: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>;
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<
            ClientResponse<
                { message: string; item: T },
                ContentfulStatusCode,
                'json'
            >
        >;
    };

    ':id': {
        $get: (
            args: {
                param: { id: string };
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<ClientResponse<T, ContentfulStatusCode, 'json'>>;
        $patch: (
            args: {
                param: { id: string };
                form: Partial<
                    Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>
                >;
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<
            ClientResponse<
                { message: string; item: T },
                ContentfulStatusCode,
                'json'
            >
        >;
        $delete: (
            args: {
                param: { id: string };
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<
            ClientResponse<{ message: string }, ContentfulStatusCode, 'json'>
        >;
    };
}

export abstract class BaseService<T extends EntityWithDefaults> {
    constructor(private api: ServiceWithDefaults<T>) {}

    // CRUD Operations
    all = async (fromAdmin?: boolean) => {
        return callRpc(
            this.api.all.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
    };

    latest = async (fromAdmin?: boolean) => {
        return await callRpc(
            this.api.latest.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
    };

    get = async (id: number, fromAdmin?: boolean) => {
        return await callRpc(
            this.api[':id'].$get(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
    };

    add = async (
        item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ): Promise<void> => {
        await callRpc(
            this.api.add.$post(
                {
                    form: item,
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    edit = async (
        id: number,
        item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>>,
    ): Promise<void> => {
        await callRpc(
            this.api[':id'].$patch(
                {
                    param: { id: id.toString() },
                    form: item,
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    delete = async (id: number): Promise<void> => {
        await callRpc(
            this.api[':id'].$delete(
                {
                    param: { id: id.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    // Hooks
    useAll = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<T[]>(() => this.all(fromAdmin), [...(deps || [])]);

    useLatest = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<T>(() => this.latest(fromAdmin), [...(deps || [])]);

    useGet = (id: number, fromAdmin?: boolean, deps?: React.DependencyList) =>
        usePromise<T>(() => this.get(id, fromAdmin), [...(deps || [])]);

    useAdd = () =>
        usePromiseFunc(
            (item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>) =>
                this.add(item),
        );

    useEdit = () =>
        usePromiseFunc(
            (
                id: number,
                item: Partial<
                    Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>
                >,
            ) => this.edit(id, item),
        );

    useDelete = () => usePromiseFunc((id: number) => this.delete(id));
}
