# 🎬 Whitelabel SORA - AI Video Generation Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-SORA-orange?style=for-the-badge&logo=openai" alt="OpenAI SORA" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

## 📋 Descripción

**Whitelabel SORA** es una plataforma avanzada de generación de videos con IA que utiliza los modelos SORA de OpenAI. Permite a los usuarios crear videos de alta calidad a partir de prompts de texto, con múltiples opciones de personalización y una interfaz moderna e intuitiva.

### ✨ Características Principales

- 🎥 **Generación de Videos con IA**: Utiliza SORA-2 y SORA-2 Pro de OpenAI
- 🎨 **Múltiples Resoluciones**: Desde 480p hasta 1080p con opciones landscape y portrait
- ⏱️ **Duraciones Flexibles**: Videos de 5 a 20 segundos
- 🎭 **Estilos Personalizados**: Realista, animado, cinematográfico y más
- 📱 **Interfaz Responsiva**: Diseño moderno con Tailwind CSS
- 🔄 **Actualizaciones en Tiempo Real**: Estado de procesamiento automático
- 💾 **Descarga Directa**: Descarga videos al PC del usuario
- 🔐 **Autenticación Segura**: Sistema completo con Supabase Auth
- 📊 **Estadísticas de Uso**: Seguimiento de costos y uso
- 🎯 **Galería de Videos**: Organización por categorías y estados

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   OpenAI SORA   │
│   (React/TS)    │◄──►│   (Backend)     │◄──►│   (AI Models)   │
│                 │    │                 │    │                 │
│ • VideoCreator  │    │ • Database      │    │ • SORA-2        │
│ • VideoGallery  │    │ • Storage       │    │ • SORA-2 Pro    │
│ • VideoPreview  │    │ • Edge Funcs    │    │ • Video Gen     │
│ • Auth System   │    │ • Auth          │    │ • Status Check  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- API Key de OpenAI con acceso a SORA

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/whitelabel-sora.git
cd whitelabel-sora
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=tu_project_id

# OpenAI Configuration
OPENAI_API_KEY=tu_openai_api_key
```

### 4. Configurar Supabase

#### Base de Datos

Ejecutar las siguientes migraciones SQL en Supabase:

```sql
-- Tabla de videos
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  model VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL,
  size VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  style VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  video_url TEXT,
  thumbnail_url TEXT,
  openai_task_id TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de uso
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  cost DECIMAL(10,2),
  duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
```

#### Storage

1. Crear bucket `videos` en Supabase Storage
2. Configurar políticas RLS:

```sql
-- Política para acceso a videos
CREATE POLICY "Users can access their own videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para subida de videos (service role)
CREATE POLICY "Service role can upload videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');
```

#### Edge Functions

Desplegar la función `generate-video`:

```bash
supabase functions deploy generate-video
```

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
whitelabel-sora/
├── src/
│   ├── components/           # Componentes React
│   │   ├── VideoCreator.tsx  # Creador de videos
│   │   ├── VideoGallery.tsx  # Galería de videos
│   │   ├── VideoPreview.tsx  # Vista previa
│   │   ├── VideoCard.tsx     # Tarjeta de video
│   │   └── ui/              # Componentes UI base
│   ├── hooks/               # Custom hooks
│   │   ├── use-videos.ts    # Hook principal de videos
│   │   └── use-async.ts     # Hook para operaciones async
│   ├── services/            # Servicios de API
│   │   └── video-service.ts # Servicio de videos
│   ├── types/               # Definiciones TypeScript
│   │   └── database.ts      # Tipos de base de datos
│   ├── lib/                 # Utilidades
│   │   ├── cost-utils.ts    # Cálculo de costos
│   │   └── utils.ts         # Utilidades generales
│   └── pages/               # Páginas principales
│       ├── Index.tsx        # Página principal
│       └── Auth.tsx         # Página de autenticación
├── supabase/
│   └── functions/
│       └── generate-video/  # Edge function para generación
└── public/                  # Archivos estáticos
```

## 🎯 Funcionalidades Detalladas

### 🎬 Generación de Videos

- **Modelos Disponibles**: SORA-2 (básico) y SORA-2 Pro (avanzado)
- **Resoluciones**: 
  - 480p (854×480) 📱 Móvil
  - 720p (1280×720) 💻 HD
  - 1080p (1920×1080) 🖥️ Full HD
  - Portrait 9:16 (1080×1920) 📱 Vertical
- **Duraciones**: 5, 10, 15, 20 segundos
- **Estilos**: Realista, Animado, Cinematográfico, Artístico

### 📊 Sistema de Costos

