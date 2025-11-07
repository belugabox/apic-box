import { useActionAdd, useActionUpdate } from "@/services/action";
import { Action, ActionStatus, ActionType } from "@server/action/action.types";
import { useForm } from "react-hook-form";

interface ActionAddUpdateProps {
    action?: Action;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const ActionAddUpdate = ({ action, onClose, onSuccess }: ActionAddUpdateProps) => {
    const isUpdate = !!action;

    const [addAction, addLoading, addError] = useActionAdd();
    const [updateAction, updateLoading, updateError] = useActionUpdate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            id: action?.id ?? 0,
            title: action?.title ?? '',
            description: action?.description ?? '',
            type: action?.type ?? ActionType.SIMPLE,
            status: action?.status ?? ActionStatus.PENDING,
            createdAt: action?.createdAt ?? new Date(),
            updatedAt: action?.updatedAt ?? new Date(),
        }
    });

    const onSubmit = async (data: Action) => {
        if (isUpdate) {
            await updateAction(data).then(() => {
                reset();
                onSuccess?.();
                onClose?.();
            });
        } else {
            await addAction(data).then(() => {
                reset();
                onSuccess?.();
                onClose?.();
            });
        }
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    return (
        <div>
            <h5>{isUpdate ? 'Mettre à jour' : 'Créer'} une action</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        id="title"
                        type="text"
                        {...register("title", {
                            required: "Le titre est obligatoire."
                        })}
                        className={errors.title ? 'invalid' : ''}
                    />
                    <label>Nom</label>
                </div>
                <div className="field label border">
                    <input
                        id="description"
                        type="text"
                        {...register("description", {
                            required: "La description est obligatoire."
                        })}
                        className={errors.description ? 'invalid' : ''}
                    />
                    <label>Description</label>
                </div>
                <div className="field label border">
                    <select
                        id="type"
                        {...register("type", {
                            required: "Le type est obligatoire."
                        })}
                        className={errors.type ? 'invalid' : ''}
                    >
                        <option value={ActionType.SIMPLE}>Simple</option>
                        <option value={ActionType.GALLERY}>Galerie</option>
                    </select>
                    <label>Type</label>
                </div>
                <div className="field label border">
                    <select
                        id="status"
                        {...register("status", {
                            required: "Le statut est obligatoire."
                        })}
                        className={errors.status ? 'invalid' : ''}
                    >
                        <option value={ActionStatus.PENDING}>En attente</option>
                        <option value={ActionStatus.IN_PROGRESS}>En cours</option>
                        <option value={ActionStatus.COMPLETED}>Terminé</option>
                    </select>
                    <label>Statut</label>
                </div>
                <span className="error-text">{addError?.message ?? updateError?.message}</span>
                <nav className="right-align">
                    <button type="button" className="border" onClick={handleCancel}>
                        Annuler
                    </button>
                    <button type="submit" disabled={addLoading || updateLoading} className="primary">
                        {isUpdate ? 'Mettre à jour' : 'Créer'}
                    </button>
                </nav>
            </form>
        </div>
    );
}