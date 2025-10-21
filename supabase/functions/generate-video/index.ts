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

    // Si se proporciona video_id, verificar estado o descargar video
    if (videoId) {
      console.log('Verificando estado del video:', videoId);
      
      // Primero verificar el estado
      const statusResponse = await fetch(
        `https://api.openai.com/v1/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Error verificando estado:', statusResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: `Error al verificar estado: ${statusResponse.status}`,
            status: 'error'
          }),
          {
            status: statusResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const statusData = await statusResponse.json();
      console.log('Estado del video:', statusData);

      // Si está completado, descargar el video
      if (statusData.status === 'completed') {
        console.log('Video completado, descargando...');
        const downloadResponse = await fetch(
          `https://api.openai.com/v1/videos/${videoId}/content`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
          }
        );

        if (!downloadResponse.ok) {
          throw new Error(`Error al descargar video: ${downloadResponse.status}`);
        }

        const videoBlob = await downloadResponse.blob();
        return new Response(videoBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'video/mp4',
          },
        });
      }

      // Si no está completado, retornar el estado actual
      return new Response(
        JSON.stringify({ 
          status: statusData.status,
          progress: statusData.progress || 0
        }),
        {
          status: 202, // Accepted - processing
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Si no hay video_id, iniciar generación
    const { prompt, seconds, size, model } = await req.json();
    console.log('Generando video con:', { prompt, seconds, size, model });

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'sora-2',
        prompt,
        seconds: String(seconds),
        size,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error generando video:', response.status, errorText);
      throw new Error(`Error al generar video: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Video iniciado:', data);

    // La API retorna { id, status, ... }
    return new Response(JSON.stringify({ 
      video_id: data.id,
      status: data.status,
      progress: data.progress || 0
    }), {
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
