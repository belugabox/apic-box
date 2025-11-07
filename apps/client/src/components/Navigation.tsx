import { Link, useLocation } from 'react-router'

export const Navigation = () => {
    const location = useLocation()
    const page = location.pathname

    return (
        <header>
            <nav>
                <div className="shape sunny"><i>potted_plant</i></div>
                <div className="left-align">
                    <Link to="/" className={page === '/' ? 'active' : ''}>
                        <h6>APIC Sentelette</h6>
                    </Link>
                </div>
                <div className="max center-align">
                </div>
                <nav className=''>
                    <Link to="/" className={page === '/' ? 'active' : ''}>
                        <i>home</i>
                    </Link>
                    <Link to="/actions" className={page === '/actions' ? 'active' : ''}>
                        <i>event</i>
                    </Link>
                    <Link to="/admin" className={page === '/admin' ? 'active' : ''}>
                        <i>admin_panel_settings</i>
                    </Link>
                </nav>
            </nav>
        </header>
    )
}
