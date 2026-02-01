/**
 * Componente MediaGrid
 * 
 * Exibe o grid de mídias com filtros e busca
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, RefreshCw, FolderOpen } from 'lucide-react';
import MediaCard from './MediaCard';
import { MediaItem, Folder, AREAS, NUCLEOS_PECUARIA, NUCLEOS_AGRO, TEMAS, STATUS } from '../types';

interface MediaGridProps {
  medias: MediaItem[];
  folders: Folder[];
  isLoading: boolean;
  onRefresh: () => void;
  onMediaClick: (media: MediaItem) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ 
  medias, 
  folders,
  isLoading, 
  onRefresh, 
  onMediaClick 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    area: '',
    nucleo: '',
    tema: '',
    status: '',
  });

  // Filtra mídias
  const filteredMedias = medias.filter((media) => {
    // Busca textual
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        media.fileName.toLowerCase().includes(query) ||
        media.area.toLowerCase().includes(query) ||
        media.tema.toLowerCase().includes(query) ||
        (media.nucleo && media.nucleo.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Filtros
    if (filters.area && media.area !== filters.area) return false;
    if (filters.nucleo && media.nucleo !== filters.nucleo) return false;
    if (filters.tema && media.tema !== filters.tema) return false;
    if (filters.status && media.status !== filters.status) return false;

    return true;
  });

  // Limpa filtros
  const clearFilters = () => {
    setFilters({ area: '', nucleo: '', tema: '', status: '' });
    setSearchQuery('');
  };

  // Contagem ativa
  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Busca */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rc-cream/50" />
          <input
            type="text"
            placeholder="Buscar por nome, área, tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Botão de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-outline flex items-center gap-2 ${showFilters ? 'bg-rc-gold/20' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-rc-gold text-rc-dark text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Botão de refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-outline p-2"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle view mode */}
          <div className="flex border border-rc-gold/30 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-rc-gold text-rc-dark' : 'text-rc-cream hover:bg-rc-gold/10'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-rc-gold text-rc-dark' : 'text-rc-cream hover:bg-rc-gold/10'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="bg-rc-green/20 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-rc-gold">Filtros Avançados</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-rc-cream/60 hover:text-rc-gold transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Área */}
            <div>
              <label className="label text-xs">Área</label>
              <select
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                className="select text-sm py-2"
              >
                <option value="">Todas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Núcleo */}
            <div>
              <label className="label text-xs">Núcleo</label>
              <select
                value={filters.nucleo}
                onChange={(e) => setFilters({ ...filters, nucleo: e.target.value })}
                className="select text-sm py-2"
              >
                <option value="">Todos</option>
                <optgroup label="Pecuária">
                  {NUCLEOS_PECUARIA.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
                <optgroup label="Agro">
                  {NUCLEOS_AGRO.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Tema */}
            <div>
              <label className="label text-xs">Tema</label>
              <select
                value={filters.tema}
                onChange={(e) => setFilters({ ...filters, tema: e.target.value })}
                className="select text-sm py-2"
              >
                <option value="">Todos</option>
                {TEMAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label text-xs">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="select text-sm py-2"
              >
                <option value="">Todos</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Resumo de pastas */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-rc-green/20 rounded-full
                       border border-rc-gold/20 text-sm"
            >
              <FolderOpen className="w-4 h-4 text-rc-gold" />
              <span className="text-rc-cream">{folder.name}</span>
              <span className="text-rc-gold font-medium">({folder.count || 0})</span>
            </div>
          ))}
        </div>
      )}

      {/* Resultados */}
      <div className="flex items-center justify-between text-sm text-rc-cream/60">
        <span>
          {isLoading ? 'Carregando...' : `${filteredMedias.length} arquivo(s) encontrado(s)`}
        </span>
        {activeFiltersCount > 0 && (
          <span className="text-rc-gold">
            Filtros ativos: {activeFiltersCount}
          </span>
        )}
      </div>

      {/* Grid de mídias */}
      {filteredMedias.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rc-green/20 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-rc-gold/50" />
          </div>
          <h3 className="text-lg font-medium text-rc-cream mb-2">
            Nenhum arquivo encontrado
          </h3>
          <p className="text-rc-cream/60 max-w-md mx-auto">
            {activeFiltersCount > 0 
              ? 'Tente ajustar os filtros ou fazer upload de novos arquivos.'
              : 'A biblioteca está vazia. Faça upload de arquivos para começar.'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
          : 'space-y-2'
        }>
          {filteredMedias.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              onClick={() => onMediaClick(media)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