```typescript
// Cálculo automático basado en:
const cost = baseCost * durationMultiplier * resolutionMultiplier * modelMultiplier;

// Factores:
// - Modelo: SORA-2 (1x), SORA-2 Pro (2x)
// - Duración: 5s (1x), 10s (1.5x), 15s (2x), 20s (2.5x)
// - Resolución: 480p (1x), 720p (1.5x), 1080p (2x)
```

### 🔄 Estados de Video

1. **Pending**: Video creado, esperando procesamiento
2. **Processing**: Video en generación por OpenAI
3. **Completed**: Video listo para visualización
4. **Failed**: Error en la generación

### 📱 Interfaz de Usuario

- **Diseño Responsivo**: Adaptable a móviles y desktop
- **Tema Oscuro/Claro**: Soporte completo
- **Animaciones Suaves**: Transiciones CSS optimizadas
- **Feedback Visual**: Estados de carga y progreso

## 🔧 API y Servicios

### VideoService

```typescript
class VideoService {
  // Operaciones CRUD
  static createVideo(data: VideoData): Promise<Video>
  static getUserVideos(userId: string, filters?: Filters): Promise<VideoList>
  static updateVideo(id: string, updates: Partial<Video>): Promise<Video>
  static deleteVideo(id: string): Promise<void>
  
  // Generación y estado
  static generateVideo(request: VideoGenerationRequest): Promise<GenerationResponse>
  static checkVideoStatus(taskId: string): Promise<StatusResponse>
  
  // Uso y estadísticas
  static logUsage(data: UsageData): Promise<void>
  static getUserStats(userId: string): Promise<UserStats>
}
```

### Hooks Personalizados

#### useVideos
```typescript
const {
  videos,           // Lista de videos
  loading,          // Estado de carga
  generating,       // Estado de generación
  generateVideo,    // Función para generar
  deleteVideo,      // Función para eliminar
  retryVideo,       // Función para reintentar
  upgradeVideo,     // Función para mejorar
  checkVideoStatus, // Verificar estado
  refetch          // Recargar lista
} = useVideos({
  autoRefresh: true,      // Actualización automática
  refreshInterval: 5000,  // Intervalo en ms
  category: 'all',        // Filtro por categoría
  status: 'completed'     // Filtro por estado
});
```

## 🔐 Seguridad

### Autenticación
- **Supabase Auth**: Sistema completo de autenticación
- **JWT Tokens**: Tokens seguros para API calls
- **Row Level Security**: Políticas a nivel de base de datos

### Autorización
- **User Isolation**: Cada usuario solo ve sus videos
- **Service Role**: Funciones edge con permisos elevados
- **Storage Policies**: Acceso controlado a archivos

### Validación
- **Input Sanitization**: Limpieza de prompts
- **Rate Limiting**: Control de frecuencia de requests
- **Cost Validation**: Verificación de límites de uso

## 📈 Monitoreo y Analytics

### Métricas Disponibles
- Videos generados por usuario
- Costos acumulados
- Tiempo promedio de generación
- Tasa de éxito/fallo
- Uso por modelo y resolución

### Logs del Sistema
```typescript
// Ejemplo de log de uso
{
  user_id: "uuid",
  video_id: "uuid", 
  action: "generate",
  cost: 2.50,
  duration: 10,
  metadata: {
    model: "sora-2-pro",
    resolution: "1080p",
    style: "cinematic"
  }
}
```

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
```

### Producción

#### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Subir carpeta dist/ a Netlify
```

#### Variables de Entorno en Producción
Asegurar que todas las variables estén configuradas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `OPENAI_API_KEY` (en Supabase Edge Functions)

## 🛠️ Desarrollo y Contribución

### Scripts Disponibles
```bash
npm run dev          # Desarrollo
npm run build        # Build
npm run lint         # Linting
npm run type-check   # Verificación de tipos
npm run test         # Tests (si están configurados)
```

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización de código
test: adición de tests
```

### Debugging

#### Debug de Storage
```bash
node debug-storage.js  # Script para verificar Supabase Storage
```

#### Logs Útiles
- Browser DevTools: Network tab para API calls
- Supabase Dashboard: Logs de Edge Functions
- Console logs: Estados de video y errores

## 📚 Recursos Adicionales

### Documentación
- [OpenAI SORA API](https://platform.openai.com/docs/guides/sora)
- [Supabase Docs](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comunidad
- [Discord de Supabase](https://discord.supabase.com)
- [OpenAI Community](https://community.openai.com)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@whitelabel-sora.com
- 💬 Discord: [Servidor de la comunidad]
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/whitelabel-sora/issues)

---

<div align="center">
  <p>Hecho con ❤️ por el equipo de Whitelabel SORA</p>
  <p>Potenciado por OpenAI SORA, Supabase y React</p>
</div>
