import { EventCard } from '../components/EventCard'
import { useState } from 'react'

export const Events = () => {
    const [photoFormOpen, setPhotoFormOpen] = useState(false)
    const [noelFormOpen, setNoelFormOpen] = useState(false)
    const [halloweenFormOpen, setHalloweenFormOpen] = useState(false)

    return (
        <div>
            <h1>Événements en cours</h1>

            <div className="grid">
                {/* Séance Photo */}
                <EventCard
                    title="Séance Photo"
                    icon="photo_camera"
                    description="Participez à notre séance photo professionnelle et commandez vos photos."
                >
                    <button className="primary round" onClick={() => setPhotoFormOpen(!photoFormOpen)}>
                        <i>camera</i>
                        S'inscrire
                    </button>
                    <button className="round" onClick={() => alert('Consultez les photos de la dernière séance')}>
                        <i>image</i>
                        Voir les photos
                    </button>
                    <button className="round" onClick={() => alert('Commandez vos photos')}>
                        <i>shopping_cart</i>
                        Commander
                    </button>
                </EventCard>

                {/* Grille de Noël */}
                <EventCard
                    title="Grille de Noël"
                    icon="celebration"
                    description="Participez à notre tirage au sort de Noël avec des lots à gagner!"
                >
                    <button className="primary round" onClick={() => setNoelFormOpen(!noelFormOpen)}>
                        <i>card_giftcard</i>
                        S'inscrire
                    </button>
                </EventCard>

                {/* Grille d'Halloween */}
                <EventCard
                    title="Grille d'Halloween"
                    icon="skull"
                    description="Inscrivez-vous à notre tirage Halloween et tentez de gagner des prix spéciaux!"
                >
                    <button className="primary round" onClick={() => setHalloweenFormOpen(!halloweenFormOpen)}>
                        <i>star</i>
                        S'inscrire
                    </button>
                </EventCard>
            </div>

            {/* Formulaires */}
            {photoFormOpen && (
                <article className="fill">
                    <h5>Inscription Séance Photo</h5>
                    <input placeholder="Votre nom" type="text" />
                    <input placeholder="Votre email" type="email" />
                    <button className="primary">S'inscrire</button>
                    <button onClick={() => setPhotoFormOpen(false)}>Fermer</button>
                </article>
            )}

            {noelFormOpen && (
                <article className="fill">
                    <h5>Inscription Grille de Noël</h5>
                    <input placeholder="Votre nom" type="text" />
                    <input placeholder="Votre email" type="email" />
                    <button className="primary">Participer</button>
                    <button onClick={() => setNoelFormOpen(false)}>Fermer</button>
                </article>
            )}

            {halloweenFormOpen && (
                <article className="fill">
                    <h5>Inscription Grille d'Halloween</h5>
                    <input placeholder="Votre nom" type="text" />
                    <input placeholder="Votre email" type="email" />
                    <button className="primary">Participer</button>
                    <button onClick={() => setHalloweenFormOpen(false)}>Fermer</button>
                </article>
            )}
        </div>
    )
}
