import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { GalleryCard } from '@/components/GalleryCard';
import { SubNavigation } from '@/components/SubNavigation';
import { useSpinner } from '@/services/spinner';
import { galleryService } from '@/services/gallery.service';

export const GalleryHome = () => {
    const navigate = useNavigate();
    const [galleries, loading, error] = galleryService.useAll();

    useSpinner('GalleryHome', loading);
    if (loading) return;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div>
            <SubNavigation>Galeries photos</SubNavigation>
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
