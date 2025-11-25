import { UploadImageBtn } from '@/components/UploadImageBtn';
import { galleryService } from '@/services/gallery.service';

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
    const addImages = galleryService.useAddImages(albumId);
    
    return (
        <UploadImageBtn
            useFunc={() => addImages}
            onClose={onClose}
            onSuccess={onSuccess}
        />
    );
};
