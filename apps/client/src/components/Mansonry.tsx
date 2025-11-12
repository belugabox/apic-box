import { ReactNode, useEffect, useState } from 'react';

interface MansoryBreakpoints {
    small?: number;
    medium?: number;
    large?: number;
}

interface MansoryProps {
    className?: string;
    children?: ReactNode;
    breakpoints?: MansoryBreakpoints;
}

export const Mansory2 = ({
    className,
    children,
    breakpoints = { small: 1, medium: 2, large: 3 },
}: MansoryProps) => {
    const colsSmall = breakpoints.small ?? 1;
    const colsMedium = breakpoints.medium ?? 2;
    const colsLarge = breakpoints.large ?? 3;
    const [columnCount, setColumnCount] = useState(colsSmall);

    useEffect(() => {
        const updateColumnCount = () => {
            const width = window.innerWidth;
            if (width < 600) {
                setColumnCount(colsSmall);
            } else if (width < 840) {
                setColumnCount(colsMedium);
            } else {
                setColumnCount(colsLarge);
            }
        };

        updateColumnCount();
        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, [colsSmall, colsMedium, colsLarge]);

    const masonryStyles = {
        columnCount: columnCount,
        columnGap: '1rem',
    };

    return (
        <div className={className}>
            <div className="margin" style={masonryStyles}>
                {children}
            </div>
        </div>
    );
};
