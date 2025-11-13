import { useEffect, useState } from 'react';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

const elements = new BehaviorSubject<Record<string, boolean>>({});

export const spinner = (key: string, show: boolean) => {
    useEffect(() => {
        elements.next({ ...elements.value, [key]: show });
    }, [show]);
};

export const useSpinner = () => {
    const [state, setState] = useState(false);
    useEffect(() => {
        const subscription = elements.pipe(distinctUntilChanged()).subscribe({
            next: (elements) => {
                const state = Object.values(elements).some(Boolean);
                setState(state);
            },
        });
        return () => subscription.unsubscribe();
    }, []);
    return state;
};
