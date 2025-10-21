import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, Zap, Loader2 } from "lucide-react";

interface UpgradeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost: number;
  isUpgrading: boolean;
  videoData: {
    prompt: string;
    duration: number;
    size: string;
    category: string;
    style: string;
  };
}

const UpgradeVideoModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cost, 
  isUpgrading,
  videoData 
}: UpgradeVideoModalProps) => {
  // Verificar que videoData sea válido
  if (!videoData || !videoData.prompt) {
    return null;
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Mejorar Video con Sora Pro
          </DialogTitle>
          <DialogDescription>
            Genera una versión mejorada de tu video usando el modelo Sora 2 Pro para obtener mayor calidad y detalles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del video */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Detalles del video:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Prompt:</span> {videoData.prompt.substring(0, 100)}...</p>
              <p><span className="font-medium">Duración:</span> {videoData.duration}s</p>
              <p><span className="font-medium">Resolución:</span> {videoData.size}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {videoData.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {videoData.style}
                </Badge>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Beneficios del modelo Pro:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Mayor calidad visual y detalles</li>
              <li>• Mejor coherencia temporal</li>
              <li>• Movimientos más fluidos</li>
              <li>• Colores más vibrantes</li>
            </ul>
          </div>

          {/* Costo */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Costo de mejora:</span>
              <div className="flex items-center gap-1 text-lg font-bold text-primary">
                <DollarSign className="w-4 h-4" />
                {cost.toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Se cobrará automáticamente de tu saldo
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isUpgrading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1"
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mejorando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Confirmar Mejora
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeVideoModal;