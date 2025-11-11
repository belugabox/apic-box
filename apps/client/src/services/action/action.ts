import { Action } from '@server/action/action.types';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class ActionService {
    all = async (): Promise<Action[]> => {
        const response = (await callRpc(serverApi.actions.all.$get())) as
            | any[]
            | { data: any[] };
        // Gère la réponse paginée
        const data = Array.isArray(response) ? response : response.data || [];
        return data.map((action: any) => this.transformAction(action));
    };
    add = async (action: Action): Promise<string> => {
        return await callRpc(
            serverApi.actions.add.$post(
                {
                    form: this.serializeAction(action),
                },
                {
                    headers: authService.headers(),
                },
            ),
        ).then(({ message }) => {
            return message;
        });
    };
    update = async (action: Action): Promise<string> => {
        return await callRpc(
            serverApi.actions.update.$post(
                {
                    form: this.serializeAction(action),
                },
                {
                    headers: authService.headers(),
                },
            ),
        ).then(({ message }) => {
            return message;
        });
    };
    delete = async (id: number): Promise<string> => {
        return await callRpc(
            serverApi.actions.delete[':id'].$delete(
                { param: { id: String(id) } },
                {
                    headers: authService.headers(),
                },
            ),
        ).then(({ message }) => {
            return message;
        });
    };

    private serializeAction = (action: Action) => {
        return {
            id: String(action.id),
            name: action.name,
            description: action.description,
            type: action.type,
            status: action.status,
            createdAt: action.createdAt.toISOString(),
            updatedAt: action.updatedAt.toISOString(),
        };
    };

    private transformAction = (action: any): Action => ({
        ...action,
        createdAt: new Date(action.createdAt),
        updatedAt: new Date(action.updatedAt),
    });
}

export const actionService = new ActionService();
