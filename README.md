# 🛠️ AutoFair - Sistema de Gestión y Notificación de Presupuestos Automotrices

Una solución web moderna para talleres mecánicos que automatiza la generación de presupuestos, la síntesis de diagnósticos técnicos mediante **Inteligencia Artificial (Google Gemini)** y la notificación interactiva al cliente vía **Telegram** con sincronización en tiempo real.

---

## 🚀 Características Principales

* **Autenticación y Roles:** Control de acceso basado en roles (`ADMIN` y `MECANICO`) mediante Supabase Auth.
* **Diagnóstico impulsado por IA:** Conversión de notas técnicas complejas en explicaciones claras para el cliente utilizando `gemini-2.5-flash`.
* **Notificaciones Interactivas:** Integración mediante Webhooks (**n8n** + **Telegram Bot API**) con botones interactivos (*Aprobar / Rechazar*).
* **Gestión Multimedia:** Carga de fotografías y videos de evidencias en Supabase Storage.
* **Panel en Tiempo Real:** Dashboard interactivo con WebSockets (Supabase Realtime) para actualizar estados de aprobación instantáneamente.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React.
* **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, Storage, Realtime Engine).
* **Inteligencia Artificial:** Google Gen AI SDK (`@google/genai` con modelo Gemini 2.5 Flash).
* **Automatización:** n8n Workflow Automation, Telegram Bot API.
* **Despliegue Recomendado:** Vercel / Netlify.

---

## 📋 Requisitos Previos

Asegúrate de contar con lo siguiente antes de comenzar:

* **Node.js:** Versión 18.0 o superior.
* **npm**, **pnpm** o **yarn**.
* Una cuenta en [Supabase](https://supabase.com/).
* Una API Key de [Google AI Studio](https://aistudio.google.com/).
* Una instancia de [n8n](https://n8n.io/) configurada con un Bot de Telegram.

---

## ⚙️ Configuración del Entorno (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto y agrega las siguientes variables de entorno:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Google AI (Gemini)
GEMINI_API_KEY=tu_gemini_api_key

# Webhooks & Automatización (n8n)
N8N_PRESUPUESTO_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/presupuesto
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/ordenes
```

---

## 🗄️ Configuración de la Base de Datos (Supabase)

Ejecuta las siguientes sentencias SQL en el editor de Supabase para estructurar la base de datos e índices requeridos:

```sql
-- Tabla Clientes
-- Crear tipo ENUM si usas PostgreSQL/Supabase
CREATE TYPE app_role AS ENUM ('ADMIN', 'MECANICO');

-- Tabla Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR NOT NULL,
    telefono_telegram VARCHAR UNIQUE NOT NULL,
    email VARCHAR,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    telegram_chat_id VARCHAR
);

-- Tabla Vehículos
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    placa VARCHAR UNIQUE NOT NULL,
    marca VARCHAR,
    modelo VARCHAR,
    anio INT4
);

-- Tabla Perfiles
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR,
    rol app_role,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PENDIENTE')) DEFAULT 'PENDIENTE'
);

-- Tabla Mecánicos
CREATE TABLE mecanicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR NOT NULL,
    telefono_whatsapp VARCHAR UNIQUE NOT NULL,
    especialidad VARCHAR,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID UNIQUE REFERENCES perfiles(id) ON DELETE SET NULL,
    telegram_chat_id VARCHAR
);

-- Tabla Solicitudes de Mecánicos
CREATE TABLE solicitudes_mecanicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    telefono VARCHAR NOT NULL,
    password_provisoria TEXT NOT NULL,
    experiencia TEXT,
    estado VARCHAR CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')) DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    telegram_chat_id VARCHAR
);

-- Tabla Presupuestos
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE CASCADE,
    mecanico_id UUID REFERENCES mecanicos(id) ON DELETE RESTRICT,
    monto_repuestos NUMERIC(10,2) DEFAULT 0.00,
    monto_mano_obra NUMERIC(10,2) DEFAULT 0.00,
    monto_total NUMERIC(10,2) GENERATED ALWAYS AS (monto_repuestos + monto_mano_obra) STORED,
    resumen_ia TEXT,
    estado VARCHAR DEFAULT 'Pendiente',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla Evidencias Multimedia
CREATE TABLE evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
    tipo VARCHAR,
    url_archivo TEXT NOT NULL,
    descripcion TEXT
);

-- Tabla Interacciones Telegram (Faltaba en tu SQL)
CREATE TABLE interacciones_telegram (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
    telegram_chat_id VARCHAR,
    telegram_message_id VARCHAR,
    respuesta_cliente VARCHAR,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_respuesta TIMESTAMP WITH TIME ZONE
);

-- Habilitar publicación Realtime en presupuestos
ALTER PUBLICATION supabase_realtime ADD TABLE presupuestos;
```

> **Nota:** Recuerda crear un Bucket en Supabase Storage llamado `evidencias-multimedia` con acceso público para almacenar las imágenes y videos cargados.

---

## 📦 Instalación y Puesta en Marcha

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/taller-mecanico.git
   cd taller-mecanico
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```text
app/
├── admin/
│   └── dashboard/          # Panel de administración central
│       └── page.tsx
├── api/
│   ├── admin/
│   │   └── mecanicos/     # API de registro de mecánicos
│   │       └── route.ts
│   ├── aprobar-mecanico/   # Endpoint de aprobación
│   │   └── route.ts
│   ├── enviar-presupuesto/ # Conector entre Supabase / n8n
│   │   └── route.ts
│   └── sintesis/           # Integración con Gemini AI
│       └── route.ts
├── dashboard/              # Panel principal / vista general
│   └── page.tsx
├── login/                  # Inicio de sesión por rol
│   └── page.tsx
├── mecanicos/              # Vista / módulo de mecánicos
│   └── page.tsx
├── ordenes/                # Procesamiento e inserción de órdenes
│   └── page.tsx
├── registro/               # Vistas de registro de usuarios
│   └── page.tsx
├── solicitud-mecanico/     # Registro e ingreso inicial de solicitudes
│   └── page.tsx
└── taller/
    └── dashboard/          # Panel específico para talleres
        └── page.tsx
lib/
└── supabaseClient.ts       # Configuración del cliente Supabase
public/                     # Archivos estáticos
README.md
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.
