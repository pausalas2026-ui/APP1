# DOCUMENTO 1 — BLUEPRINT GENERAL DEL SISTEMA

## Capítulos del Blueprint

### 0. Instrucciones Generales
- Léelo completo de inicio a fin
- Memoriza relaciones entre módulos
- Sigue la numeración estricta
- Estándar: Modularidad, Escalabilidad, Seguridad, Claridad

### 1. Visión Estratégica
- Plataforma donde cualquier persona puede promover causas, productos y sorteos
- Diferente a ecommerce, CRM donaciones, MLM clásico, marketplace simple

### 2. Actores del Sistema
- Plataforma/Admin, Comprador/Donante, Promotor/Colaborador
- Generador de Causa, Causa Destino, Creador de Productos
- Creador de Premios, Red MLM (N1 y N2)

### 3. Modelos Económicos
- Flujo productos: propietario, promotor, afiliador, plataforma
- Flujo donaciones: causa destino, generador, promotor, plataforma
- Modelo de 4 actores + MLM 2 niveles

### 4. Arquitectura Global
- App móvil, Web, API Backend, Motores internos, BD
- Unificación de lógica App/Web
- Escalabilidad modular

### 5. Módulos Clave
- Usuarios/roles/planes, Causas/campañas, Productos/marketplace
- Donaciones, Sorteos/premios, Comisiones/MLM
- Planes, Tableros, Feed inteligente, Auditoría

### 6. Tableros por Usuario
- Admin, Promotor, Generador de causa, Creador productos
- Creador premios, Comprador

### 7. Sistema de Planes
- Free, Pro, Premium, Elite
- Impacto en comisiones, productos, donaciones, sorteos

### 8. Motores Internos
- Motor económico universal, Motor de causas
- Motor marketplace, Motor sorteos, Motor feed, Motor auditoría

### 9. Flujos Funcionales
- Promoción de producto, Compra con donación
- Distribución económica, Creación producto
- Tienda personal, Invitación MLM, Sorteos

### 10. Principios Técnicos
- Separación lógica/presentación
- API única, Manejo errores, Auth/Authz
- Seguridad por roles/planes

### 11. Roadmap de Documentos
- Modelo datos, APIs, Flujos, UI/UX
- Sorteos, Marketplace, Comisiones/MLM

### 12. Reglas Maestras
- Consistencia arquitectónica, Addendums obligatorios
- Motor económico único, Backend único
- Trazabilidad absoluta, Seguridad por roles
- Tracking universal, Marketplace con aprobación
- Causa base vs causa activa, Feed inteligente
- Datos inmutables, Versionado obligatorio
