import writeXlsxFile from 'write-excel-file';

export const generateExcel = async <T extends Record<string, any>>(
    data: T[],
): Promise<Blob> => {
    if (!data || data.length === 0) {
        throw new Error('Les données ne peuvent pas être vides');
    }

    const keys = Object.keys(data[0]);
    const columns = keys.map(() => ({
        width: 15,
    }));

    // Créer l'en-tête
    const headerRow = keys.map((key) => ({
        value: key,
        fontWeight: 'bold',
    }));

    // Créer les lignes de données
    const dataRows = data.map((item) =>
        keys.map((key) => ({
            value: item[key],
        })),
    );

    // Combiner en-tête et données
    const rows = [headerRow, ...dataRows];

    return writeXlsxFile(rows, {
        columns,
    }) as Promise<Blob>;
};
