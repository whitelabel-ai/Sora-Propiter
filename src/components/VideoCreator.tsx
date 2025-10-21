import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Video, Clock, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface VideoCreatorProps {
  onGenerate: (params: {
    prompt: string;
    duration: string;
    resolution: string;
    style: string;
    model: string;
  }) => void;
}

const VideoCreator = ({ onGenerate }: VideoCreatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2");
  const [duration, setDuration] = useState("4");
  const [resolution, setResolution] = useState("1280x720");
  const [style, setStyle] = useState("realistic");

  const getResolutionOptions = () => {
    if (model === "sora-2-pro") {
      return ["1280x720", "720x1280", "1024x1792", "1792x1024"];
    }
    return ["1280x720", "720x1280"];
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Por favor, describe el video que quieres crear");
      return;
    }
    
    onGenerate({ prompt, duration, resolution, style, model });
    toast.success("Generando tu video...");
  };

  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center">
          <Video className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Crear Video</h2>
          <p className="text-sm text-muted-foreground">Describe tu visión en palabras</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Descripción del video</Label>
          <Textarea
            id="prompt"
            placeholder="Ej: Un astronauta caminando en la luna al atardecer, cámara cinematográfica, 4k..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="resize-none bg-secondary/50 border-border/50 focus:border-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            {prompt.length} / 1000 caracteres
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              <Video className="w-3 h-3" />
              Modelo
            </Label>
            <Select value={model} onValueChange={(val) => {
              setModel(val);
              // Reset resolution when model changes
              setResolution("1280x720");
            }}>
              <SelectTrigger id="model" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sora-2">Sora 2</SelectItem>
                <SelectItem value="sora-2-pro">Sora 2 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Duración
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 segundos</SelectItem>
                <SelectItem value="8">8 segundos</SelectItem>
                <SelectItem value="12">12 segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution" className="flex items-center gap-2">
              <Maximize2 className="w-3 h-3" />
              Resolución
            </Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger id="resolution" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getResolutionOptions().map((res) => (
                  <SelectItem key={res} value={res}>{res}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style" className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Estilo
            </Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="style" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realista</SelectItem>
                <SelectItem value="cinematic">Cinematográfico</SelectItem>
                <SelectItem value="animated">Animado</SelectItem>
                <SelectItem value="artistic">Artístico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate}
          variant="gradient"
          size="lg"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generar Video con {model === "sora-2-pro" ? "Sora 2 Pro" : "Sora 2"}
        </Button>
      </div>
    </div>
  );
};

export default VideoCreator;
