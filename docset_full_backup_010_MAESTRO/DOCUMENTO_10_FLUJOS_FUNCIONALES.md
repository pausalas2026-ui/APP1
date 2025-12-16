# DOCUMENTO 10 — FLUJOS FUNCIONALES CLAVE

## 10.1. Registro y Asignación de Código
1. Usuario ingresa datos + código afiliación (opcional)
2. Backend valida código
3. Si válido → usuario.referred_by = propietario código
4. Asigna plan Free
5. Genera tokens JWT
6. Crea nodo en árbol MLM (nivel 1)
7. Registro auditoría

## 10.2. Promoción de Producto
1. Promotor selecciona producto aprobado
2. Se genera enlace con su código
3. Comprador compra
4. Motor Económico calcula:
   - Comisión total
   - Comisión N1 y N2
   - Multiplicadores por plan
   - Donación voluntaria promotor
5. Causa recibe, plataforma recibe

## 10.3. Donación desde Carrito
1. Comprador añade productos
2. Campo donación sugiere 1€
3. Confirma compra
4. Motor Económico separa:
   - Precio productos
   - Donación (evento propio)
5. Causa recibe donación

## 10.4. Sorteo con Donación
1. Creador Premium/Elite crea premio
2. Admin aprueba sorteo
3. Usuarios donan para participar
4. Al cerrar sorteo:
   - Motor selecciona ganador
   - Audita proceso
   - Notifica ganador

## 10.5. Upgrade de Plan
1. Usuario solicita Pro/Premium/Elite
2. Pasarela de pago
3. Backend actualiza:
   - user.plan
   - user.plan_multiplier
4. Acceso inmediato a nuevas funciones

## 10.6. Selección de Causa Activa
1. Promotor accede a "Mis Causas"
2. Cambia causa activa
3. Todas sus acciones van a nueva causa

## 10.7. Campaña de Causa
1. Generador crea campaña con objetivo
2. Promotores comparten
3. Barra progreso avanza
4. Al alcanzar → notificación

## 10.8. Creación de Producto (Pro+)
1. Usuario Pro crea producto
2. Define título, precio, comisión
3. Producto en estado "pendiente"
4. Admin revisa y aprueba
5. Publicado en marketplace

## 10.9. Liquidación de Comisiones
1. Motor acumula comisiones
2. Proceso periódico calcula pagables
3. Usuario solicita retiro
4. Admin valida
5. Pago ejecutado
