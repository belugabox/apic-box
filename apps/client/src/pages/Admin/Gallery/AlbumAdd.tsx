import { useGalleryAddAlbum } from "@/services/gallery";
import { useForm } from "react-hook-form";

interface AdminGalleryAlbumAddProps {
    galleryId: number;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryAlbumAdd = ({ galleryId, onClose, onSuccess }: AdminGalleryAlbumAddProps) => {

    const [addAlbum, loading, error] = useGalleryAddAlbum(galleryId);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            name: '',
        }
    });
    const onSubmit = async (album: { name: string }) => {
        await addAlbum(album.name).then(() => {
            reset();
            onSuccess?.();
            onClose?.();
        });
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    return <div><form onSubmit={handleSubmit(onSubmit)}>
        <div className="field label border">
            <input
                id="name"
                type="text"
                {...register("name", {
                    required: "Le nom est obligatoire."
                })}
                className={errors.name ? 'invalid' : ''}
            />
            <label>Nom</label>
        </div>
        <span className="error-text">{error?.message}</span>
        <nav className="right-align">
            <button type="button" className="border" onClick={handleCancel}>
                Annuler
            </button>
            <button type="submit" disabled={loading} className="primary">
                Créer
            </button>
        </nav></form></div>;
}