import { Film, Loader2, RefreshCw } from "lucide-react";
import VideoCard from "./VideoCard";
import UpgradeVideoModal from "./UpgradeVideoModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useVideos } from "@/hooks/use-videos";
import { Video } from "@/types/database";
import { calculateUpgradeCost } from "@/lib/cost-utils";

interface VideoGalleryProps {
  onVideoClick?: (video: Video) => void;
  category?: string;
  autoRefresh?: boolean;
}

const VideoGallery = ({ onVideoClick, category: initialCategory, autoRefresh = true }: VideoGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedStatus, setSelectedStatus] = useState<Video['status'] | 'all'>('all');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [videoToUpgrade, setVideoToUpgrade] = useState<Video | null>(null);

  const { 
    videos, 
    loading, 
    error, 
    refetch,
    deleteVideo,
    deleting,
    retryVideo,
    retrying,
    upgradeVideo,
    upgrading 
  } = useVideos({ 
    category: selectedCategory === "all" ? undefined : selectedCategory,
    status: selectedStatus === "all" ? undefined : selectedStatus,
    autoRefresh 
  });

  const categories = ["all", ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];

  const handleUpgradeClick = (video: Video) => {
    setVideoToUpgrade(video);
    setUpgradeModalOpen(true);
  };

  const handleUpgradeConfirm = async () => {
    if (videoToUpgrade) {
      await upgradeVideo(videoToUpgrade);
      setUpgradeModalOpen(false);
      setVideoToUpgrade(null);
    }
  };
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'completed', label: 'Completados' },
    { value: 'processing', label: 'En proceso' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'failed', label: 'Fallidos' },
  ];

  if (error) {
    return (
      <div className="bg-card shadow-card rounded-xl p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-destructive">Error al cargar videos</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tus Videos</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Cargando..." : `${videos.length} videos`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-fade-in">
          {/* Filtro por categoría */}
          <div className="group">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 hover:border-primary/50 hover:shadow-sm group-hover:scale-[1.02]">
                <SelectValue placeholder="📂 Categoría" />
              </SelectTrigger>
              <SelectContent className="animate-fade-in">
                <SelectItem value="all">📁 Todas las categorías</SelectItem>
                {categories.filter(c => c !== "all" && c).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category?.charAt(0).toUpperCase() + category?.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por estado */}
          <div className="group">
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Video['status'] | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 hover:border-primary/50 hover:shadow-sm group-hover:scale-[1.02]">
                <SelectValue placeholder="🔄 Estado" />
              </SelectTrigger>
              <SelectContent className="animate-fade-in">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value === 'all' && '📋 '}
                    {option.value === 'completed' && '✅ '}
                    {option.value === 'processing' && '⚙️ '}
                    {option.value === 'pending' && '⏳ '}
                    {option.value === 'failed' && '❌ '}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            disabled={loading}
            className="w-full sm:w-auto transition-all duration-200 hover:scale-105 hover:shadow-md group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="hidden sm:inline">Actualizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                <span className="hidden sm:inline">Actualizar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <div className="py-16 text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 animate-ping"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">🎬 Cargando videos...</p>
            <p className="text-sm text-muted-foreground">Preparando tu galería de videos</p>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-secondary/30 to-primary/30 flex items-center justify-center mx-auto">
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              {selectedCategory === "all" && selectedStatus === "all"
                ? "🎥 ¡Comienza a crear!"
                : "🔍 Sin resultados"
              }
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {selectedCategory === "all" && selectedStatus === "all"
                ? "Aún no has generado ningún video. ¡Crea tu primer video con IA y dale vida a tus ideas!"
                : "No hay videos que coincidan con los filtros seleccionados. Prueba ajustando los criterios de búsqueda."
              }
            </p>
            {selectedCategory === "all" && selectedStatus === "all" && (
              <div className="pt-4">
                <Button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  ✨ Crear mi primer video
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <VideoCard
                video={video}
                onClick={() => onVideoClick?.(video)}
                onDelete={() => deleteVideo(video.id)}
                onUpgrade={() => handleUpgradeClick(video)}
                onRetry={() => retryVideo(video.id)}
                deleting={deleting}
                upgrading={upgrading}
                retrying={retrying}
              />
            </div>
          ))}
        </div>
      )}

      {videoToUpgrade && (
        <UpgradeVideoModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          onConfirm={handleUpgradeConfirm}
          cost={calculateUpgradeCost({
            duration: videoToUpgrade.duration,
            size: videoToUpgrade.size,
            prompt: videoToUpgrade.prompt,
            category: videoToUpgrade.category,
            style: videoToUpgrade.style || ''
          })}
          isUpgrading={upgrading}
          videoData={{
            prompt: videoToUpgrade.prompt,
            duration: videoToUpgrade.duration,
            size: videoToUpgrade.size,
            category: videoToUpgrade.category,
            style: videoToUpgrade.style || ''
          }}
        />
      )}
    </div>
  );
};

export default VideoGallery;
