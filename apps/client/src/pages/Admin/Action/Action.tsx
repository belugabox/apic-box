import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Action } from '@server/action/action.types';

import { ActionCard } from '@/components/ActionCard';
import { ActionStatusTag } from '@/components/ActionStatus';
import { useActions } from '@/services/action';

import { ActionAdd } from './ActionAdd';
import { ActionDelete } from './ActionDelete';
import { ActionEdit } from './ActionEdit';

export const AdminAction = () => {
    const navigate = useNavigate();
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedAction, setSelectedAction] = useState<Action | undefined>();
    const [actions] = useActions([showEdit, showDelete]);

    const handleEdit = (action: Action) => {
        setSelectedAction(action);
        setShowEdit(true);
    };

    const handleDelete = (action: Action) => {
        setSelectedAction(action);
        setShowDelete(true);
    };

    const handleCloseDelete = () => {
        setShowDelete(false);
        setSelectedAction(undefined);
    };
    const handleCloseEdit = () => {
        setShowEdit(false);
        setSelectedAction(undefined);
    };

    return (
        <div>
            <div className="grid">
                {actions?.map((action) => (
                    <ActionCard
                        className="s12 m6 l3"
                        key={action.id}
                        action={action}
                    >
                        <div className="max left-align">
                            <ActionStatusTag status={action.status} />
                        </div>
                        <button
                            className="circle fill"
                            onClick={() => handleDelete(action)}
                        >
                            <i>delete</i>
                        </button>
                        <button
                            className="circle fill"
                            onClick={() => handleEdit(action)}
                        >
                            <i>edit</i>
                        </button>
                        <button
                            className=""
                            onClick={() =>
                                navigate(`/admin/gallery/${action.galleryId}`)
                            }
                        >
                            <i>photo</i> Galerie
                        </button>
                    </ActionCard>
                ))}
                <div className="s12 large-margin"></div>
            </div>
            {/* Modal de suppression */}
            {showDelete && (
                <dialog className="active">
                    <ActionDelete
                        action={selectedAction}
                        onClose={handleCloseDelete}
                        onSuccess={() => {
                            handleCloseDelete();
                        }}
                    />
                </dialog>
            )}
            {/* Modal d'ajout/édition */}
            {showEdit && (
                <>
                    {selectedAction ? (
                        <dialog className="modal active">
                            <ActionEdit
                                action={selectedAction}
                                onClose={handleCloseEdit}
                                onSuccess={() => {
                                    handleCloseEdit();
                                }}
                            />
                        </dialog>
                    ) : (
                        <dialog className="modal active">
                            <ActionAdd
                                onClose={handleCloseEdit}
                                onSuccess={() => {
                                    handleCloseEdit();
                                }}
                            />
                        </dialog>
                    )}
                </>
            )}
            {/* Bouton d'ajout */}
            <button
                className="primary large fixed margin center bottom"
                onClick={() => setShowEdit(true)}
            >
                <i>add</i>
                <span>Créer une action</span>
            </button>
        </div>
    );
};
