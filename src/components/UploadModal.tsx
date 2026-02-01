/**
 * Componente de Upload Modal
 * 
 * Permite upload de arquivos com metadados completos
 * Faz upload direto para Backblaze B2
 */

import React, { useState, useCallback } from 'react';
import { X, Upload, FileImage, FileVideo, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getPresignedUrl, uploadToB2, confirmUpload } from '../services/api';
import { 
  AREAS, 
  NUCLEOS_PECUARIA, 
  NUCLEOS_AGRO, 
  TEMAS, 
  STATUS, 
  PONTOS, 
  TIPOS_PROJETO, 
  FUNCOES_HISTORICAS,
  UploadMetadata 
} from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [metadata, setMetadata] = useState<UploadMetadata>({
    area: '',
    nucleo: '',
    tema: '',
    status: 'Entrada (Bruto)',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Handler de drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Adiciona arquivos
  const addFiles = (newFiles: File[]) => {
    const filesWithPreview: FileWithPreview[] = newFiles.map((file) => {
      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : '';
      
      return {
        file,
        id: Math.random().toString(36).substring(7),
        preview,
        progress: 0,
        status: 'pending',
      };
    });
    
    setFiles((prev) => [...prev, ...filesWithPreview]);
  };

  // Remove arquivo
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Formata tamanho
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Realiza upload
  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!metadata.area || !metadata.tema) {
      alert('Por favor, preencha Área e Tema');
      return;
    }

    setIsUploading(true);
    setCurrentFileIndex(0);

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      setCurrentFileIndex(i);

      try {
        // Atualiza status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'uploading' } : f
          )
        );

        // 1. Pede URL de upload
        const uploadData = await getPresignedUrl(
          fileItem.file.name,
          fileItem.file.type,
          fileItem.file.size,
          metadata
        );

        // 2. Faz upload direto para B2
        await uploadToB2(uploadData.presignedUrl, fileItem.file, uploadData.headers);

        // 3. Confirma upload no backend
        await confirmUpload(uploadData.filePath, {
          ...metadata,
          size: fileItem.file.size,
          contentType: fileItem.file.type,
        });

        // Sucesso
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      } catch (error: any) {
        console.error('Erro no upload:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    
    // Notifica conclusão
    const successCount = files.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      onUploadComplete();
    }
  };

  // Fecha e limpa
  const handleClose = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setIsUploading(false);
    setCurrentFileIndex(0);
    onClose();
  };

  if (!isOpen) return null;

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-rc-dark border border-rc-gold/30 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-rc-gold/20">
          <div>
            <h2 className="text-xl font-serif font-semibold text-rc-gold">
              Upload de Arquivos
            </h2>
            <p className="text-sm text-rc-cream/60 mt-1">
              {files.length} arquivo(s) selecionado(s)
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-rc-gold/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-rc-cream" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Drop Zone */}
          {!isUploading && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-rc-gold/30 rounded-xl p-8 text-center
                         hover:border-rc-gold/60 hover:bg-rc-gold/5 transition-all cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 text-rc-gold/60 mx-auto mb-4" />
              <p className="text-rc-cream font-medium">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-rc-cream/50 mt-2">
                Imagens (JPG, PNG, GIF) e Vídeos (MP4, MOV)
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
            </div>
          )}

          {/* Metadados */}
          {!isUploading && files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-rc-green/20 rounded-xl">
              <h3 className="col-span-full text-sm font-medium text-rc-gold mb-2">
                Metadados (aplicados a todos os arquivos)
              </h3>

              {/* Área */}
              <div>
                <label className="label">Área / Fazenda *</label>
                <select
                  value={metadata.area}
                  onChange={(e) => setMetadata({ ...metadata, area: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Núcleo */}
              <div>
                <label className="label">Núcleo</label>
                <select
                  value={metadata.nucleo}
                  onChange={(e) => setMetadata({ ...metadata, nucleo: e.target.value })}
                  className="select"
                >
                  <option value="">Selecione...</option>
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
                <label className="label">Tema Principal *</label>
                <select
                  value={metadata.tema}
                  onChange={(e) => setMetadata({ ...metadata, tema: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Selecione...</option>
                  {TEMAS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="label">Status</label>
                <select
                  value={metadata.status}
                  onChange={(e) => setMetadata({ ...metadata, status: e.target.value })}
                  className="select"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Ponto */}
              <div>
                <label className="label">Ponto</label>
                <select
                  value={metadata.ponto}
                  onChange={(e) => setMetadata({ ...metadata, ponto: e.target.value })}
                  className="select"
                >
                  <option value="">Selecione...</option>
                  {PONTOS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Projeto */}
              <div>
                <label className="label">Tipo de Projeto</label>
                <select
                  value={metadata.tipoProjeto}
                  onChange={(e) => setMetadata({ ...metadata, tipoProjeto: e.target.value })}
                  className="select"
                >
                  <option value="">Selecione...</option>
                  {TIPOS_PROJETO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Função Histórica */}
              <div>
                <label className="label">Função Histórica</label>
                <select
                  value={metadata.funcaoHistorica}
                  onChange={(e) => setMetadata({ ...metadata, funcaoHistorica: e.target.value })}
                  className="select"
                >
                  <option value="">Selecione...</option>
                  {FUNCOES_HISTORICAS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-rc-cream/80">
                Arquivos ({successCount > 0 && `${successCount} concluídos, `}
                {errorCount > 0 && `${errorCount} com erro, `}
                {files.length} total)
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-auto scrollbar-thin">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      file.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : file.status === 'error'
                        ? 'bg-red-500/10 border-red-500/30'
                        : file.status === 'uploading'
                        ? 'bg-rc-gold/10 border-rc-gold/30'
                        : 'bg-rc-green/20 border-rc-gold/20'
                    }`}
                  >
                    {/* Preview */}
                    <div className="w-12 h-12 rounded-lg bg-rc-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : file.file.type.startsWith('video/') ? (
                        <FileVideo className="w-6 h-6 text-rc-gold" />
                      ) : (
                        <FileImage className="w-6 h-6 text-rc-gold" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rc-cream truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-rc-cream/50">
                        {formatSize(file.file.size)}
                      </p>
                      
                      {/* Progresso */}
                      {file.status === 'uploading' && (
                        <div className="mt-1">
                          <div className="h-1 bg-rc-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rc-gold transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-rc-gold mt-1">
                            Enviando... {file.progress}%
                          </p>
                        </div>
                      )}
                      
                      {/* Status */}
                      {file.status === 'success' && (
                        <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> Concluído
                        </p>
                      )}
                      {file.status === 'error' && (
                        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {file.error}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    {!isUploading && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}

                    {/* Indicador de upload atual */}
                    {isUploading && index === currentFileIndex && (
                      <Loader2 className="w-5 h-5 text-rc-gold animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-rc-gold/20">
          <div className="text-sm text-rc-cream/60">
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando arquivo {currentFileIndex + 1} de {files.length}...
              </span>
            ) : successCount > 0 ? (
              <span className="text-green-400">
                {successCount} arquivo(s) enviado(s) com sucesso!
              </span>
            ) : null}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="btn-outline"
            >
              {successCount > 0 ? 'Fechar' : 'Cancelar'}
            </button>
            
            {!isUploading && successCount === 0 && files.length > 0 && (
              <button
                onClick={handleUpload}
                disabled={!metadata.area || !metadata.tema}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Enviar {files.length} arquivo(s)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
