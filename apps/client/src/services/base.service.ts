import { ClientRequestOptions } from 'hono';
import { ClientResponse } from 'hono/client';
import { ContentfulStatusCode } from 'hono/utils/http-status';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { authService } from './auth';

export interface EntityWithDefaults {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

type ApiFormat<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
};

export interface ServiceWithDefaults<T, R> {
    $all: (
        args?: {} | undefined,
        options?: ClientRequestOptions<unknown> | undefined,
    ) => Promise<ClientResponse<R[], ContentfulStatusCode, 'json'>>;

    all: {
        $get: (
            args?: {} | undefined,
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<ClientResponse<R[], ContentfulStatusCode, 'json'>>;
    };

    latest: {
        $get: (
            args?: {} | undefined,
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<ClientResponse<R, ContentfulStatusCode, 'json'>>;
    };

    add: {
        $post: (
            args: {
                form: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<
            ClientResponse<
                { message: string; item: R },
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
        ) => Promise<ClientResponse<R, ContentfulStatusCode, 'json'>>;
        $patch: (
            args: {
                param: { id: string };
                form: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
            },
            options?: ClientRequestOptions<unknown> | undefined,
        ) => Promise<
            ClientResponse<
                { message: string; item: R },
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

const transformDates = (
    item: any & {
        createdAt: string;
        updatedAt: string;
    },
) => {
    return {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
    } as typeof item & {
        createdAt: Date;
        updatedAt: Date;
    };
};

export abstract class BaseService<
    T extends EntityWithDefaults,
    R = ApiFormat<T>,
> {
    constructor(private api: ServiceWithDefaults<T, R>) {}

    // CRUD Operations
    all = async (fromAdmin?: boolean) => {
        return callRpc(
            this.api.all.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        ).then((all) => all.map((data) => transformDates(data)));
    };

    latest = async (fromAdmin?: boolean) => {
        return await callRpc(
            this.api.latest.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        ).then((data) => transformDates(data));
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
        ).then((data) => transformDates(data));
    };

    add = async (
        item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
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
        item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
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
        usePromiseFunc((item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) =>
            this.add(item),
        );

    useEdit = () =>
        usePromiseFunc(
            (
                id: number,
                item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
            ) => this.edit(id, item),
        );

    useDelete = () => usePromiseFunc((id: number) => this.delete(id));
}
