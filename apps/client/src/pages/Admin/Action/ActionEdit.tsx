import { useForm } from 'react-hook-form';

import { Action, ActionStatus } from '@server/action/action.types';

import { useActionUpdate } from '@/services/action';

interface ActionEditProps {
    action: Action;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const ActionEdit = ({ action, onClose, onSuccess }: ActionEditProps) => {
    const [updateAction, loading, error] = useActionUpdate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            id: action.id,
            name: action.name,
            description: action.description,
            type: action.type,
            status: action.status,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
        },
    });

    const onSubmit = async (action: Action) => {
        await updateAction(action).then(() => {
            reset();
            onSuccess?.();
            onClose?.();
        });
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    return (
        <div className="max">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        id="name"
                        type="text"
                        {...register('name', {
                            required: 'Le nom est obligatoire.',
                        })}
                        className={errors.name ? 'invalid' : ''}
                    />
                    <label>Nom</label>
                </div>
                <div className="field label border">
                    <input
                        id="description"
                        type="text"
                        {...register('description', {
                            required: 'La description est obligatoire.',
                        })}
                        className={errors.description ? 'invalid' : ''}
                    />
                    <label>Description</label>
                </div>
                <div className="field label border">
                    <select
                        id="status"
                        {...register('status', {
                            required: 'Le statut est obligatoire.',
                        })}
                        className={errors.status ? 'invalid' : ''}
                    >
                        <option value={ActionStatus.PENDING}>En attente</option>
                        <option value={ActionStatus.IN_PROGRESS}>
                            En cours
                        </option>
                        <option value={ActionStatus.COMPLETED}>Terminé</option>
                    </select>
                    <label>Statut</label>
                </div>
                <span className="error-text">{error?.message}</span>
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
                        disabled={loading}
                        className="primary"
                    >
                        Mettre à jour
                    </button>
                </nav>
            </form>
        </div>
    );
};
