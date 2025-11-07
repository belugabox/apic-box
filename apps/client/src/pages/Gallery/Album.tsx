import { ImageCard } from "@/components/ImageCard";
import { useGallery } from "@/services/gallery";
import { useParams } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"

export const Album = () => {
    const { galleryName } = useParams<{ galleryName: string }>();
    const { albumName } = useParams<{ albumName: string }>();

    if (!galleryName || !albumName) {
        return <div>Gallery or Album not found</div>;
    }

    const [gallery, _, error,] = useGallery(galleryName);

    const album = gallery?.albums.find(a => a.name === albumName);

    if (!album) {
        return <div>Album not found</div>;
    }

    return (
        <div>
            {error && (<span className="error-text">{error?.message}</span>)}
            <h5>{album.name}</h5>

            <ResponsiveMasonry
                columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}            >
                <Masonry>
                    {album.images.map((image) => (
                        <ImageCard key={image.name} image={image} />
                    ))}
                </Masonry>
            </ResponsiveMasonry>
        </div>
    );
};
