import { arktypeValidator } from '@hono/arktype-validator';
import { Type } from 'arktype';
import { Context, Hono, TypedResponse } from 'hono';
import { StatusCode } from 'hono/utils/http-status';

import { Utils } from './utils';

type Middleware = (c: Context, next: () => Promise<void>) => Promise<void>;
type ApiResponse = Record<string, unknown> & {
    isAdmin?: boolean;
};
type BodyResponse = Uint8Array | ArrayBuffer | Blob;

interface Payload<P = any, F = any> {
    param?: Type<P>;
    form?: Type<F>;
}

export class RouteBuilder<T extends Hono = Hono> {
    private hono: T;

    constructor(hono?: T) {
        this.hono = (hono || new Hono()) as T;
    }

    post = <
        P = any,
        F = any,
        R extends ApiResponse = ApiResponse,
        Path extends string = string,
    >(
        path: Path,
        middleware: Middleware | undefined,
        payload: Payload<P, F>,
        callback: (data: P & F) => Promise<R>,
    ) => {
        const newHono = this.hono.post(
            path,
            ...createMiddleware(payload, middleware),
            async (c) => {
                const result = await createCallbackData<P, F, R>(
                    c,
                    callback,
                    payload,
                );
                return result as TypedResponse<R, StatusCode, 'json'>;
            },
        );
        return new RouteBuilder(newHono);
    };

    patch = <
        P = any,
        F = any,
        R extends ApiResponse = ApiResponse,
        Path extends string = string,
    >(
        path: Path,
        middleware: Middleware | undefined,
        payload: Payload<P, F>,
        callback: (data: P & F) => Promise<R>,
    ) => {
        const newHono = this.hono.patch(
            path,
            ...createMiddleware(payload, middleware),
            async (c) => {
                const result = await createCallbackData<P, F, R>(
                    c,
                    callback,
                    payload,
                );
                return result as TypedResponse<R, StatusCode, 'json'>;
            },
        );
        return new RouteBuilder(newHono);
    };

    get = <
        P = any,
        F = any,
        R extends ApiResponse = ApiResponse,
        Path extends string = string,
    >(
        path: Path,
        middleware: Middleware | undefined,
        payload: Payload<P, F>,
        callback: (data: P & F) => Promise<R>,
    ) => {
        const newHono = this.hono.get(
            path,
            ...createMiddleware(payload, middleware),
            async (c) => {
                const result = await createCallbackData<P, F, R>(
                    c,
                    callback,
                    payload,
                );
                return result as TypedResponse<R, StatusCode, 'json'>;
            },
        );
        return new RouteBuilder(newHono);
    };

    getBody = <P = any, F = any, Path extends string = string>(
        path: Path,
        middleware: Middleware | undefined,
        payload: Payload<P, F>,
        type: 'png' | 'jpeg' | 'zip',
        callback: (data: P & F) => Promise<BodyResponse>,
    ) => {
        const newHono = this.hono.get(
            path,
            ...createMiddleware(payload, middleware),
            async (c) =>
                createCallbackDataBody<P, F>(c, callback, payload, type),
        );
        return new RouteBuilder(newHono);
    };

    delete = <
        P = any,
        F = any,
        R extends ApiResponse = ApiResponse,
        Path extends string = string,
    >(
        path: Path,
        middleware: Middleware | undefined,
        payload: Payload<P, F>,
        callback: (data: P & F) => Promise<R>,
    ) => {
        const newHono = this.hono.delete(
            path,
            ...createMiddleware(payload, middleware),
            async (c) => {
                const result = await createCallbackData<P, F, R>(
                    c,
                    callback,
                    payload,
                );
                return result as TypedResponse<R, StatusCode, 'json'>;
            },
        );
        return new RouteBuilder(newHono);
    };

    build = () => this.hono;
}

const createMiddleware = (payload: Payload, middleware?: Middleware) => {
    return [
        middleware || ((_c, next) => next()),
        payload.param
            ? arktypeValidator('param', payload.param)
            : (_c, next) => next(),
        payload.form
            ? arktypeValidator('form', payload.form)
            : (_c, next) => next(),
    ] as Middleware[];
};

const createCallbackData = async <
    P = any,
    F = any,
    R extends ApiResponse = ApiResponse,
>(
    c: Context,
    callback: (data: P & F) => Promise<R>,
    payload: Payload<P, F>,
) => {
    const paramData = payload.param
        ? ((c.req as any).valid('param') as P)
        : ({} as P);
    const formData = payload.form
        ? ((c.req as any).valid('form') as F)
        : ({} as F);
    const result = await callback({
        ...(paramData as P),
        ...(formData as F),
        isAdmin: (await Utils.authIsAdmin(c)) as boolean,
    });
    return c.json(result);
};

const createCallbackDataBody = async <P = any, F = any>(
    c: Context,
    callback: (data: P & F) => Promise<BodyResponse>,
    payload: Payload<P, F>,
    type: 'png' | 'jpeg' | 'zip',
) => {
    const paramData = payload.param
        ? ((c.req as any).valid('param') as P)
        : ({} as P);
    const formData = payload.form
        ? ((c.req as any).valid('form') as F)
        : ({} as F);
    const result = await callback({
        ...(paramData as P),
        ...(formData as F),
        isAdmin: (await Utils.authIsAdmin(c)) as boolean,
    });
    if (type === 'png') {
        c.header('Content-Type', 'image/png');
    } else if (type === 'jpeg') {
        c.header('Content-Type', 'image/jpeg');
    } else if (type === 'zip') {
        c.header('Content-Disposition', `attachment; filename="gallery.zip"`);
        c.header('Content-Type', 'application/zip');
    }
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(result as any);
};
