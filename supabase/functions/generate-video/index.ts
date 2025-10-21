import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body to check for action and video_id
    const body = await req.json().catch(() => ({}));
    const { action, video_id } = body;

    // Si se proporciona video_id o action es 'status', verificar estado o descargar video
    if (video_id || action === 'status') {
      console.log('Verificando estado del video:', video_id);
      
      // Primero verificar el estado usando el endpoint correcto según la documentación oficial
      const statusResponse = await fetch(
        `https://api.openai.com/v1/videos/${video_id}`,
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

      // Si está completado, descargar y almacenar el video
      if (statusData.status === 'completed') {
        console.log('Video completado, descargando:', statusData);
        
        try {
          // Descargar el video desde OpenAI
          const videoResponse = await fetch(
            `https://api.openai.com/v1/videos/${video_id}/content`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
              },
            }
          );

          if (!videoResponse.ok) {
            throw new Error(`Error descargando video: ${videoResponse.status}`);
          }

          const videoBlob = await videoResponse.blob();
          const videoBuffer = await videoBlob.arrayBuffer();
          
          // Generar nombre único para el archivo
          const fileName = `${video_id}.mp4`;
          const filePath = `SORA/${fileName}`; // Almacenar en carpeta SORA dentro del bucket videos
          
          // Subir a Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filePath, videoBuffer, {
              contentType: 'video/mp4',
              upsert: true
            });

          if (uploadError) {
            console.error('Error subiendo video:', uploadError);
            throw new Error(`Error almacenando video: ${uploadError.message}`);
          }

          console.log('Video almacenado exitosamente:', uploadData);
          
          return new Response(
            JSON.stringify({ 
              status: statusData.status,
              video_url: filePath, // Ruta SORA/video_xxx.mp4 para la base de datos
              thumbnail_url: statusData.thumbnail_url || null,
              progress: 100
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } catch (downloadError) {
          console.error('Error descargando/almacenando video:', downloadError);
          // Si falla la descarga, retornar la URL original como fallback
          return new Response(
            JSON.stringify({ 
              status: statusData.status,
              video_url: `https://api.openai.com/v1/videos/${video_id}/content`,
              thumbnail_url: statusData.thumbnail_url || null,
              progress: 100,
              download_error: downloadError.message
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
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
    const { prompt, duration, size, model } = body;
    console.log('Generando video con:', { prompt, duration, size, model });

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'sora-2',
        prompt,
        seconds: String(duration), // Usar 'seconds' según la documentación oficial
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
