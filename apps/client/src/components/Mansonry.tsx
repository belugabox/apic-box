import {
    Children,
    ReactNode,
    isValidElement,
    useEffect,
    useState,
} from 'react';

interface MansoryBreakpoints {
    small?: number;
    medium?: number;
    large?: number;
    extra?: number;
}

interface MansoryProps {
    className?: string;
    children?: ReactNode;
    breakpoints?: MansoryBreakpoints;
}

export const Mansory = ({
    className,
    children,
    breakpoints = { small: 1, medium: 2, large: 3, extra: 4 },
}: MansoryProps) => {
    const colsSmall = breakpoints.small ?? 1;
    const colsMedium = breakpoints.medium ?? 2;
    const colsLarge = breakpoints.large ?? 3;
    const colsExtra = breakpoints.extra ?? 4;
    const [columnCount, setColumnCount] = useState(colsSmall);

    useEffect(() => {
        const updateColumnCount = () => {
            const width = window.innerWidth;
            if (width < 600) {
                setColumnCount(colsSmall);
            } else if (width < 840) {
                setColumnCount(colsMedium);
            } else if (width < 1200) {
                setColumnCount(colsLarge);
            } else {
                setColumnCount(colsExtra);
            }
        };

        updateColumnCount();
        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, [colsSmall, colsMedium, colsLarge]);

    // Extraire le ratio d'un enfant
    const getRatio = (child: ReactNode): number => {
        if (!isValidElement(child)) return 1;
        const imageRatio = (child.props as { image?: { ratio?: number } })
            ?.image?.ratio;
        return imageRatio ?? 1;
    };

    // Extraire le ratio de chaque enfant
    const childrenWithRatio = Children.toArray(children).map((child) => ({
        child,
        ratio: getRatio(child),
    }));

    // Distribuer les enfants dans les colonnes en équilibrant par hauteur
    const columns: { child: ReactNode; ratio: number }[][] = Array(columnCount)
        .fill(null)
        .map(() => []);
    const columnHeights: number[] = Array(columnCount).fill(0);

    childrenWithRatio.forEach(({ child, ratio }) => {
        // Trouver la colonne avec la plus petite hauteur
        const minIndex = columnHeights.indexOf(Math.min(...columnHeights));
        columns[minIndex].push({ child, ratio });
        // Ajouter la hauteur approximative : plus le ratio est grand (paysage), plus la hauteur est petite
        // On utilise (100 / ratio) pour que les images paysage aient une hauteur bien plus petite
        columnHeights[minIndex] += 100 / ratio;
    });

    return (
        <div className={'top-margin ' + className}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                {columns.map((columnItems, colIndex) => (
                    <div
                        key={colIndex}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        {columnItems.map(({ child }) => child)}
                    </div>
                ))}
            </div>
        </div>
    );
};
