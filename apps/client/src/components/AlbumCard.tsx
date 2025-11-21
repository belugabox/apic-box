import { ReactNode } from 'react';

import type { Album } from '@server/modules/gallery';

import { CardBtn } from './CardBtn';
import { ImageCard } from './ImageCard';

interface AlbumCardProps {
    galleryId: number;
    album: Album;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const AlbumCard = ({
    galleryId,
    album,
    children,
    className,
    onClick,
}: AlbumCardProps) => {
    return (
        <CardBtn className={className} onClick={onClick}>
            <div className="row top-align">
                <div className="max">
                    <h5>{album.name}</h5>
                    <div className="grid">
                        {album.images?.slice(0, 4).map((image) => (
                            <div className="s3" key={image.id}>
                                <ImageCard
                                    galleryId={galleryId}
                                    image={image}
                                    square
                                />
                            </div>
                        ))}
                        {album.images?.length === 0 && (
                            <div className="s3" key={album.id}>
                                <ImageCard galleryId={galleryId} square />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {children && (
                <nav className="right-align">
                    <div>{children}</div>
                </nav>
            )}
        </CardBtn>
    );
};
