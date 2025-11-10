import { useActionAdd } from "@/services/action";
import { Action, ActionStatus, ActionType } from "@server/action/action.types";
import { useForm } from "react-hook-form";

interface ActionAddProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

export const ActionAdd = ({ onClose, onSuccess }: ActionAddProps) => {

    const [addAction, loading, error] = useActionAdd();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            id: 0,
            name: '',
            description: '',
            type: ActionType.SIMPLE,
            status: ActionStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });

    const onSubmit = async (action: Action) => {
        await addAction(action).then(() => {
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
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                <span className="error-text">{error?.message}</span>
                <nav className="right-align">
                    <button type="button" className="border" onClick={handleCancel}>
                        Annuler
                    </button>
                    <button type="submit" disabled={loading} className="primary">
                        Créer
                    </button>
                </nav>
            </form>
        </div>
    );
}