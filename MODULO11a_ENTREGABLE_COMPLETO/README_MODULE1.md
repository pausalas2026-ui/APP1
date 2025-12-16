
# MÓDULO 1 – ARQUITECTURA FUNDAMENTAL Y BASES DEL SISTEMA  
_Plataforma: **Love to Help – Sorteos Comerciales y Solidarios**_  

Este documento es el **PRIMER ENTREGABLE OFICIAL** para el equipo de programación.  
Define las bases arquitectónicas, lógicas, técnicas y operativas necesarias para construir todo el sistema.

La IA del programador debe **cargar este archivo completo** y respetar rigurosamente todas las reglas descritas aquí.  
Todos los módulos posteriores (Sorteos, Tienda General, Tienda Marketing, Disputas, Afiliados, Pagos, etc.) dependen de este módulo.

---

## 0. OBJETIVOS DEL MÓDULO 1

1. Definir la **arquitectura global** (Clean Architecture en capas).
2. Definir **roles base** y modelo de identidad.
3. Definir **tablas nucleares** de base de datos.
4. Definir **endpoints base** (auth, usuario, sistema).
5. Definir **estándares de seguridad obligatorios**.
6. Definir **estándares de calidad de código**.
7. Proveer **ejemplos de código reales y copiables**.
8. Dejar preparada la base para integrarse con todos los futuros módulos.

Este módulo NO implementa aún sorteos, tiendas ni pagos;  
prepara el terreno para que esos módulos se conecten de forma limpia, segura y escalable.

---

## 1. ARQUITECTURA GLOBAL DEL SISTEMA

### 1.1 Estilo arquitectónico

Se usará **Clean Architecture / Hexagonal** para garantizar:

- Bajo acoplamiento,
- Alta cohesión,
- Facilidad de pruebas,
- Facilidad de crecimiento futuro (posibles microservicios).

### 1.2 Capas obligatorias

```txt
[ Frontend Web / App Móvil ]
              ↓
      [ Controladores / API ]
              ↓
      [ Servicios / Casos de Uso ]
              ↓
      [ Repositorios / Adaptadores ]
              ↓
[ Base de Datos / Cache / Servicios externos ]
```

**Regla:** Los controladores NUNCA deben contener lógica de negocio compleja.  
Toda la lógica de negocio va en **Servicios** / Casos de uso.

### 1.3 Tecnologías recomendadas (no estrictamente obligatorias, pero preferidas)

- Backend: **Node.js + TypeScript**
- Web: **Next.js / React**
- App móvil: **Flutter** o **React Native**
- BD principal: **PostgreSQL**
- Cache: **Redis**
- Colas de trabajo: **BullMQ** sobre Redis
- Archivos: **S3** o equivalente (Cloudflare R2, etc.)
- Autenticación: **JWT** + Refresh Tokens
- Documentación API: **OpenAPI 3.0** (Swagger)

---

## 2. ROLES Y MODELO DE IDENTIDAD

> Estos roles son la base de TODO el sistema.  
> No deben improvisarse roles adicionales sin revisar el diseño global.

### 2.1 Roles base

- `user` → Usuario general.
- `collaborator` → Usuario que puede compartir campañas y generar comisiones.
- `commerce` → Comercio / proveedor que puede crear sorteos comerciales y subir productos.
- `foundation` → Fundación / ONG que puede crear sorteos solidarios y recibir donaciones.
- `admin` → Administrador con control total de la plataforma.
- `system` → Rol interno para tareas automáticas (no humano).

### 2.2 Reglas de roles

- Un usuario siempre tiene al menos el rol `user`.
- Puede acumular roles adicionales (ej.: `user + collaborator + commerce`).
- La tabla `user_roles` se usará para asociar múltiples roles a un mismo usuario.
- Los permisos se evaluarán por **permiso** (ej. `raffle.create`), NO por rol fijo.

---

## 3. MODELO DE DATOS NUCLEAR (SQL)

> Este archivo solo contiene el **núcleo**.  
> Tablas adicionales como sorteos, premios, productos, disputas, etc. se añaden en módulos posteriores.

La versión completa del SQL está en `sql/schema_module1.sql`.  
Aquí solo se muestra un extracto clave.

```sql
-- Tabla principal de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  phone VARCHAR(50),
  country VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  -- 'active', 'suspended', 'banned', 'pending_review'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Perfil extendido del usuario
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  birthdate DATE,
  address JSONB,
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  profile_photo_url TEXT,
  metadata JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roles múltiples por usuario
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role)
);
```

Más SQL detallado en: `sql/schema_module1.sql`.

---

## 4. ENDPOINTS BASE (API REST – OPENAPI)

La especificación OpenAPI del módulo 1 está en:  
`openapi/module1_openapi.yaml`

Incluye, como mínimo:

- `/auth/register`  
- `/auth/login`  
- `/auth/refresh`  
- `/auth/logout`  
- `/users/me`  
- `/users/me/profile`  
- `/system/health`

