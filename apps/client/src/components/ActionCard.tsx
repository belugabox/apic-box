import { Action, ActionType } from "@server/action/action.types";
import { ReactNode } from "react";

interface ActionCardProps {
    action: Action;
    children?: ReactNode;
    className?: string;
}

export const ActionCard = ({ action, children, className }: ActionCardProps) => {
    return (
        <article className={className}>
            <div className="row top-align">
                <div className="max">
                    <h5>{action.name}</h5>
                    <p className="secondary-text">{action.description}</p>
                </div>
                <div>
                    <i className="extra secondary-text">
                        {action.type === ActionType.GALLERY ? 'photo' : 'event'}
                    </i>
                </div>
            </div>
            <nav className="right-align">{children}</nav>
        </article>
    )
}