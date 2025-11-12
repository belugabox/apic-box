import { GalleryStatus } from '@server/gallery/gallery.types';

interface StatusTagProps {
    status: GalleryStatus;
    className?: string;
}

export const StatusTag = ({ status, className = '' }: StatusTagProps) => {
    let icon = 'experiment';
    switch (status) {
        case GalleryStatus.PUBLISHED:
            icon = 'public';
            break;
        case GalleryStatus.ARCHIVED:
            icon = 'archive';
            break;
    }

    return (
        <span className={className}>
            <i className="">{icon}</i>
            <div className="tooltip right">
                {status === GalleryStatus.PUBLISHED ? (
                    <div>Publié</div>
                ) : status === GalleryStatus.ARCHIVED ? (
                    <div>Archivé</div>
                ) : (
                    <div>Brouillon</div>
                )}
            </div>
        </span>
    );
};
