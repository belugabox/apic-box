import { ReactNode } from 'react';

import { Gallery } from '@server/gallery/gallery.types';

import { useGalleryCover } from '@/services/gallery';

import { CardBtn } from './CardBtn';

interface GalleryCardProps {
    gallery: Gallery;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GalleryCard = ({
    gallery,
    children,
    className,
    onClick,
}: GalleryCardProps) => {
    const [cover] = useGalleryCover(gallery);

    return (
        <CardBtn className={`no-padding ${className}`} onClick={onClick}>
            <div className="grid no-space">
                <div className="s4">
                    {cover && (
                        <img
                            className="responsive"
                            src={cover}
                            alt={`${gallery.name} cover`}
                            style={{
                                objectFit: 'contain',
                                backgroundColor: '#ffffff',
                            }}
                        />
                    )}
                    {!cover && (
                        <div
                            className="surface-dim center-align middle-align"
                            style={{ height: '100%' }}
                        >
                            <i className="large secondary-text">photo</i>
                        </div>
                    )}
                </div>
                <div className={`s8 padding`}>
                    <div className="row max top-align">
                        <div className="max" style={{ width: '100%' }}>
                            <h5
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {gallery.name}
                            </h5>
                            <p className="secondary-text">
                                {gallery.description}
                            </p>
                            <p className="secondary-text no-margin">
                                {gallery.albums.length} albums
                            </p>
                        </div>
                        <div>
                            <i className="small secondary-text">
                                {gallery.isProtected ? 'lock' : ''}
                            </i>
                        </div>
                    </div>
                    {children && <nav className="right-align">{children}</nav>}
                </div>
            </div>
        </CardBtn>
    );
};
