import { AlbumCard } from "@/components/AlbumCard";
import { useGallery } from "@/services/gallery";
import { useNavigate, useParams } from "react-router";

export const Gallery = () => {
    const navigate = useNavigate();
    const { galleryName } = useParams<{ galleryName: string }>();

    if (!galleryName) {
        return <div>Gallery not found</div>;
    }

    const [gallery, _, error,] = useGallery(galleryName);

    return (
        <div className="grid">
            {error && (<span className="error-text">{error?.message}</span>)}
            {gallery?.albums.map((album) => (
                <AlbumCard className="s12 m6 l3" key={album.name} album={album}>
                    <button onClick={() => navigate(`/gallery/${galleryName}/${album.name}`)}>Voir l'album</button>
                </AlbumCard>
            ))}
        </div>
    );
};
