import { useGalleryImage } from "@/services/gallery";
import { Image } from "@server/gallery/gallery.types";
import { ReactNode } from "react";
import styles from "./ImageCard.module.css";

interface ImageCardProps {
    image: Image;
    children?: ReactNode;
    className?: string;
}

export const ImageCard = ({ image, children, className }: ImageCardProps) => {
    const [imageData, loading, error] = useGalleryImage("1", image.name);
    return (
        <div className={className}>
            <div
                className={"surface-dim" + (loading ? ` ${styles.pulse}` : "")}
                style={{ aspectRatio: image.ratio }}
            >
                {imageData && (
                    <img
                        src={imageData}
                        alt={image.name}
                        style={{
                            width: '100%',
                            aspectRatio: image.ratio
                        }}
                    />
                )}
                {error && <p>Error: {error.message}</p>}
            </div>
            <nav className="center-align tiny-margin">{image.name} {children}</nav>
        </div>
    );
};