import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, CountryInfo } from '../src/auth';
import { ChevronDown, Search } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountry: CountryInfo;
  onSelect: (country: CountryInfo) => void;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-[#121217] border border-slate-800 hover:border-[#ff5500]/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-[#ff5500] transition-colors whitespace-nowrap shrink-0"
      >
        <span className="text-base" role="img" aria-label={selectedCountry.name}>
          {selectedCountry.flag}
        </span>
        <span className="font-mono text-xs text-orange-400 font-semibold">{selectedCountry.dialCode}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-72 bg-[#0e0e13] border border-slate-800 rounded-xl shadow-2xl p-2 max-h-72 flex flex-col">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar país o prefijo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#171720] border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#ff5500]"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto space-y-0.5 divide-y divide-slate-800/40">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No se encontraron países</div>
            ) : (
              filteredCountries.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onSelect(country);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-lg text-xs transition-colors ${
                    country.code === selectedCountry.code
                      ? 'bg-[#ff5500]/15 text-orange-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{country.flag}</span>
                    <span className="truncate max-w-[150px]">{country.name}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 font-semibold">{country.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
