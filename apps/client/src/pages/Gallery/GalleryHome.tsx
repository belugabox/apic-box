import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { GalleryCard } from '@/components/GalleryCard';
import { useGalleries } from '@/services/gallery';
import { spinner } from '@/services/spinner';

export const GalleryHome = () => {
    const navigate = useNavigate();
    const [galleries, loading, error] = useGalleries();

    spinner('GalleryHome', loading);
    if (loading) return;
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
                        className="s12 m6"
                        key={gallery.id}
                        gallery={gallery}
                        onClick={() => navigate(`/gallery/${gallery.id}`)}
                    ></GalleryCard>
                ))}
            </div>
        </div>
    );
};
