import { Play, MoreVertical, Trash2, Clock, Loader2, CheckCircle, XCircle, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Video } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
  onDelete?: () => void;
  onUpgrade?: () => void;
  onRetry?: () => void;
  deleting?: boolean;
  upgrading?: boolean;
  retrying?: boolean;
}

const VideoCard = ({ 
  video,
  onClick,
  onDelete,
  onUpgrade,
  onRetry,
  deleting = false,
  upgrading = false,
  retrying = false
}: VideoCardProps) => {
  const getStatusIcon = () => {
    switch (video.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (video.status) {
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'Procesando';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return video.status;
    }
  };

  const isClickable = video.status === 'completed' && video.video_url;
  const thumbnailUrl = video.thumbnail_url || '/placeholder-video.jpg';
  const formattedDate = formatDistanceToNow(new Date(video.created_at), { 
    addSuffix: true, 
    locale: es 
  });
  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`group bg-card shadow-card rounded-lg overflow-hidden transition-smooth hover:shadow-glow ${
        isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
      }`}
    >
      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={video.prompt}
          className={`w-full h-full object-cover transition-smooth ${
            isClickable ? 'group-hover:scale-110' : ''
          }`}
        />
        
        {/* Overlay para videos no completados */}
        {!isClickable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              {getStatusIcon()}
              <p className="text-sm mt-2">{getStatusText()}</p>
            </div>
          </div>
        )}
        
        {/* Overlay de hover para videos completados */}
        {isClickable && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
              <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground ml-1" />
              </div>
            </div>
          </>
        )}
        
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2 flex gap-2">
          {video.duration && (
            <Badge variant="secondary" className="text-xs">
              {video.duration}s
            </Badge>
          )}
          {video.size && (
            <Badge variant="secondary" className="text-xs">
              {video.size}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2">{video.prompt}</p>
        {video.category && (
          <Badge variant="outline" className="text-xs">
            {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
          </Badge>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRetry && video.status === 'pending' && !video.openai_task_id && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  disabled={retrying}
                  className="text-blue-600 focus:text-blue-600"
                >
                  {retrying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Reintentar generación
                </DropdownMenuItem>
              )}
              {onUpgrade && video.status === 'completed' && video.model !== 'sora-2-pro' && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpgrade();
                  }}
                  disabled={upgrading}
                  className="text-primary focus:text-primary"
                >
                  {upgrading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Mejorar con Sora Pro
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={deleting}
                  className="text-red-600 focus:text-red-600"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
