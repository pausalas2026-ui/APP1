# DOCUMENTO 5 — ARQUITECTURA GLOBAL

## Arquitectura por 6 Capas

### Capa 1: Presentación (App + Web)
- Solo UI/UX, navegación, validaciones superficiales
- NUNCA: lógica económica, cálculos, roles
- Tecnologías: Next.js, React Native/Flutter, TailwindCSS

### Capa 2: Comunicación (API Layer)
- Auth JWT, routing, rate limiting, validaciones
- NUNCA: lógica económica profunda
- Solo recibe y envía al motor correcto

### Capa 3: Lógica (Motores Internos) ⭐ CEREBRO
- Motor Económico Universal
- Motor de Productos, Comisiones, MLM
- Motor de Donaciones, Causas, Sorteos
- Motor de Feed, Auditoría, Planes, Notificaciones
- TODA la lógica crítica aquí

### Capa 4: Persistencia (BD + Cache)
- PostgreSQL + Redis + Prisma
- Integridad, auditoría, transacciones

### Capa 5: Servicios Externos
- Pasarelas pago, email, SMS, push, storage
- Modular (intercambiable)

### Capa 6: Infraestructura
- Docker, CDN, backups, monitoring, logs

## App = Web = Mismo Backend
- Comparten endpoints, modelos, motores, roles, planes
- Diferencia solo visual

## Reglas de Comunicación API
- JWT obligatorio en toda solicitud
- Cada endpoint valida: rol + plan + permisos
- Respuestas consistentes y tipadas
- Documentación OpenAPI

## Infraestructura Requerida
- Despliegue escalable (Docker)
- CDN para archivos
- Mecanismos anti-fraude
- Backups automáticos
- Logs centralizados
- Monitorización (Prometheus, Grafana)

## Escalabilidad Horizontal
- Miles de usuarios concurrentes
- Picos por sorteos/campañas virales
- Motores desacoplados con colas

## Seguridad
- Autenticación fuerte, autorización por roles/planes
- Validaciones estrictas en backend
- Logs de auditoría, prevención fraude
- Registros inmutables, trazabilidad completa
