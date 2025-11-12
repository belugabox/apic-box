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
    return (
        <UploadImageBtn
            useFunc={() => useGalleryAddImages(albumId)}
            onClose={onClose}
            onSuccess={onSuccess}
        />
    );
};
