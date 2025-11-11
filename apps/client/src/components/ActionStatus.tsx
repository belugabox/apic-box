import { ActionStatus } from '@server/action/action.types';

interface ActionStatusProps {
    status: ActionStatus;
    className?: string;
}

export const ActionStatusTag = ({
    status,
    className = '',
}: ActionStatusProps) => {
    let icon = 'carpenter';
    switch (status) {
        case ActionStatus.PUBLISHED:
            icon = 'public';
            break;
        case ActionStatus.TESTING:
            icon = 'experiment';
            break;
        case ActionStatus.ARCHIVED:
            icon = 'archive';
            break;
    }

    return (
        <span className={className}>
            <i className="">{icon}</i>
            <div className="tooltip right">
                {status === ActionStatus.PUBLISHED ? (
                    <div>Publié</div>
                ) : status === ActionStatus.TESTING ? (
                    <div>En test</div>
                ) : status === ActionStatus.ARCHIVED ? (
                    <div>Archivé</div>
                ) : (
                    <div>Brouillon</div>
                )}
            </div>
        </span>
    );
};
