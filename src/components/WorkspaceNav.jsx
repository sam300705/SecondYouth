import { createElement } from 'react';
import { BookHeart, Eye, HeartHandshake, Home, MapPin, Pill, Settings, UsersRound } from 'lucide-react';

const links = [
  ['home', 'Home', Home, true],
  ['medicines', 'Medicine', Pill, true],
  ['contacts', 'Family', UsersRound],
  ['safety', 'Safety', MapPin, true],
  ['vision', 'Safety scanner', Eye],
  ['legacy', 'Legacy vault', BookHeart],
  ['care', 'Care sharing', HeartHandshake],
  ['settings', 'Settings', Settings, true],
];

export default function WorkspaceNav({ route, onNavigate }) {
  return (
    <nav className="workspace-nav bottom-nav" aria-label="Primary navigation">
      <button type="button" className="workspace-brand" onClick={() => onNavigate('home')} aria-label="SecondYouth home">
        <img src="/icon.svg" alt="" width="38" height="38" />
        <span>SecondYouth</span>
      </button>
      <div className="workspace-links">
        {links.map(([path, label, Icon, mobile]) => (
          <button
            key={path}
            type="button"
            className={`workspace-link ${route === path ? 'active' : ''} ${mobile ? '' : 'desktop-link'}`}
            aria-current={route === path ? 'page' : undefined}
            onClick={() => onNavigate(path)}
          >
            {createElement(Icon, { size: 21 })} <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
