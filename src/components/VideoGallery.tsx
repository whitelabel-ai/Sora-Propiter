import { Film } from "lucide-react";
import VideoCard from "./VideoCard";

interface Video {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  createdAt: string;
}

interface VideoGalleryProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

const VideoGallery = ({ videos, onVideoClick }: VideoGalleryProps) => {
  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Tus Videos</h2>
          <p className="text-sm text-muted-foreground">{videos.length} videos generados</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aún no has generado ningún video
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
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
