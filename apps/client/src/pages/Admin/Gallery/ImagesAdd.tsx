import { useRef } from 'react';
import { useForm } from 'react-hook-form';

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
    const [addImages, loading, error] = useGalleryAddImages(albumId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            files: FileList,
        },
        mode: 'onBlur',
    });

    const onChange = async () => {
        console.log('Files changed', fileInputRef.current?.files);
        if (
            !fileInputRef.current?.files ||
            fileInputRef.current.files.length === 0
        ) {
            return;
        }
        try {
            const files = Array.from(fileInputRef.current.files);
            await addImages(files);
            reset();
            onSuccess?.();
            onClose?.();
        } catch (err) {
            console.error("Erreur lors de l'ajout des images:", err);
        }
    };

    return (
        <form onChange={handleSubmit(onChange)}>
            {error && <span className="error-text">{error.message}</span>}
            <button
                className="primary large fixed margin center bottom"
                type="button"
            >
                {!loading ? (
                    <i>add</i>
                ) : (
                    <progress className="circle small"></progress>
                )}
                <span>Ajouter des photos</span>
                <input
                    id="files"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.JPG,.JPEG,image/jpeg"
                    ref={fileInputRef}
                    className={errors.files ? 'invalid' : ''}
                />
            </button>
        </form>
    );
};

export const AdminGalleryImagesAdd = ({
    albumId,
    onClose,
    onSuccess,
}: AdminGalleryImagesAddProps) => {
    const [addImages, loading, error] = useGalleryAddImages(albumId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            files: FileList,
        },
        mode: 'onBlur',
    });

    const onChange = async () => {
        console.log('Files changed', fileInputRef.current?.files);
    };

    const onSubmit = async () => {
        console.log('Submitting files', fileInputRef.current?.files);
        if (
            !fileInputRef.current?.files ||
            fileInputRef.current.files.length === 0
        ) {
            return;
        }
        try {
            const files = Array.from(fileInputRef.current.files);
            await addImages(files);
            reset();
            onSuccess?.();
            onClose?.();
        } catch (err) {
            console.error("Erreur lors de l'ajout des images:", err);
        }
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    const hasFiles =
        fileInputRef.current?.files && fileInputRef.current.files.length > 0;

    return (
        <div>
            <form
                onChange={handleSubmit(onChange)}
                onSubmit={handleSubmit(onSubmit)}
            >
                <nav>
                    <button className="circle" type="button">
                        <i>attach_file</i>
                        <input
                            id="files"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.JPG,.JPEG,image/jpeg"
                            ref={fileInputRef}
                            className={errors.files ? 'invalid' : ''}
                        />
                    </button>
                </nav>
                {/*lister les fichiers sélectionnés*/}
                {fileInputRef.current?.files && (
                    <div className="grid">
                        {Array.from(fileInputRef.current.files).map((file) => (
                            <div key={file.name} className="square s2 m1">
                                <img
                                    className="small"
                                    style={{
                                        aspectRatio: 'auto',
                                    }}
                                    src={URL.createObjectURL(file)}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {errors.files && (
                    <span className="error-text">{errors.files.message}</span>
                )}
                {error && <span className="error-text">{error.message}</span>}
                <nav className="right-align">
                    <button
                        type="button"
                        className="border"
                        onClick={handleCancel}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !hasFiles}
                        className="primary"
                    >
                        {!loading ? (
                            <i>add</i>
                        ) : (
                            <progress className="circle small"></progress>
                        )}
                        Ajouter
                    </button>
                </nav>
            </form>
        </div>
    );
};
