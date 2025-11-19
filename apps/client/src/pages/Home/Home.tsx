import { useNavigate } from 'react-router';

import { GalleryCard } from '@/components/GalleryCard';
import { useLatestBlog } from '@/services/blog';
import { useLatestGallery } from '@/services/gallery';
import '@/style.css';

export const Home = () => {
    const navigate = useNavigate();
    const [latestGallery] = useLatestGallery();
    const [latestBlog] = useLatestBlog();

    return (
        <>
            <div
                className="row vertical max"
                style={{
                    height: '100%',
                    backgroundImage: 'url(/undraw_family_6gj8.svg)',
                    backgroundSize: '200px',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="center max">
                    {latestBlog && (
                        <div className="center top-margin padding">
                            <h4>{latestBlog.title}</h4>
                            <p>{latestBlog.content}</p>
                        </div>
                    )}
                    {latestGallery && (
                        <div
                            className="center top-margin"
                            style={{ maxWidth: '600px' }}
                        >
                            <GalleryCard
                                className=""
                                gallery={latestGallery}
                                onClick={() =>
                                    navigate(`/gallery/${latestGallery.id}`)
                                }
                            ></GalleryCard>
                        </div>
                    )}
                    <div className="absolute row bottom right">
                        <a
                            className="link social-link"
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
                            className="link social-link"
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
