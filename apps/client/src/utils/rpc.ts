import { ClientResponse } from 'hono/client';

// Classe d'erreur personnalisée pour les appels RPC
export class RpcError extends Error {
    constructor(
        public status: number,
        public name: string,
        public message: string,
        public details?: unknown,
    ) {
        super(message || `RPC Error: ${status}`);
        this.name = name;
        this.message = message || `RPC Error: ${status}`;
        this.details = details;
        Object.setPrototypeOf(this, RpcError.prototype);
    }
}

// Types utiles
const BINARY_CONTENT_TYPES = [
    'image',
    'application/pdf',
    'application/octet-stream',
];

const isBinaryResponse = (contentType: string | null): boolean =>
    contentType
        ? BINARY_CONTENT_TYPES.some((type) => contentType.includes(type))
        : false;

export const callRpc = async <T>(
    rpc: Promise<ClientResponse<T>>,
): Promise<T> => {
    const response = await rpc;

    if (!response.ok) {
        try {
            const error = (await response.json()) as {
                name: string;
                message: string;
            };
            throw new RpcError(
                response.status,
                error.name,
                error.message,
                error,
            );
        } catch (err) {
            if (err instanceof RpcError) throw err;
            throw new RpcError(
                response.status,
                'Unknown error',
                'An unknown error occurred',
                err,
            );
        }
    }

    // Déterminer le type de réponse
    const contentType = response.headers.get('Content-Type');
    if (isBinaryResponse(contentType)) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer) as T;
    }

    // Parser comme du JSON
    return (await response.json()) as T;
};
