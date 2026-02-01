/**
 * Componente MediaCard
 * 
 * Exibe um item de mídia (imagem ou vídeo) no catálogo
 */

import React, { useState } from 'react';
import { FileImage, FileVideo, Calendar, MapPin, Tag, CheckCircle } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  media: MediaItem;
  onClick: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  media, 
  onClick, 
  isSelected = false,
  onSelect 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Entrada (Bruto)': 'bg-yellow-500/20 text-yellow-400',
      'Catalogado': 'bg-blue-500/20 text-blue-400',
      'Em produção': 'bg-orange-500/20 text-orange-400',
      'Publicado': 'bg-green-500/20 text-green-400',
      'Arquivado': 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-rc-gold/20 text-rc-gold';
  };

  return (
    <div
      className={`group relative bg-rc-green/20 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-rc-gold ring-2 ring-rc-gold/50' 
          : 'border-rc-gold/20 hover:border-rc-gold/50 hover:shadow-lg hover:shadow-rc-gold/10'
        }`}
      onClick={onClick}
    >
      {/* Imagem/Vídeo */}
      <div className="aspect-[4/3] bg-rc-dark relative overflow-hidden">
        {/* Placeholder enquanto carrega */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-rc-gold/30 border-t-rc-gold rounded-full animate-spin" />
          </div>
        )}
        
        {/* Ícone de erro */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-rc-cream/40">
            {media.tipo === 'video' ? (
              <FileVideo className="w-12 h-12 mb-2" />
            ) : (
              <FileImage className="w-12 h-12 mb-2" />
            )}
            <span className="text-xs">Preview indisponível</span>
          </div>
        )}
        
        {/* Imagem */}
        {media.tipo === 'imagem' && (
          <img
            src={media.thumbnailUrl}
            alt={media.fileName}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Vídeo - ícone */}
        {media.tipo === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-rc-gold/80 flex items-center justify-center
                          group-hover:bg-rc-gold transition-colors">
              <FileVideo className="w-8 h-8 text-rc-dark" />
            </div>
          </div>
        )}

        {/* Badge de tipo */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(media.status)}`}>
            {media.status}
          </span>
        </div>

        {/* Checkbox de seleção */}
        {onSelect && (
          <div 
            className="absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
              ${isSelected 
                ? 'bg-rc-gold border-rc-gold' 
                : 'border-rc-cream/50 bg-rc-dark/50 hover:border-rc-gold'
              }`}
            >
              {isSelected && <CheckCircle className="w-4 h-4 text-rc-dark" />}
            </div>
          </div>
        )}

        {/* Overlay com informações no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-rc-dark/90 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      flex flex-col justify-end p-3">
          <p className="text-xs text-rc-cream/80 truncate">{media.fileName}</p>
          <p className="text-xs text-rc-cream/60">{formatSize(media.size)}</p>
        </div>
      </div>

      {/* Informações */}
      <div className="p-3 space-y-2">
        {/* Área e Tema */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-rc-gold flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-rc-cream truncate">
              {media.area}
            </p>
            {media.nucleo && (
              <p className="text-xs text-rc-cream/60 truncate">
                {media.nucleo}
              </p>
            )}
          </div>
        </div>

        {/* Tema */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-rc-gold flex-shrink-0" />
          <p className="text-sm text-rc-cream/80 truncate">
            {media.tema}
          </p>
        </div>

        {/* Data */}
        <div className="flex items-center gap-2 text-xs text-rc-cream/50">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(media.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
