import { Link, useLocation } from 'react-router';

export const Navigation = () => {
    const location = useLocation();
    const page = location.pathname;

    return (
        <nav
            className="center"
            style={{
                maxWidth: '1000px',
            }}
        >
            <Link to="/" className={page === '/' ? 'active' : ''}>
                <div>
                    <img
                        src="/logo_title.png"
                        alt="APIC Logo"
                        style={{ height: '3rem' }}
                    />
                </div>
            </Link>
            <div className="max center-align"></div>
            <nav className="secondary-text">
                {/*<Link
                    to="/gallery"
                    className={page.startsWith('/gallery') ? 'active' : ''}
                >
                    <i>photo</i>
                </Link>*/}
                <Link
                    to="/admin"
                    className={page.startsWith('/admin') ? 'active' : ''}
                >
                    <i className="">admin_panel_settings</i>
                </Link>
            </nav>
        </nav>
    );
};
