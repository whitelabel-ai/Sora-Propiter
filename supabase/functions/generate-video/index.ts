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

    const url = new URL(req.url);
    const videoId = url.searchParams.get('video_id');

    // Si se proporciona video_id, obtener el video generado
    if (videoId) {
      console.log('Obteniendo video:', videoId);
      
      const response = await fetch(
        `https://api.openai.com/v1/videos/${videoId}/content`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error obteniendo video:', response.status, errorText);
        throw new Error(`Error al obtener el video: ${response.status}`);
      }

      // Retornar el video como blob
      const videoBlob = await response.blob();
      return new Response(videoBlob, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'video/mp4',
        },
      });
    }

    // Si no hay video_id, iniciar generación
    const { prompt, duration, resolution, style, model } = await req.json();
    console.log('Generando video con:', { prompt, duration, resolution, style, model });

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'sora-2',
        prompt,
        duration: parseInt(duration),
        resolution,
        style,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error generando video:', response.status, errorText);
      throw new Error(`Error al generar video: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Video iniciado:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en generate-video:', error);
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