Ejemplo conceptual de `/auth/register`:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "country": "ES"
}
```

Respuesta:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "status": "active"
  },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

---

## 5. SEGURIDAD Y VALIDACIONES (OBLIGATORIO)

### 5.1 Contraseñas

- Se deben almacenar usando **Argon2id** (NO bcrypt, salvo innegociable).
- Requisito mínimo:
  - Min. 8 caracteres,
  - Al menos 1 mayúscula,
  - Al menos 1 minúscula,
  - Al menos 1 número.

### 5.2 Tokens

- `accessToken` con expiración corta (10–20 min).
- `refreshToken` con expiración larga (15–30 días).
- Ambos JWT firmados con clave segura.
- Refresh tokens almacenados (hash o cifrados) en BD, asociados a una sesión.

### 5.3 Auditoría

Cualquier acción crítica se registra en `audit_logs`:

- Inicio de sesión
- Cambio de contraseña
- Cambio de rol
- Suspensión de usuario
- Cambios en parámetros del sistema

Ejemplo de registro:

```json
{
  "actor_user_id": "uuid-admin",
  "action": "USER_ROLE_CHANGED",
  "target_type": "user",
  "target_id": "uuid-usuario",
  "metadata": {
    "old_roles": ["user"],
    "new_roles": ["user", "collaborator"]
  }
}
```

---

## 6. ESTÁNDARES DE CÓDIGO Y ESTRUCTURA DEL PROYECTO

### 6.1 Árbol de carpetas recomendado

```txt
/src
  /api          # Definiciones de rutas / controladores
  /config       # Configuración (env, claves, etc.)
  /controllers  # Controladores HTTP (finos)
  /services     # Casos de uso / lógica de negocio
  /repositories # Acceso a BD
  /models       # Modelos de dominio y DTOs
  /middlewares  # Autenticación, permisos, auditoría
  /utils        # Funciones utilitarias
  /db
    /migrations # Scripts de migración
  /tests        # Pruebas unitarias e integradas
```

### 6.2 Reglas duras

- Controladores → solo orquestan, no contienen lógica de negocio pesada.
- Servicios → contienen la lógica de negocio.
- Repositorios → NO contienen lógica de negocio, solo acceso a BD.
- Middleware de permisos → basado en **permisos**, no en roles.
- Todos los endpoints deben definirse en la spec OpenAPI.

---

## 7. EJEMPLOS DE CÓDIGO (TS) – AUTENTICACIÓN

La carpeta `code/backend` contiene ejemplos de:

- `authController.example.ts`
- `userService.example.ts`
- `permissionsMiddleware.example.ts`

### 7.1 Ejemplo – Registro de usuario (simplificado)

```ts
// userService.example.ts (extracto)
import { hashPassword } from "../utils/crypto";
import { userRepo } from "../repositories/userRepo";

export async function registerUser(input: {
  email: string;
  password: string;
  country: string;
}) {
  const existing = await userRepo.findByEmail(input.email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_IN_USE");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await userRepo.create({
    email: input.email,
    password_hash: passwordHash,
    role: "user",
    country: input.country
  });

  // TODO: crear wallet, perfil básico, etc.

  return user;
}
```

### 7.2 Ejemplo – Middleware de permisos

```ts
// permissionsMiddleware.example.ts (extracto)

export function requirePermission(permissionCode: string) {
  return async (req, res, next) => {
    const user = req.context.user;

    if (!user) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const has = await permissionsService.userHasPermission(
      user.id,
      permissionCode
    );

    if (!has) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    return next();
  };
}
```

---

## 8. CONEXIÓN CON MÓDULOS FUTUROS

Este Módulo 1 debe permitir sin fricción:

- La creación y gestión de sorteos (Módulo 3).
- El manejo de pagos, comisiones y wallets (Módulo 4).
- La tienda general y tienda de marketing (Módulos de tienda).
- El seguimiento de links, afiliados y comisiones (tracking).
- El sistema de disputas y resolución de conflictos.
- El panel administrativo global.

**Condición:**  
Si el programador altera la arquitectura o las tablas base sin coordinar,  
los módulos posteriores serán incompatibles.

---

## 9. INSTRUCCIONES PARA LA IA DEL PROGRAMADOR

1. Cargar **este archivo completo** (`README_MODULE1.md`).
2. Cargar los archivos de:
   - `sql/schema_module1.sql`
   - `openapi/module1_openapi.yaml`
   - `code/backend/*.ts`
3. Entender estos archivos como **fuente de verdad** del Módulo 1.
4. Al generar código:
   - Respetar la arquitectura,
   - Respetar los nombres de tablas,
   - Respetar los endpoints y sus contratos.
5. No simplificar ni omitir campos o capas.

---

FIN DEL MÓDULO 1 – DOCUMENTO BASE PARA PROGRAMADORES E IA
