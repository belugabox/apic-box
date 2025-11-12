import { Link, useLocation } from 'react-router';

export const Navigation = () => {
    const location = useLocation();
    const page = location.pathname;

    return (
        <nav className="">
            <Link to="/" className={page === '/' ? 'active' : ''}>
                <div className="shape sunny">
                    <i>potted_plant</i>
                </div>
                <div className="left-align left-margin">
                    <h6>APIC Sentelette</h6>
                </div>
            </Link>
            <div className="max center-align"></div>
            <nav className="">
                <Link to="/" className={page === '/' ? 'active' : ''}>
                    <i>home</i>
                </Link>
                <Link
                    to="/gallery"
                    className={page.startsWith('/gallery') ? 'active' : ''}
                >
                    <i>photo</i>
                </Link>
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
