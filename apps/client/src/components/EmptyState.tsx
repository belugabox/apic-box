export const EmptyState = ({
    icon,
    title,
}: {
    icon: string;
    title: string;
}) => {
    return (
        <div className="padding middle-align center-align">
            <div>
                <i className="extra">{icon}</i>
                <h5>{title}</h5>
            </div>
        </div>
    );
};
