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
        <div
            className={className + " small-width surface-dim" + (loading ? ` ${styles.pulse}` : "")}
            style={{ aspectRatio: image.ratio }}
        >
            {imageData && (
                <img
                    src={imageData}
                    alt={image.name}
                    className="small-width"
                />
            )}
            {error && <p>Error: {error.message}</p>}
            {children}
        </div>
    );
};