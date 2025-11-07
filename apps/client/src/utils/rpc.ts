import { ClientResponse } from 'hono/client';

export const callRpc = async <T>(
    rpc: Promise<ClientResponse<T>>,
): Promise<T> => {
    const data = await rpc;

    if (!data.ok) {
        const res = (await data.json()) as any;
        throw res?.error || res;
    }

    // Vérifier si c'est une réponse binaire (image)
    const contentType = data.headers.get('Content-Type');
    if (contentType?.includes('image')) {
        const arrayBuffer = await data.arrayBuffer();
        return new Uint8Array(arrayBuffer) as T;
    }

    // Sinon, parser comme du JSON
    const res = (await data.json()) as T;
    return res;
};
