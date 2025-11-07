import { ActionCard } from "@/components/ActionCard";
import { useActions } from "@/services/action";
import { useState } from "react";
import { ActionAddUpdate } from "./ActionAddUpdate";
import { Action } from "@server/action/action.types";
import { ActionDelete } from "./ActionDelete";

export const Actions = () => {
    const [showAddUpdate, setShowAddUpdate] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedAction, setSelectedAction] = useState<Action | undefined>();
    const [actions] = useActions([showAddUpdate, showDelete]);

    const handleEdit = (action: Action) => {
        setSelectedAction(action);
        setShowAddUpdate(true);
    };

    const handleDelete = (action: Action) => {
        setSelectedAction(action);
        setShowDelete(true);
    };

    const handleCloseDelete = () => {
        setShowDelete(false);
        setSelectedAction(undefined);
    };
    const handleCloseAddUpdate = () => {
        setShowAddUpdate(false);
        setSelectedAction(undefined);
    };

    return <>
        <div className="grid">
            {actions?.map((action) => (
                <ActionCard className="s12 m6 l3" key={action.id} action={action} >
                    <button className="circle fill"
                        onClick={() => handleDelete(action)}>
                        <i>delete</i>
                    </button>
                    <button className="circle"
                        onClick={() => handleEdit(action)}>
                        <i>edit</i>
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
            </dialog>)}
        {/* Modal d'ajout/édition */}
        {showAddUpdate && (
            <dialog className="active">
                <ActionAddUpdate action={selectedAction}
                    onClose={handleCloseAddUpdate}
                    onSuccess={() => {
                        handleCloseAddUpdate();
                    }} />
            </dialog>)}
        <button className="primary large fixed margin center bottom"
            onClick={() => setShowAddUpdate(true)}>
            <i>add</i>
            <span>Créer une action</span>
        </button>
    </>;
}