# DOCUMENTO 8 — SISTEMA DE PLANES

## 8.1. Objetivo
- Incrementar valor del usuario al subir de nivel
- Incentivar upgrade, aumentar ingresos plataforma
- Profesionalizar promotores

## 8.2. Plan Free
**Capacidades:**
- Puede ser promotor N1, invitar afiliados
- Promover productos, causas, sorteos
- Donar, ganar comisiones (5% multiplicador)

**Limitaciones:**
- NO crear productos, tienda personal, premios
- NO estadísticas avanzadas, feed Premium

## 8.3. Plan Pro
- Todo lo de Free
- Crear productos propios
- Definir comisiones para otros
- Tienda personal
- Feed prioridad media
- Multiplicador: 30%

## 8.4. Plan Premium
- Todo lo de Free y Pro
- Crear premios y sorteos
- Estadísticas avanzadas
- Feed prioridad alta
- Acceso a IA recomendaciones
- Multiplicador: 70%

## 8.5. Plan Elite
- Acceso total a todos los módulos
- Máxima prioridad en feed
- Multiplicador: 100%
- Productos/premios/sorteos ilimitados
- API personal, herramientas avanzadas

## 8.6. Impacto en Comisiones
```
Comisión total = 10€
Elite   → 10€ × 100% = 10.00€
Premium → 10€ ×  70% =  7.00€
Pro     → 10€ ×  30% =  3.00€
Free    → 10€ ×   5% =  0.50€
```

## 8.7. Impacto en Feed
Orden de prioridad: Elite > Premium > Pro > Free

## 8.8. Upgrades y Downgrades
**Upgrade:**
- Módulos desbloqueados inmediatamente
- Multiplicadores cambian en tiempo real

**Downgrade:**
- No desaparecen datos
- Solo bloquean funciones
- Productos pueden congelarse

## 8.9. Persistencia en Backend
```
user.plan_type        // 'free'|'pro'|'premium'|'elite'
user.plan_multiplier  // 0.05|0.30|0.70|1.00
user.plan_capabilities // JSON
user.plan_limits      // JSON
```
