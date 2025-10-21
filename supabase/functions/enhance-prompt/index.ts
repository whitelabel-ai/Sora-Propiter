import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const { prompt, style } = await req.json();
    console.log('Mejorando prompt:', { prompt, style });

    // System prompt basado en la guía de Sora 2
    const systemPrompt = `Eres un experto en cinematografía y dirección de video que mejora prompts para Sora 2, el modelo de generación de video de OpenAI.

Tu trabajo es tomar un prompt básico del usuario y enriquecerlo con detalles cinematográficos específicos siguiendo estas pautas:

1. ESTRUCTURA DEL PROMPT:
   - Describe la escena como si estuvieras dibujando un storyboard
   - Especifica el encuadre de la cámara
   - Describe la profundidad de campo
   - Detalla la acción en pasos
   - Define la iluminación y paleta de colores
   
2. ELEMENTOS CLAVE A INCLUIR:
   - Cámara: tipo de lente, movimiento (dolly, pan, tilt, etc.), ángulo
   - Iluminación: dirección, intensidad, temperatura de color, hora del día
   - Composición: primer plano, plano medio, fondo
   - Movimiento: acciones específicas y visibles
   - Atmósfera: textura, clima, ambiente
   - Estilo visual: filtros, grano, contraste, paleta de colores
   
3. PRINCIPIOS:
   - Sé específico pero conciso (150-300 palabras máximo)
   - Usa verbos y sustantivos concretos que describan resultados visibles
   - Evita términos vagos como "hermoso" o "rápido"
   - Mantén la coherencia con el estilo solicitado
   - No uses múltiples tomas en una sola descripción

4. ESTILOS:
   - Cinematográfico: lentes profesionales (35mm, 50mm), iluminación de tres puntos, color grading profesional
   - Documental: handheld, luz natural, estilo observacional, autenticidad
   - Anime: colores vibrantes, lighting estilizado, movimientos expresivos
   - Vintage: grano de película, colores desaturados, filtros period-appropriate
   - Natural: luz suave, colores realistas, movimientos sutiles
   - Comercial: iluminación perfecta, composición simétrica, alta producción
   - Abstracto: composiciones inusuales, colores experimentales, movimientos no convencionales
   - Aéreo: perspectiva elevada, movimientos de drone, gran escala

IMPORTANTE: 
- Mantén el concepto original del usuario intacto
- Solo MEJORA con detalles técnicos y cinematográficos
- El prompt debe ser EN ESPAÑOL
- Retorna SOLO el prompt mejorado, sin explicaciones adicionales`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Estilo visual: ${style}\n\nPrompt original: ${prompt}\n\nMejora este prompt con detalles cinematográficos específicos manteniendo el concepto original.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de OpenAI:', response.status, errorText);
      throw new Error(`Error al mejorar el prompt: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();
    
    console.log('Prompt mejorado:', enhancedPrompt);

    return new Response(JSON.stringify({ 
      original: prompt,
      enhanced: enhancedPrompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en enhance-prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
