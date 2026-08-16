import { NavLink } from 'react-router-dom'
import ProfileSwitcher from './ProfileSwitcher.jsx'
import SearchBox from './SearchBox.jsx'

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink className="wordmark" to="/" aria-label="MangaVAn home">
          Manga<span>VA</span>n
        </NavLink>
        <div className="site-header__nav-group">
          <nav aria-label="Primary navigation">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/browse">Browse</NavLink>
          </nav>
          <ProfileSwitcher />
        </div>
        <SearchBox />
      </div>
    </header>
  )
}
