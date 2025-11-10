import { ActionStatus } from '@server/action/action.types';

interface ActionStatusProps {
    status: ActionStatus;
    className?: string;
}

export const ActionStatusTag = ({
    status,
    className = '',
}: ActionStatusProps) => {
    return (
        <div className={className}>
            {status === ActionStatus.COMPLETED ? (
                <div>Completed</div>
            ) : status === ActionStatus.IN_PROGRESS ? (
                <div>In Progress</div>
            ) : (
                <div>Pending</div>
            )}
        </div>
    );
};
