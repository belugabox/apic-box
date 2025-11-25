import { useEffect, useState } from 'react';
import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';

import { Wrapper } from './wrapperObs';

export function usePromise<T>(
    promise: (signal?: AbortSignal) => Promise<T>,
    deps: React.DependencyList = [],
): [T | undefined, boolean, Error | undefined] {
    const [state, setState] = useState<T>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        const abortController = new AbortController();
        setLoading(true);
        setError(undefined);

        promise(abortController.signal)
            .then((value) => {
                if (!abortController.signal.aborted) {
                    setState(value);
                    setLoading(false);
                }
            })
            .catch((err) => {
                // Ignorer les erreurs d'annulation (normales lors d'un cleanup)
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                if (!abortController.signal.aborted) {
                    setError(err);
                    setLoading(false);
                }
            })
            .finally(() => {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => {
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps]);

    return [state, loading, error];
}

export function useObservable<T>(
    observable: Observable<Wrapper<T>> | null | undefined,
    deps: React.DependencyList = [],
): [T | undefined, boolean, Error | undefined] {
    const [state, setState] = useState<T>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        // If observable is null/undefined, just return default state
        if (!observable) {
            setLoading(false);
            setState(undefined);
            setError(undefined);
            return;
        }

        setLoading(true);
        const sub = observable.subscribe({
            next: (value) => {
                if (value.error) {
                    setState(undefined);
                    setError(value.error);
                } else if (!value.loading) {
                    setState(
                        value.data === null
                            ? undefined
                            : ((Array.isArray(value.data)
                                  ? [...value.data]
                                  : { ...value.data }) as T),
                    );
                    setError(undefined);
                }
                setLoading(value.loading);
            },
            error: setError,
        });
        return () => sub.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps]);

    return [state, loading, error];
}

export const useBehaviourSubject = <T>(
    subject: BehaviorSubject<T>,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean, Error | undefined] => {
    const [state, setState] = useState(subject.getValue());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error>();
    useEffect(() => {
        setLoading(true);
        const subscription = subject.pipe(distinctUntilChanged()).subscribe({
            next: (state) => {
                setState(state);
                setLoading(false);
            },
            error: setError,
        });
        return () => subscription.unsubscribe();
    }, [subject]);
    useEffect(() => {
        subject.next(state);
    }, [subject, state]);
    return [state, setState, loading, error];
};

export function usePromiseFunc<P extends unknown[], T>(
    func: (...args: P) => Promise<T>,
): [(...args: P) => Promise<T>, boolean, Error | undefined] {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();

    const execute = async (...args: P) => {
        setLoading(true);
        setError(undefined);
        let result = undefined;
        try {
            result = await func(...args);
        } catch (err) {
            setError(err as Error);
            return Promise.reject(err);
        } finally {
            setLoading(false);
        }
        return Promise.resolve(result);
    };

    return [execute, loading, error];
}
