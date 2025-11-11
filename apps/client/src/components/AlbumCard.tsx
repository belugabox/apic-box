import { ReactNode } from 'react';

import { Album } from '@server/gallery/gallery.types';

interface AlbumCardProps {
    album: Album;
    children?: ReactNode;
    className?: string;
}

export const AlbumCard = ({ album, children, className }: AlbumCardProps) => {
    return (
        <article className={className}>
            <div className="row top-align">
                <div className="max">
                    <h5>{album.name}</h5>
                    <p>{album.images.length} photos</p>
                </div>
            </div>
            <nav className="right-align">{children}</nav>
        </article>
    );
};
