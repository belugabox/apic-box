import { ReactNode } from 'react';

import { Album } from '@server/gallery/gallery.types';

import { ImageCard } from './ImageCard';

interface AlbumCardProps {
    galleryId: number;
    album: Album;
    children?: ReactNode;
    className?: string;
}

export const AlbumCard = ({
    galleryId,
    album,
    children,
    className,
}: AlbumCardProps) => {
    return (
        <article className={className}>
            <div className="row top-align">
                <div className="max">
                    <h5>{album.name}</h5>
                    <div className="grid">
                        {album.images.slice(0, 4).map((image) => (
                            <div className="s3" key={image.id}>
                                <ImageCard
                                    galleryId={galleryId}
                                    image={image}
                                    square
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <nav className="right-align">
                <div className="max left-align">
                    {album.images.length} photos
                </div>
                <div>{children}</div>
            </nav>
        </article>
    );
};
