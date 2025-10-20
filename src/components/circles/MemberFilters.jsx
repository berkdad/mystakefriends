import React from 'react';
import { Filter, X } from 'lucide-react';

export default function MemberFilters({ filters, onFilterChange }) {
  const updateFilter = (key, value) => {
    onFilterChange(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    onFilterChange({
      ageMin: 0,
      ageMax: 120,
      hasChildren: 'all',
      maritalStatus: 'all',
      hasEmail: 'all',
      hasLoggedIn: 'all',
      ethnicity: 'all',
      sortBy: 'name'
    });
  };

  const hasActiveFilters =
    filters.ageMin !== 0 ||
    filters.ageMax !== 120 ||
    filters.hasChildren !== 'all' ||
    filters.maritalStatus !== 'all' ||
    filters.hasEmail !== 'all' ||
    filters.hasLoggedIn !== 'all' ||
    filters.ethnicity !== 'all';

  return (
    <div className="border-b border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="name">Name</option>
          <option value="age">Age</option>
        </select>
      </div>

      {/* Age Range */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Age Between
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.ageMin}
            onChange={(e) => updateFilter('ageMin', parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            min="0"
            max="120"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="number"
            value={filters.ageMax}
            onChange={(e) => updateFilter('ageMax', parseInt(e.target.value) || 120)}
            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            min="0"
            max="120"
          />
        </div>
      </div>

      {/* Marital Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Marital Status
        </label>
        <select
          value={filters.maritalStatus}
          onChange={(e) => updateFilter('maritalStatus', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="widowed">Widowed</option>
          <option value="divorced">Divorced</option>
        </select>
      </div>

      {/* Ethnicity */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Cultural Background
        </label>
        <select
          value={filters.ethnicity}
          onChange={(e) => updateFilter('ethnicity', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="all">All</option>
          {/* Add common options - customize these based on your needs */}
          <option value="asian">Asian</option>
          <option value="black">Black/African American</option>
          <option value="hispanic">Hispanic/Latino</option>
          <option value="white">White/Caucasian</option>
          <option value="pacific islander">Pacific Islander</option>
          <option value="native american">Native American</option>
          <option value="middle eastern">Middle Eastern</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Has Children */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Has Children
        </label>
        <select
          value={filters.hasChildren}
          onChange={(e) => updateFilter('hasChildren', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      {/* Has Email */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Has Email
        </label>
        <select
          value={filters.hasEmail}
          onChange={(e) => updateFilter('hasEmail', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      {/* Has Logged In */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Account Status
        </label>
        <select
          value={filters.hasLoggedIn}
          onChange={(e) => updateFilter('hasLoggedIn', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="yes">Active</option>
          <option value="no">Pending</option>
        </select>
      </div>
    </div>
  );
}