import { Link, useLocation } from 'react-router';

export const Navigation = () => {
    const location = useLocation();
    const page = location.pathname;

    return (
        <nav className="">
            <Link to="/" className={page === '/' ? 'active' : ''}>
                <div>
                    <img
                        src="/logo.png"
                        alt="APIC Logo"
                        className="round large tiny-padding surface-bright"
                    />
                </div>
                <div className="left-align left-margin">
                    <h6 className="bold black-text">APIC Sentelette</h6>
                </div>
            </Link>
            <div className="max center-align"></div>
            <nav className="">
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
                    <i>admin_panel_settings</i>
                </Link>
            </nav>
        </nav>
    );
};
