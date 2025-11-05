export namespace Utils {
    export const contains = (array1: string[], array2: string[]): boolean => {
        for (const element1 of array1) {
            if (array2.includes(element1)) {
                return true;
            }
        }
        return false;
    };
}
