import { ActionCard } from "@/components/ActionCard";
import { useActions } from "@/services/action";
import { ActionType } from "@server/action/action.types";
import { useNavigate } from "react-router";

export const Actions = () => {
    const navigate = useNavigate();
    const [actions, loading, error] = useActions();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="grid">
            {actions?.map((action) => (
                <ActionCard className="s12 m6 l3" key={action.id} action={action} >
                    {action.type === ActionType.GALLERY ? (
                        <button onClick={() => navigate(`/gallery/${action.id}`)}>
                            View Gallery
                        </button>
                    ) : (
                        <button>View Event</button>
                    )}
                </ActionCard>
            ))}
        </div>
    );
}