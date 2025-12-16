DECISIONES ACEPTADAS - BLOQUE 1
Fecha: 14 diciembre 2025
Estado: Documentado post-auditoria

ELEMENTOS DIFERIDOS A BLOQUES POSTERIORES

1. Campo codigoReferido en User
   Diferido a: BLOQUE MLM
   Motivo: Corresponde al sistema de referidos MLM (N1+N2)
   Referencia: DOCUMENTO 04

2. Campo planId en User
   Diferido a: BLOQUE PLANES
   Motivo: Corresponde al sistema de planes (Free/Pro/Premium/Elite)
   Referencia: DOCUMENTO 08

3. RolesGuard para validacion de permisos
   Diferido a: Cuando se requiera control granular de acceso
   Motivo: BLOQUE 1 solo requiere autenticacion basica
   Referencia: DOCUMENTO 22

ANOTACIONES PARA PRE-PRODUCCION

1. Transacciones en participaciones
   Ubicacion: participaciones.service.ts metodo registrar()
   Detalle: Envolver creacion de participacion y actualizacion de boletosVendidos en transaccion Prisma
   Impacto: Prevenir inconsistencias en alta concurrencia
   Prioridad: Media

DECISIONES PROVISIONALES

1. Formato de codigo de sorteo
   Formato actual: SRT-YYMM-XXXXXX (ej: SRT-2412-A1B2C3)
   Ubicacion: sorteos.service.ts metodo generarCodigo()
   Estado: PROVISIONAL - puede modificarse segun requerimientos de negocio
   Referencia: DOCUMENTO 32 no especifica formato exacto

SUPUESTOS IMPLICITOS ACEPTADOS

1. Migraciones Prisma
   Supuesto: Se ejecutaran con npm run db:migrate
   Dependencia: Base de datos PostgreSQL configurada previamente

2. Rol por defecto
   Supuesto: El rol "usuario" se crea automaticamente en primer registro
   Ubicacion: users.service.ts metodo create()

3. Numeracion de boletos
   Supuesto: Secuencial comenzando en 1 por sorteo
   Ubicacion: participaciones.service.ts

4. Fecha de sorteo opcional
   Supuesto: Un sorteo puede no tener fecha fija de celebracion
   Ubicacion: schema.prisma campo fechaSorteo

5. Relacion ganadorId sin FK
   Supuesto: Campo ganadorId en Premio es string sin relacion explicita
   Motivo: Flexibilidad para asignar ganador sin restriccion de integridad
   Ubicacion: schema.prisma modelo Premio

RESTRICCIONES CUMPLIDAS

- No flujos de dinero: CUMPLIDA
- No KYC: CUMPLIDA
- No mensajeria automatica: CUMPLIDA
- No panel admin: CUMPLIDA
- No GitHub: CUMPLIDA

FIN DEL DOCUMENTO
