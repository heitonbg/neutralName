import React from 'react';

const SearchBar = ({ value, onChange, onOpenFilters }) => {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Что хотите поделать?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="filter-btn" onClick={onOpenFilters} aria-label="Фильтры">
        ⚙️
      </button>
    </div>
  );
};

export default SearchBar;