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
            <div
                className="row vertical max"
                style={{
                    height: '100%',
                    backgroundImage: 'url(/family.png)',
                    backgroundSize: '200px',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="center max">
                    <h4>Bienvenue sur le site de l'APIC Sentelette !</h4>
                    <p>
                        L'association des parents d'élèves de Sains-en-Amienois,
                        Saint-Fuscien et Estrées-sur-Noye.
                    </p>
                    {latestGallery && (
                        <GalleryCard
                            className=""
                            gallery={latestGallery}
                            onClick={() =>
                                navigate(`/gallery/${latestGallery.id}`)
                            }
                        ></GalleryCard>
                    )}
                    <div className="absolute row bottom right">
                        <a
                            className="link"
                            href="https://www.facebook.com/rpisentelette"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img
                                src="/social/facebook.png"
                                alt="Facebook"
                                className="tiny"
                            />
                        </a>
                        <a
                            className="link"
                            href="https://chat.whatsapp.com/Jcz7TJyL6RiDuoaEbKqRPr"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img
                                src="/social/whatsapp.png"
                                alt="Whatsapp"
                                className="tiny"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};
