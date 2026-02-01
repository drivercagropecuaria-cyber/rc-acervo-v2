/**
 * App Principal - RC Acervo v2
 * 
 * Sistema completo de biblioteca de fotos e vídeos da RC Agropecuária
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Grid, 
  Upload, 
  Settings, 
  LogOut,
  Menu,
  X,
  Server,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MediaGrid from './components/MediaGrid';
import UploadModal from './components/UploadModal';
import { 
  checkHealth, 
  listMedias, 
  listFolders, 
  getEstatisticas 
} from './services/api';
import { MediaItem, Folder, Estatisticas } from './types';

// Tipos de view
type ViewType = 'dashboard' | 'catalogo' | 'configuracoes';

function App() {
  // Estados
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  // Dados
  const [medias, setMedias] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  
  // Loading states
  const [isLoadingMedias, setIsLoadingMedias] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Carrega dados iniciais
  const loadData = useCallback(async () => {
    setIsLoadingMedias(true);
    setIsLoadingStats(true);
    
    try {
      // Verifica saúde do servidor
      const isHealthy = await checkHealth();
      setServerStatus(isHealthy ? 'online' : 'offline');
      
      if (isHealthy) {
        // Carrega mídias, pastas e estatísticas em paralelo
        const [mediasData, foldersData, statsData] = await Promise.all([
          listMedias(),
          listFolders(),
          getEstatisticas(),
        ]);
        
        setMedias(mediasData);
        setFolders(foldersData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setServerStatus('offline');
    } finally {
      setIsLoadingMedias(false);
      setIsLoadingStats(false);
    }
  }, []);

  // Carrega dados na montagem
  useEffect(() => {
    loadData();
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handler de upload completo
  const handleUploadComplete = () => {
    // Recarrega dados após upload
    setTimeout(loadData, 1000);
  };

  // Handler de clique em mídia
  const handleMediaClick = (media: MediaItem) => {
    // Abre visualização (pode ser expandido)
    window.open(media.url, '_blank');
  };

  // Itens do menu
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalogo' as ViewType, label: 'Catálogo', icon: Grid },
  ];

  return (
    <div className="min-h-screen bg-rc-dark flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-rc-green/30 border-r border-rc-gold/20
                   transform transition-transform duration-300 lg:transform-none
                   ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-rc-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rc-gold flex items-center justify-center">
              <Grid className="w-5 h-5 text-rc-dark" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-rc-gold">RC Acervo</h1>
              <p className="text-xs text-rc-cream/60">Biblioteca de Fotos</p>
            </div>
          </div>
        </div>

        {/* Status do servidor */}
        <div className="px-4 py-3 border-b border-rc-gold/20">
          <div className={`flex items-center gap-2 text-sm ${
            serverStatus === 'online' ? 'text-green-400' :
            serverStatus === 'offline' ? 'text-red-400' :
            'text-yellow-400'
          }`}>
            {serverStatus === 'online' ? <CheckCircle className="w-4 h-4" /> :
             serverStatus === 'offline' ? <AlertCircle className="w-4 h-4" /> :
             <Server className="w-4 h-4 animate-pulse" />}
            <span>
              {serverStatus === 'online' ? 'Servidor Online' :
               serverStatus === 'offline' ? 'Servidor Offline' :
               'Verificando...'}
            </span>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${currentView === item.id 
                  ? 'bg-rc-gold text-rc-dark font-medium' 
                  : 'text-rc-cream hover:bg-rc-gold/10'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Botão de Upload */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={serverStatus !== 'online'}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Novo Upload
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-rc-gold/20">
          <div className="flex items-center justify-between text-sm text-rc-cream/50">
            <span>v2.0.0</span>
            <button className="flex items-center gap-2 hover:text-rc-gold transition-colors">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-rc-green/20 border-b border-rc-gold/20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-rc-gold/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-rc-cream" />
            </button>
            
            <h2 className="text-lg font-medium text-rc-cream">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'catalogo' && 'Catálogo de Mídias'}
              {currentView === 'configuracoes' && 'Configurações'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de refresh */}
            <button
              onClick={loadData}
              disabled={isLoadingMedias}
              className="p-2 hover:bg-rc-gold/10 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <Settings className={`w-5 h-5 text-rc-cream ${isLoadingMedias ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {serverStatus === 'offline' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-400">Servidor Offline</h3>
                  <p className="text-sm text-red-400/80 mt-1">
                    Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
                  </p>
                  <button
                    onClick={loadData}
                    className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Tentar reconectar
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <Dashboard stats={stats} isLoading={isLoadingStats} />
          )}

          {currentView === 'catalogo' && (
            <MediaGrid
              medias={medias}
              folders={folders}
              isLoading={isLoadingMedias}
              onRefresh={loadData}
              onMediaClick={handleMediaClick}
            />
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;
