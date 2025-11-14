import { useNavigate } from 'react-router';

import { GalleryCard } from '@/components/GalleryCard';
import { useGalleries } from '@/services/gallery';

export const Home = () => {
    const navigate = useNavigate();
    const [galleries] = useGalleries();

    const latestGallery =
        galleries && galleries.length > 0
            ? galleries.reduce((latest, current) =>
                  current.createdAt > latest.createdAt ? current : latest,
              )
            : undefined;

    return (
        <>
            <div className="row vertical max" style={{ height: '100%' }}>
                <div className="center max">
                    <h4>Bienvenue sur le site de l'APIC Sentelette !</h4>
                    <p>
                        L'association des parents d'élèves de Sains-en-Amienois,
                        Saint-Fuscien et Estrées-sur-Noye.
                    </p>
                    <div className="row">
                        <a
                            className="link"
                            href="https://www.facebook.com/rpisentelette"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Facebook
                        </a>
                        <a
                            className="link"
                            href="https://chat.whatsapp.com/Jcz7TJyL6RiDuoaEbKqRPr"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            WhatsApp
                        </a>
                    </div>
                    {latestGallery && (
                        <GalleryCard
                            className=""
                            gallery={latestGallery}
                            onClick={() =>
                                navigate(`/gallery/${latestGallery.id}`)
                            }
                        ></GalleryCard>
                    )}
                </div>
                <div className="center bottom">
                    <img
                        src="/family.png"
                        alt="Logo APIC"
                        style={{ width: '100%', maxWidth: '300px' }}
                    />
                </div>
            </div>
        </>
    );
};
