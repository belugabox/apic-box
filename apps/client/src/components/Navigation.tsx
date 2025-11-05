import { Link, useLocation } from 'react-router'

export const Navigation = () => {
    const location = useLocation()
    const page = location.pathname

    return (
        <header className="primary-container">
            <nav>
                <div className="max left-align">
                    <Link to="/" className={page === '/' ? 'active' : ''}>
                        <h6>APIC Box</h6>
                    </Link>
                </div>
                <nav className=''>
                    <Link to="/" className={page === '/' ? 'active' : ''}>
                        <i>home</i>
                    </Link>
                    <Link to="/events" className={page === '/events' ? 'active' : ''}>
                        <i>event</i>
                    </Link>
                    <Link to="/settings" className={page === '/settings' ? 'active' : ''}>
                        <i>settings</i>
                    </Link>
                </nav>
            </nav>
        </header>
    )
}
