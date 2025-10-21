import { Film } from "lucide-react";
import VideoCard from "./VideoCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Video {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  createdAt: string;
  category: string;
}

interface VideoGalleryProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

const VideoGallery = ({ videos, onVideoClick }: VideoGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];
  const filteredVideos = selectedCategory === "all" 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tus Videos</h2>
            <p className="text-sm text-muted-foreground">{filteredVideos.length} videos generados</p>
          </div>
        </div>
        
        {videos.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
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
        )}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedCategory === "all" 
              ? "Aún no has generado ningún video"
              : `No hay videos en la categoría "${selectedCategory}"`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              {...video}
              onClick={() => onVideoClick(video)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGallery;
