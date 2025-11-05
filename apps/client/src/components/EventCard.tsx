import { ReactNode } from 'react'

interface EventCardProps {
    title: string
    icon: string
    description: string
    children: ReactNode
}

export const EventCard = ({ title, icon, description, children }: EventCardProps) => {
    return (
        <article className="fill">
            <header>
                <i className="extra">{icon}</i>
                <h5>{title}</h5>
            </header>
            <p>{description}</p>
            <nav className="center-align">
                {children}
            </nav>
        </article>
    )
}
