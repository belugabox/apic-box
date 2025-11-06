import { Observable, defer, from, startWith } from 'rxjs';

export type Wrapper<T> = {
    data: T | undefined;
    loading: boolean;
    error: Error | undefined;
};

export const toWrapperObservable = <T>(
    promise: () => Promise<T>,
): Observable<Wrapper<T>> => {
    return defer(() =>
        from(
            promise()
                .then((data) => ({
                    data,
                    loading: false,
                    error: undefined,
                }))
                .catch((error) => ({
                    data: undefined,
                    loading: false,
                    error,
                })),
        ).pipe(
            startWith({
                data: undefined,
                loading: true,
                error: undefined,
            }),
        ),
    );
};
