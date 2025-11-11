import { ReactNode } from 'react';

import { Image } from '@server/gallery/gallery.types';

import { useGalleryImage } from '@/services/gallery';

import styles from './ImageCard.module.css';

interface ImageCardProps {
    galleryId: number;
    image: Image;
    fromAdmin?: boolean;
    children?: ReactNode;
    className?: string;
}

export const ImageCard = ({
    galleryId,
    image,
    fromAdmin = false,
    children,
    className,
}: ImageCardProps) => {
    const [imageData, loading, error] = useGalleryImage(
        galleryId,
        image,
        fromAdmin,
    );
    return (
        <div className={className}>
            <div
                className={'surface-dim' + (loading ? ` ${styles.pulse}` : '')}
                style={{ aspectRatio: image.ratio }}
            >
                {imageData && (
                    <img
                        src={imageData}
                        alt={image.code}
                        style={{
                            width: '100%',
                            aspectRatio: image.ratio,
                        }}
                    />
                )}
                {error && <p>Error: {error.message}</p>}
            </div>
            {children && (
                <nav className="center-align tiny-margin">{children}</nav>
            )}
        </div>
    );
};
