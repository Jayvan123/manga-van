import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <div className="container page not-found"><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you were looking for has wandered off-panel.</p><Link className="button button--primary" to="/">Return home</Link></div>
}

