import { Action } from '@server/action/action.types';

import { useActionDelete } from '@/services/action';

interface ActionDeleteProps {
    action?: Action;
    onClose: () => void;
    onSuccess: () => void;
}

export const ActionDelete = ({
    action,
    onClose,
    onSuccess,
}: ActionDeleteProps) => {
    const [deleteAction, loading, error] = useActionDelete();

    const handleConfirmDelete = async () => {
        try {
            if (action) {
                await deleteAction(action);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    return (
        <div>
            <h5>Confirmer la suppression</h5>
            <p>
                Êtes-vous sûr de vouloir supprimer l'action{' '}
                <strong>"{action?.name}"</strong> ?
            </p>
            <span className="error-text">{error?.message}</span>
            <nav className="right-align">
                <button className="border" onClick={onClose}>
                    Annuler
                </button>
                <button
                    className="error"
                    disabled={loading}
                    onClick={handleConfirmDelete}
                >
                    Supprimer
                </button>
            </nav>
        </div>
    );
};
