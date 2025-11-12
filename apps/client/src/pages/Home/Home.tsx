export const Home = () => {
    return (
        <div className="center-align">
            <h4>Bienvenue sur le site de l'APIC Sentelette !</h4>
            <p>
                L'association des parents d'élèves de Sains-en-Amienois,
                Saint-Fuscien et Estrées-sur-Noye.
            </p>
            <div>
                <a
                    className="link"
                    href="https://www.facebook.com/rpisentelette"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Facebook
                </a>
                {' | '}
                <a
                    className="link"
                    href="https://chat.whatsapp.com/Jcz7TJyL6RiDuoaEbKqRPr"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    WhatsApp
                </a>
            </div>
        </div>
    );
};
