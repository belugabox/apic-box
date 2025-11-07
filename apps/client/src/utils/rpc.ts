import { ClientResponse } from 'hono/client';

export const callRpc = async <T>(
    rpc: Promise<ClientResponse<T>>,
): Promise<T> => {
    const data = await rpc;
    if (!data.ok) {
        const res = (await data.json()) as any;
        throw res?.error || res;
    }
    const res = (await data.json()) as T;
    return res;
};
