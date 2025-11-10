import { useEffect, useState } from 'react';
import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';

import { Wrapper } from './wrapperObs';

export function usePromise<T>(
    promise: () => Promise<T>,
    deps: React.DependencyList = [],
): [T | undefined, boolean, Error | undefined] {
    const [state, setState] = useState<T>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        setLoading(true);
        promise()
            .then((value) => {
                setState(value);
                setLoading(false);
            })
            .catch(setError)
            .finally(() => {
                setLoading(false);
            });
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

export function usePromiseFunc<P extends unknown[]>(
    func: (...args: P) => Promise<void | string>,
): [(...args: P) => Promise<void | string>, boolean, Error | undefined] {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();

    const execute = async (...args: P) => {
        setLoading(true);
        setError(undefined);
        try {
            await func(...args);
        } catch (err) {
            setError(err as Error);
            return Promise.reject(err);
        } finally {
            setLoading(false);
        }
        return Promise.resolve();
    };

    return [execute, loading, error];
}
