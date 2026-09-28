import React from 'react';
import Icon from './Icon';

const DesktopSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'feed', icon: 'home', label: 'Главная' },
    { id: 'create', icon: 'plus', label: 'Создать событие' },
    { id: 'my', icon: 'user', label: 'Мои события' },
    { id: 'favorites', icon: 'heart', label: 'Избранное' },
    { id: 'profile', icon: 'grid', label: 'Профиль' }
  ];

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Вместе" className="sidebar-logo-img" />
        <div className="sidebar-logo-text">
          <h2>Вместе</h2>
          <span className="sidebar-logo-team">события рядом</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="sidebar-icon"><Icon name={item.icon} size={20} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>© 2026 Вместе</p>
        <p className="sidebar-hint">События рядом с вами</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
