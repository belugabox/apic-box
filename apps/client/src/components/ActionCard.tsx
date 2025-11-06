import { ReactNode } from "react";

interface ActionCardProps {
    name: string;
    desc: string;
    children: ReactNode;
    className?: string;
}

export const ActionCard = ({ name, desc, children, className }: ActionCardProps) => {
    return (
        <article className={className}>
            <h5>{name}</h5>
            <p>{desc}</p>
            <nav className="right-align">{children}</nav>
        </article>
    )
}