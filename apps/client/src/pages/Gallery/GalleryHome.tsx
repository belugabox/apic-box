import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { GalleryCard } from '@/components/GalleryCard';
import { Spinner } from '@/components/Spinner';
import { useGalleries } from '@/services/gallery';

export const GalleryHome = () => {
    const navigate = useNavigate();
    const [galleries, loading, error] = useGalleries();

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div>
            {!galleries ||
                (galleries?.length === 0 && (
                    <EmptyState
                        icon="photo_album"
                        title={`Aucune galerie pour le moment`}
                    />
                ))}
            <div className="grid">
                {galleries?.map((gallery) => (
                    <GalleryCard
                        className="s12 m6 l4"
                        key={gallery.id}
                        gallery={gallery}
                    >
                        <button
                            onClick={() => navigate(`/gallery/${gallery.id}`)}
                        >
                            Voir la galerie
                        </button>
                    </GalleryCard>
                ))}
            </div>
        </div>
    );
};
