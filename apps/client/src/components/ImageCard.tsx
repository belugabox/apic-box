import { ReactNode, useState } from 'react';

import { Image } from '@server/gallery/gallery.types';

import { useGalleryImage } from '@/services/gallery';

import styles from './ImageCard.module.css';

interface ImageCardProps {
    galleryId: number;
    image?: Image;
    zoomable?: boolean;
    square?: boolean;
    fromAdmin?: boolean;
    children?: ReactNode;
    className?: string;
}

export const ImageCard = ({
    galleryId,
    image,
    zoomable = false,
    square = false,
    fromAdmin = false,
    children,
    className,
}: ImageCardProps) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageData, loading, error] = useGalleryImage(
        galleryId,
        image,
        fromAdmin,
    );

    return (
        <>
            <div className={className}>
                <div
                    className={
                        'surface-dim middle-align center-align' +
                        (loading ? ` ${styles.pulse}` : '')
                    }
                    style={{
                        aspectRatio: square ? '1/1' : image?.ratio,
                        cursor: zoomable ? 'zoom-in' : 'inherit',
                        borderRadius: square ? '1em' : '0',
                    }}
                    onClick={() => zoomable && setIsZoomed(true)}
                >
                    {imageData && (
                        <img
                            src={imageData}
                            alt={image?.code}
                            style={{
                                width: '100%',
                                aspectRatio: square ? '1/1' : image?.ratio,
                                objectFit: 'cover',
                            }}
                        />
                    )}
                    {!imageData && <i className="grey-text">no_photography</i>}
                    {error && <p>Error: {error.message}</p>}
                </div>
                {children && (
                    <nav className="center-align tiny-margin">{children}</nav>
                )}
            </div>

            {/* Modal de zoom */}
            {isZoomed && imageData && (
                <dialog
                    className="max active"
                    onClick={() => setIsZoomed(false)}
                >
                    <div
                        className="large-padding"
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <img
                            src={imageData}
                            alt={image?.code}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {children && (
                            <nav className="center-align tiny-margin">
                                {children}
                            </nav>
                        )}
                    </div>
                    <button
                        className="circle transparent absolute top right small-margin"
                        onClick={() => setIsZoomed(false)}
                    >
                        <i>close</i>
                    </button>
                </dialog>
            )}
        </>
    );
};
