import { UploadImageBtn } from '@/components/UploadImageBtn';
import { useGalleryAddImages } from '@/services/gallery';

interface AdminGalleryImagesAddProps {
    albumId: number;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryImagesButton = ({
    albumId,
    onClose,
    onSuccess,
}: AdminGalleryImagesAddProps) => {
    // Call hook at component level, not in callback
    const addImages = useGalleryAddImages(albumId);
    
    return (
        <UploadImageBtn
            useFunc={() => addImages}
            onClose={onClose}
            onSuccess={onSuccess}
        />
    );
};
