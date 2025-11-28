

export const NotFound = () => {
    return (
        <>
            <div
                className="row vertical max"
                style={{
                    height: '100%',
                    backgroundImage: 'url(/undraw_donut-love_5r3x.svg)',
                    backgroundSize: '400px',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="center top-margin padding">
                    <h4>Page inconnue</h4>
                    <p>La page que vous recherchez n'existe pas.</p>
                </div>
            </div>
        </>
    );
}