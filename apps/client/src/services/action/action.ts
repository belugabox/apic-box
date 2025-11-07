import { Action } from '@server/action/action.types';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class ActionService {
    all = async (): Promise<Action[]> => {
        const data = await callRpc(serverApi.actions.all.$get());
        return data.map((action) => ({
            ...action,
            createdAt: new Date(action.createdAt),
            updatedAt: new Date(action.updatedAt),
        }));
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
            title: action.title,
            description: action.description,
            type: action.type,
            status: action.status,
            createdAt: action.createdAt.toISOString(),
            updatedAt: action.updatedAt.toISOString(),
        };
    };
}

export const actionService = new ActionService();
