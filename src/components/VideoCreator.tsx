import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Video, Clock, Maximize2, Tag, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface VideoCreatorProps {
  onGenerate: (params: {
    prompt: string;
    seconds: string;
    size: string;
    model: string;
    category: string;
  }) => void;
}

const VideoCreator = ({ onGenerate }: VideoCreatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2");
  const [seconds, setSeconds] = useState("4");
  const [size, setSize] = useState("1280x720");
  const [category, setCategory] = useState("");

  const getSizeOptions = () => {
    if (model === "sora-2-pro") {
      return ["1280x720", "720x1280", "1024x1792", "1792x1024"];
    }
    return ["1280x720", "720x1280"];
  };

  const calculateCost = () => {
    const duration = parseInt(seconds);
    let pricePerSecond = 0;

    if (model === "sora-2") {
      pricePerSecond = 0.10;
    } else if (model === "sora-2-pro") {
      if (size === "1280x720" || size === "720x1280") {
        pricePerSecond = 0.30;
      } else if (size === "1792x1024" || size === "1024x1792") {
        pricePerSecond = 0.50;
      }
    }

    return (duration * pricePerSecond).toFixed(2);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Por favor, describe el video que quieres crear");
      return;
    }
    
    if (!category.trim()) {
      toast.error("Por favor, selecciona una categoría");
      return;
    }
    
    onGenerate({ prompt, seconds, size, model, category });
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              <Video className="w-3 h-3" />
              Modelo
            </Label>
            <Select value={model} onValueChange={(val) => {
              setModel(val);
              // Reset size when model changes
              setSize("1280x720");
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
            <Label htmlFor="seconds" className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Duración
            </Label>
            <Select value={seconds} onValueChange={setSeconds}>
              <SelectTrigger id="seconds" className="bg-secondary/50">
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
            <Label htmlFor="size" className="flex items-center gap-2">
              <Maximize2 className="w-3 h-3" />
              Resolución
            </Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger id="size" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getSizeOptions().map((res) => (
                  <SelectItem key={res} value={res}>{res}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="w-3 h-3" />
              Categoría
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-secondary/50">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naturaleza">Naturaleza</SelectItem>
                <SelectItem value="tecnologia">Tecnología</SelectItem>
                <SelectItem value="personas">Personas</SelectItem>
                <SelectItem value="animales">Animales</SelectItem>
                <SelectItem value="arquitectura">Arquitectura</SelectItem>
                <SelectItem value="abstracto">Abstracto</SelectItem>
                <SelectItem value="ciencia-ficcion">Ciencia Ficción</SelectItem>
                <SelectItem value="deportes">Deportes</SelectItem>
                <SelectItem value="comida">Comida</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Costo estimado:</span>
            </div>
            <span className="text-lg font-bold text-primary">${calculateCost()} USD</span>
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
