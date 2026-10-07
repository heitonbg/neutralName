import { makeAutoObservable } from 'mobx';

export class FiltersStore {
  searchQuery = '';
  quickFilter = null;
  mapTimeFilter = 'all';
  filters = null;
  sortBy;
  likedIds;
  root;

  constructor(root, { sortBy, likedIds }) {
    this.root = root;
    this.sortBy = sortBy;
    this.likedIds = likedIds;
    makeAutoObservable(this, { root: false });
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown FiltersStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }
}
