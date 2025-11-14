interface SubNavigationProps {
    onClickBack?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export const SubNavigation = ({
    className,
    children,
    onClickBack,
}: SubNavigationProps) => {
    return (
        <nav className={`row left-align top-align ${className}`}>
            <nav className="max">
                {onClickBack && (
                    <button
                        type="button"
                        className="circle transparent"
                        onClick={onClickBack}
                    >
                        <i>arrow_back</i>
                    </button>
                )}
                <h5>{children}</h5>
            </nav>
        </nav>
    );
};
