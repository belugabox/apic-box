import { Action } from '@server/action/action.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { actionService } from './action';

export const useActions = (deps?: React.DependencyList) =>
    usePromise(actionService.all, deps);

export const useActionAdd = () =>
    usePromiseFunc(async (action: Action) => {
        await actionService.add(action);
    });
export const useActionUpdate = () =>
    usePromiseFunc(async (action: Action) => {
        await actionService.update(action);
    });
export const useActionDelete = () =>
    usePromiseFunc(async (action: Action) => {
        await actionService.delete(action.id);
    });
