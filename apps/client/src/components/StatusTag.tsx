import { EntityStatus } from '@server/modules/shared.types';

interface StatusTagProps {
    status: EntityStatus | EntityStatus;
    className?: string;
}

export const StatusTag = ({ status, className = '' }: StatusTagProps) => {
    let icon = 'experiment';
    switch (status) {
        case EntityStatus.PUBLISHED:
            icon = 'public';
            break;
        case EntityStatus.ARCHIVED:
            icon = 'archive';
            break;
    }

    return (
        <span className={className}>
            <i className="">{icon}</i>
            <div className="tooltip right">
                {status === EntityStatus.PUBLISHED ? (
                    <div>Publié</div>
                ) : status === EntityStatus.ARCHIVED ? (
                    <div>Archivé</div>
                ) : (
                    <div>Brouillon</div>
                )}
            </div>
        </span>
    );
};
