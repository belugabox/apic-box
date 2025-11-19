import { useRef } from 'react';
import { useForm } from 'react-hook-form';

interface UploadImageBtnProps {
    useFunc: () => [
        (files: File[]) => Promise<string | void>,
        boolean,
        Error | undefined,
    ];
    className?: string;
    icon?: string;
    text?: string;
    multiple?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const UploadImageBtn = ({
    useFunc,
    className,
    icon = 'add',
    text,
    multiple = false,
    onClose,
    onSuccess,
}: UploadImageBtnProps) => {
    const [upload, loading, error] = useFunc();
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
        if (
            !fileInputRef.current?.files ||
            fileInputRef.current.files.length === 0
        ) {
            return;
        }
        try {
            const files = Array.from(fileInputRef.current.files);
            await upload(files);
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
                className={`${className} ${!text ? 'circle' : ''}`}
                style={{ cursor: 'pointer' }}
                type="button"
            >
                {!loading ? (
                    <i>{icon}</i>
                ) : (
                    <progress className={`circle small`}></progress>
                )}
                <span>{text}</span>
                <input
                    id="files"
                    type="file"
                    multiple={multiple}
                    style={{ cursor: 'pointer' }}
                    accept=".jpg,.jpeg,.png,.JPG,.JPEG,.PNG,image/jpeg,image/png"
                    ref={fileInputRef}
                    className={errors.files ? 'invalid' : ''}
                />
            </button>
        </form>
    );
};
