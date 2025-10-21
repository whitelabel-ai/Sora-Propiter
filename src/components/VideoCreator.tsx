import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Video, Clock, Maximize2, Tag, DollarSign, Loader2, Wand2 } from "lucide-react";
import { useVideos } from "@/hooks/use-videos";
import { VideoService } from "@/services/video-service";
import { VideoGenerationRequest } from "@/types/database";
import { calculateVideoCost } from "@/lib/cost-utils";

interface VideoCreatorProps {
  onVideoGenerated?: () => void;
}

const VideoCreator = ({ onVideoGenerated }: VideoCreatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<'sora-2' | 'sora-2-pro'>("sora-2");
  const [duration, setDuration] = useState(4);
  const [size, setSize] = useState("1280x720");
  const [category, setCategory] = useState("");
  const [style, setStyle] = useState("");
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);

  const { generateVideo, generating } = useVideos();

  // Cargar última categoría y estilo del localStorage
  useEffect(() => {
    const lastCategory = localStorage.getItem('lastVideoCategory') || 'personalizada';
    const lastStyle = localStorage.getItem('lastVideoStyle') || 'personalizada';
    setCategory(lastCategory);
    setStyle(lastStyle);
  }, []);

  // Guardar categoría y estilo en localStorage cuando cambien
  useEffect(() => {
    if (category) {
      localStorage.setItem('lastVideoCategory', category);
    }
  }, [category]);

  useEffect(() => {
    if (style) {
      localStorage.setItem('lastVideoStyle', style);
    }
  }, [style]);

  const getSizeOptions = () => {
    if (model === "sora-2-pro") {
      return [
        { value: "1280x720", label: "Landscape (16:9)", icon: "📺", description: "1280×720 - Ideal para YouTube" },
        { value: "720x1280", label: "Portrait (9:16)", icon: "📱", description: "720×1280 - Ideal para TikTok/Instagram" },
        { value: "1024x1792", label: "Tall Portrait", icon: "📲", description: "1024×1792 - Formato vertical extendido" },
        { value: "1792x1024", label: "Wide Landscape", icon: "🖥️", description: "1792×1024 - Formato panorámico" }
      ];
    }
    return [
      { value: "1280x720", label: "Landscape (16:9)", icon: "📺", description: "1280×720 - Ideal para YouTube" },
      { value: "720x1280", label: "Portrait (9:16)", icon: "📱", description: "720×1280 - Ideal para TikTok/Instagram" }
    ];
  };

  const calculateCost = () => {
    const cost = calculateVideoCost({
      model,
      duration,
      size,
      prompt,
      category,
      style
    });
    return cost.toFixed(2);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setEnhancingPrompt(true);
    try {
      // Construir contexto para la mejora del prompt
      const context = {
        originalPrompt: prompt,
        duration: `${duration} segundos`,
        resolution: size,
        category: category === 'personalizada' ? 'general' : category,
        style: style === 'personalizada' ? 'natural' : style,
        model: model
      };
      
      const enhancedPrompt = await VideoService.enhancePrompt(context);
      setPrompt(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setEnhancingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }
    if (!category.trim()) {
      return;
    }

    const request: VideoGenerationRequest = {
      prompt: prompt.trim(),
      model,
      duration,
      size,
      category,
      style: style || undefined,
    };

    try {
      await generateVideo(request);
      
      // No limpiar el formulario después de generar para mantener los valores
       setPrompt("");
      // setCategory("");
      
      // Notificar al componente padre
      onVideoGenerated?.();
    } catch (error) {
      // El error ya se maneja en el hook useVideos
      console.error('Error generating video:', error);
    }
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
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt" className="text-sm font-medium">
            Descripción del video
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEnhancePrompt}
            disabled={!prompt.trim() || enhancingPrompt}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-secondary"
          >
            {enhancingPrompt ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Mejorando...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Mejorar con IA
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="prompt"
          placeholder="Ej: Un astronauta caminando en la luna al atardecer, cámara cinematográfica, 4K..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="resize-none border-border/50 bg-secondary/30 focus-visible:ring-primary/40 text-foreground placeholder:text-muted-foreground/70 scrollbar-thin scrollbar-track-secondary/30 scrollbar-thumb-primary/30 hover:scrollbar-thumb-primary/50 transition-colors"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(var(--primary), 0.3) rgba(var(--secondary), 0.3)'
          }}
        />
        <p className="text-xs text-muted-foreground text-right">{prompt.length} caracteres</p>
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
              onValueChange={(val: 'sora-2' | 'sora-2-pro') => {
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
            <Select value={duration.toString()} onValueChange={(val) => setDuration(parseInt(val))}>
              <SelectTrigger className="bg-secondary/50 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 segundos</SelectItem>
                <SelectItem value="8">8 segundos</SelectItem>
                <SelectItem value="12">12 segundos</SelectItem>
                <SelectItem value="16">16 segundos</SelectItem>
                <SelectItem value="20">20 segundos</SelectItem>
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
                <SelectValue>
                  {(() => {
                    const selectedOption = getSizeOptions().find(opt => opt.value === size);
                    return selectedOption ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{selectedOption.icon}</span>
                        <span>{selectedOption.label}</span>
                      </div>
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getSizeOptions().map((res) => (
                  <SelectItem key={res.value} value={res.value}>
                    <div className="flex items-center gap-3 py-1">
                      <span className="text-lg">{res.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{res.label}</span>
                        <span className="text-xs text-muted-foreground">{res.description}</span>
                      </div>
                    </div>
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
                <SelectItem value="naturaleza">🌿 Naturaleza</SelectItem>
                <SelectItem value="tecnología">💻 Tecnología</SelectItem>
                <SelectItem value="personas">👥 Personas</SelectItem>
                <SelectItem value="animales">🐾 Animales</SelectItem>
                <SelectItem value="arquitectura">🏛️ Arquitectura</SelectItem>
                <SelectItem value="abstracto">🎨 Abstracto</SelectItem>
                <SelectItem value="ciencia ficción">🚀 Ciencia Ficción</SelectItem>
                <SelectItem value="deportes">⚽ Deportes</SelectItem>
                <SelectItem value="comida">🍽️ Comida</SelectItem>
                <SelectItem value="personalizada">✨ Personalizada</SelectItem>
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
                <SelectItem value="personalizada">✨ Personalizada</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Validación */}
      {(!prompt.trim() || !category.trim()) && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            {!prompt.trim() && "• Describe el video que quieres crear"}
            {!prompt.trim() && !category.trim() && <br />}
            {!category.trim() && "• Selecciona una categoría"}
          </p>
        </div>
      )}

      {/* Botón */}
      <Button
        onClick={handleGenerate}
        size="lg"
        disabled={generating || !prompt.trim() || !category.trim()}
        variant={generating ? "modern-secondary" : "modern"}
        className={`w-full relative overflow-hidden ${
          generating 
            ? 'animate-pulse' 
            : 'hover:scale-[1.02]'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      >
        {generating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
        <div className="relative z-10 flex items-center justify-center">
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span className="font-medium">🎬 Creando tu video...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
              <span className="font-medium">
                ✨ Generar video con {model === "sora-2-pro" ? "Sora 2 Pro" : "Sora 2"}
              </span>
            </>
          )}
        </div>
      </Button>

      {/* Indicador de progreso cuando se está generando */}
      {generating && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Generando tu video
              </span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Esto puede tomar unos minutos...
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💡 Tip: Recibirás una notificación cuando tu video esté listo
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoCreator;
