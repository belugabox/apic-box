import { ImageCard } from "@/components/ImageCard";
import { useGallery } from "@/services/gallery";
import { useParams } from "react-router";

export const Gallery = () => {
    const { name } = useParams<{ name: string }>();

    if (!name) {
        return <div>Gallery not found</div>;
    }
    const galleryName = name;

    const [gallery, _, error,] = useGallery(galleryName);

    return (
        <div>
            {error && (<span className="error-text">{error?.message}</span>)}
            {gallery?.albums.map((album) => (
                <div key={album.name}>
                    <h2>{album.name}</h2>
                    {album.images.map((image) => (
                        <ImageCard key={image.name} image={image} />
                    ))}
                </div>
            ))}
        </div>
    );
};
