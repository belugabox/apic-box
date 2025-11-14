interface CardBtnProps {
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
}

export const CardBtn = ({ className, children, onClick }: CardBtnProps) => {
    return (
        <article
            className={`${onClick ? 'wave ' : ''}${className}`}
            style={{
                cursor: onClick ? 'pointer' : 'inherit',
            }}
            onClick={onClick}
        >
            {children}
        </article>
    );
};
