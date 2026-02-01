/**
 * Componente Dashboard
 * 
 * Exibe estatísticas e visão geral do acervo
 */

import React from 'react';
import { 
  Image, 
  Video, 
  Folder, 
  TrendingUp, 
  MapPin, 
  Tag,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react';
import { Estatisticas } from '../types';

interface DashboardProps {
  stats: Estatisticas | null;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, isLoading }) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  // Cards principais
  const mainCards = [
    {
      title: 'Total de Itens',
      value: stats?.totalItens || 0,
      icon: Folder,
      color: 'text-rc-gold',
      bgColor: 'bg-rc-gold/10',
    },
    {
      title: 'Imagens',
      value: stats?.totalImagens || 0,
      icon: Image,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Vídeos',
      value: stats?.totalVideos || 0,
      icon: Video,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  // Status cards
  const statusCards = stats?.porStatus ? Object.entries(stats.porStatus).map(([status, count]) => {
    const icons: Record<string, typeof Clock> = {
      'Entrada (Bruto)': Clock,
      'Catalogado': CheckCircle,
      'Em produção': TrendingUp,
      'Publicado': Image,
      'Arquivado': Archive,
    };
    const colors: Record<string, string> = {
      'Entrada (Bruto)': 'text-yellow-400 bg-yellow-400/10',
      'Catalogado': 'text-blue-400 bg-blue-400/10',
      'Em produção': 'text-orange-400 bg-orange-400/10',
      'Publicado': 'text-green-400 bg-green-400/10',
      'Arquivado': 'text-gray-400 bg-gray-400/10',
    };
    const Icon = icons[status] || Folder;
    const colorClass = colors[status] || 'text-rc-gold bg-rc-gold/10';
    
    return { status, count, Icon, colorClass };
  }) : [];

  // Top áreas
  const topAreas = stats?.porArea 
    ? Object.entries(stats.porArea)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  // Top temas
  const topTemas = stats?.porTema
    ? Object.entries(stats.porTema)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mainCards.map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-rc-cream/60">{card.title}</p>
                <p className="text-3xl font-bold text-rc-cream mt-1">
                  {formatNumber(card.value)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por Status */}
        <div className="card">
          <h3 className="text-lg font-serif font-semibold text-rc-gold mb-4">
            Por Status
          </h3>
          {statusCards.length === 0 ? (
            <p className="text-rc-cream/60 text-center py-8">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {statusCards.map(({ status, count, Icon, colorClass }) => (
                <div key={status} className="flex items-center justify-between p-3 bg-rc-dark/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colorClass.split(' ')[1]} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                    </div>
                    <span className="text-rc-cream">{status}</span>
                  </div>
                  <span className="text-lg font-semibold text-rc-gold">
                    {formatNumber(count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Áreas */}
        <div className="card">
          <h3 className="text-lg font-serif font-semibold text-rc-gold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top Áreas
          </h3>
          {topAreas.length === 0 ? (
            <p className="text-rc-cream/60 text-center py-8">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {topAreas.map(([area, count], index) => (
                <div key={area} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rc-gold/20 text-rc-gold text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-rc-cream text-sm">{area}</span>
                      <span className="text-rc-gold font-medium">{formatNumber(count)}</span>
                    </div>
                    <div className="h-2 bg-rc-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rc-gold rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(count / (topAreas[0]?.[1] || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Temas */}
      <div className="card">
        <h3 className="text-lg font-serif font-semibold text-rc-gold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Top Temas
        </h3>
        {topTemas.length === 0 ? (
          <p className="text-rc-cream/60 text-center py-8">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topTemas.map(([tema, count]) => (
              <div
                key={tema}
                className="flex items-center gap-2 px-4 py-2 bg-rc-dark/50 rounded-full
                         border border-rc-gold/20 hover:border-rc-gold/50 transition-colors"
              >
                <span className="text-rc-cream">{tema}</span>
                <span className="text-rc-gold font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
