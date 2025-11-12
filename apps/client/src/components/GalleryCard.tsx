import { ReactNode } from 'react';

import { Gallery } from '@server/gallery/gallery.types';

import { useGalleryCover } from '@/services/gallery';

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
    const [cover] = useGalleryCover(gallery);

    return (
        <article className={`no-padding ${className}`}>
            <div className="grid no-space">
                <div className="s4">
                    {cover && (
                        <img
                            className="responsive large"
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
                <div className={`s8 padding row vertical`}>
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
                        </div>
                        <div>
                            <i className="small secondary-text">
                                {gallery.isProtected ? 'lock' : ''}
                            </i>
                        </div>
                    </div>
                    <nav className="bottom-align right-align">{children}</nav>
                </div>
            </div>
        </article>
    );
};
