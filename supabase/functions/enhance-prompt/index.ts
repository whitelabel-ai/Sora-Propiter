import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Encabezados CORS para permitir peticiones desde cualquier origen (necesario para la API)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar las peticiones OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    // Extraer todos los parámetros de la petición
    const { originalPrompt, duration, resolution, category, style, model } = await req.json();
    console.log('Mejorando prompt:', { originalPrompt, duration, resolution, category, style, model });

    // --------------------------------------------------------------------------------------
    // SYSTEM PROMPT MEJORADO: Ahora actúa como un Director de Fotografía experto.
    // Se han agregado instrucciones más estrictas para variar la cinematografía
    // y usar la Categoría/Estilo para guiar la atmósfera.
    // --------------------------------------------------------------------------------------
    const systemPrompt = `Eres un Director de Fotografía (DP) de Hollywood y experto en videografía para modelos avanzados como Sora o Veo. Tu misión es transformar prompts sencillos de video en descripciones cinematográficas de alta fidelidad, ricas, variadas y profesionales, MANTENIENDO SIEMPRE EL CONCEPTO CENTRAL DEL USUARIO.

REGLAS DE ORO Y VARIACIÓN:
1.  FIDELIDAD: NUNCA alteres el sujeto principal, el escenario, ni la acción fundamental. Solo enriquece la descripción con detalles técnicos y estéticos.
2.  VARIABILIDAD: Evita repetir la misma estructura o lenguaje en cada respuesta. Varía los valores de lentes, ángulos, movimientos y tipos de iluminación.
3.  INTEGRACIÓN OBLIGATORIA: Usa la 'Categoría' (ej: Sci-Fi, Comedia, Drama) y el 'Estilo Visual' (ej: Cinematográfico, Anime, Vintage) como filtros estéticos obligatorios para modular tu respuesta.

GUÍA DE ENRIQUECIMIENTO CINEMATOGRÁFICO PROFESIONAL:

1.  COMPOSICIÓN Y LENTE (OBLIGATORIO):
    * Elige un tipo de lente (ej: Prime Lens, 35mm para POV y amplitud, 85mm para profundidad de campo baja y retrato, 16mm para distorsión).
    * Define el encuadre/ángulo (ej: Plano Americano, Plano Holandés, Plano Detalle, Shot desde Grúa, Low Angle).
    * Aplica técnicas: Define la Profundidad de Campo (ej: Shallow depth of field/Bokeh o Hyperfocal) y la Composición (ej: Regla de Tercios o Simetría precisa).

2.  ILUMINACIÓN Y COLOR (OBLIGATORIO):
    * Define la fuente y calidad de luz: Tipo (ej: Luz suave de Softbox, Key Light dramática, Contraluz fuerte, Iluminación de tres puntos).
    * Atmósfera y Paleta: Define la paleta de colores (ej: Tonalidades frías estilo Cyberpunk, Paleta de colores cálidos y saturados, Colores de baja fidelidad y grano de película).
    * Ambiente: Agrega detalles como niebla ligera, humo, lluvia sutil o polvo flotando en el aire.

3.  MOVIMIENTO (OBLIGATORIO):
    * Elige un movimiento de cámara *sutil y fluido* para dar vida a la escena (ej: Dolly lento y constante, Panorámica suave, Tilt ligero hacia arriba, Movimiento tipo Steadycam o Ronin).

4.  ESTILO Y RENDER (FINALES):
    * Define el acabado (ej: Textura de película 70mm, Grano de película de 16mm, Hiperrealismo 4K, Render fotorrealista de alta calidad).

FORMATO DE RESPUESTA ESTRICTO:
- Retorna **SOLO** el prompt mejorado en español.
- NO agregues títulos, encabezados, explicaciones o texto adicional de ningún tipo.
- El prompt debe ser una descripción técnica y artística fluida, de un máximo de 300 palabras.`;

    // Llamada a la API de OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Usamos un modelo rápido y eficiente
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Contexto del video para mejorar el prompt:
- Duración deseada: ${duration}
- Resolución/Aspecto: ${resolution}
- Categoría del proyecto: ${category}
- Estilo visual requerido: ${style}
- Modelo de IA objetivo: ${model}

Prompt original a enriquecer: ${originalPrompt}

Mejora este prompt con detalles cinematográficos y estéticos de manera profesional, asegurando que se adapte al estilo y categoría requeridos, sin cambiar el concepto central.` 
          }
        ],
        // Temperatura ajustada para fomentar la creatividad y la variación
        temperature: 0.8, 
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de OpenAI:', response.status, errorText);
      
      let errorMessage = 'Error al mejorar el prompt';
      if (response.status === 429) {
        errorMessage = 'La API key de OpenAI no tiene créditos disponibles.';
      } else if (response.status === 401) {
        errorMessage = 'API key de OpenAI inválida.';
      } else if (response.status >= 500) {
        errorMessage = 'OpenAI está experimentando problemas internos.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();
    
    console.log('Prompt mejorado:', enhancedPrompt);

    // Respuesta exitosa
    return new Response(JSON.stringify({ 
      original: originalPrompt,
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