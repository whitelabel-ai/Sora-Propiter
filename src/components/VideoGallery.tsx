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
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Filtro por categoría */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.filter(c => c !== "all" && c).map((category) => (
                <SelectItem key={category} value={category}>
                  {category?.charAt(0).toUpperCase() + category?.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por estado */}
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Video['status'] | 'all')}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botón de refrescar */}
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="icon"
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Cargando videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay videos</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCategory === "all" && selectedStatus === "all"
                ? "Aún no has generado ningún video"
                : "No hay videos que coincidan con los filtros seleccionados"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => onVideoClick?.(video)}
              onDelete={() => deleteVideo(video.id)}
              onUpgrade={() => handleUpgradeClick(video)}
              onRetry={() => retryVideo(video.id)}
              deleting={deleting}
              upgrading={upgrading}
              retrying={retrying}
            />
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
