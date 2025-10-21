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
    style: string;
  }) => void;
}

const VideoCreator = ({ onGenerate }: VideoCreatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2");
  const [seconds, setSeconds] = useState("4");
  const [size, setSize] = useState("1280x720");
  const [category, setCategory] = useState("");
  const [style, setStyle] = useState("cinematografico");

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
      pricePerSecond = 0.1;
    } else if (model === "sora-2-pro") {
      if (["1280x720", "720x1280"].includes(size)) {
        pricePerSecond = 0.3;
      } else {
        pricePerSecond = 0.5;
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

    onGenerate({ prompt, seconds, size, model, category, style });
    toast.success("Mejorando tu prompt y generando video...");
  };

  return (
    <div className="bg-gradient-to-b from-background to-secondary/30 border border-border/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md">
          <Video className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Crear nuevo video</h2>
          <p className="text-sm text-muted-foreground">Describe tu idea y deja que la IA haga el resto ✨</p>
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Descripción del video
        </Label>
        <Textarea
          id="prompt"
          placeholder="Ej: Un astronauta caminando en la luna al atardecer, cámara cinematográfica, 4K..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="resize-none border-border/50 bg-secondary/30 focus-visible:ring-primary/40 text-foreground placeholder:text-muted-foreground/70"
        />
        <p className="text-xs text-muted-foreground text-right">{prompt.length} / 1000 caracteres</p>
      </div>

      {/* Configuración básica */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Configuración básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Modelo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Video className="w-3 h-3 text-primary" /> Modelo
            </Label>
            <Select
              value={model}
              onValueChange={(val) => {
                setModel(val);
                setSize("1280x720");
              }}
            >
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sora-2">Sora 2</SelectItem>
                <SelectItem value="sora-2-pro">Sora 2 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duración */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Clock className="w-3 h-3 text-primary" /> Duración
            </Label>
            <Select value={seconds} onValueChange={setSeconds}>
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 segundos</SelectItem>
                <SelectItem value="8">8 segundos</SelectItem>
                <SelectItem value="12">12 segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolución */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Maximize2 className="w-3 h-3 text-primary" /> Resolución
            </Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getSizeOptions().map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Configuración avanzada */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Configuración avanzada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoría */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Tag className="w-3 h-3 text-primary" /> Categoría
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Naturaleza",
                  "Tecnología",
                  "Personas",
                  "Animales",
                  "Arquitectura",
                  "Abstracto",
                  "Ciencia Ficción",
                  "Deportes",
                  "Comida",
                  "Otro",
                ].map((item) => (
                  <SelectItem key={item.toLowerCase()} value={item.toLowerCase()}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estilo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3 h-3 text-primary" /> Estilo Visual
            </Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cinematografico">🎬 Cinematográfico</SelectItem>
                <SelectItem value="documental">📹 Documental</SelectItem>
                <SelectItem value="anime">🎨 Anime</SelectItem>
                <SelectItem value="vintage">📺 Vintage / Retro</SelectItem>
                <SelectItem value="natural">🌿 Natural / Realista</SelectItem>
                <SelectItem value="comercial">💼 Comercial / Publicitario</SelectItem>
                <SelectItem value="abstracto">🌈 Abstracto / Artístico</SelectItem>
                <SelectItem value="aereo">🚁 Aéreo / Drone</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground italic">
              Tu prompt será enriquecido automáticamente según este estilo visual.
            </p>
          </div>
        </div>
      </div>

      {/* Costo */}
      <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="w-4 h-4 text-primary" />
          Costo estimado
        </div>
        <span className="text-xl font-bold text-primary">${calculateCost()} USD</span>
      </div>

      {/* Botón */}
      <Button
        onClick={handleGenerate}
        size="lg"
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg transition-all duration-300"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generar video con {model === "sora-2-pro" ? "Sora 2 Pro" : "Sora 2"}
      </Button>
    </div>
  );
};

export default VideoCreator;
