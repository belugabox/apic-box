import { ReactNode } from 'react';

import { Gallery } from '@server/gallery/gallery.types';

interface GalleryCardProps {
    gallery: Gallery;
    children?: ReactNode;
    className?: string;
}

export const GalleryCard = ({
    gallery,
    children,
    className,
}: GalleryCardProps) => {
    return (
        <article className={className}>
            <div className="row top-align">
                <div className="max">
                    <h5>{gallery.name}</h5>
                    <p className="secondary-text">{gallery.description}</p>
                </div>
                <div>
                    <i className="extra secondary-text">
                        {gallery.isProtected ? 'lock' : ''}
                    </i>
                </div>
            </div>
            <nav className="right-align">{children}</nav>
        </article>
    );
};
