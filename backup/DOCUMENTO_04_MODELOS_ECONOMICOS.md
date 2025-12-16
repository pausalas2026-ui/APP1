# DOCUMENTO 4 — CAPÍTULO 3: MODELOS ECONÓMICOS

## 3.1. Flujo Económico de Productos
Actores involucrados:
- Propietario del producto (creador)
- Promotor N1, Afiliador N2
- Plataforma
- Causa activa (si aplica)

Reglas:
- Comisión total la define el creador
- Motor económico NO puede alterarla
- % de N1 y N2 dependen del plan del promotor

## 3.2. Flujo Económico de Donaciones
Ejemplo de reparto:
- 70% → Causa destino
- 20% → Generador de causa
- 5% → Plataforma
- 5% → Promotor

Reglas:
- Promotor puede donar 0-100% de SU PARTE
- Donación se asigna a causa ACTIVA (no base)
- Donación independiente de venta
- Puede haber donación sin compra

## 3.3. Flujo Económico de Sorteos
- Sorteos de plataforma o usuarios (Premium/Elite)
- Pueden generar comisiones por promoción
- Donaciones por participar siguen flujo normal

## 3.4. Modelo de 4 Actores (Regla de Oro)
En TODO flujo económico:
1. Plataforma
2. Promotor
3. Generador de causa
4. Causa destino

Ocasionalmente: Afiliador, Creador producto

## 3.5. Comisiones MLM
- Nivel 1: Promotor directo
- Nivel 2: Afiliador del promotor
- NUNCA hay más de 2 niveles
- Multiplicadores por plan

## 3.6. Donación Voluntaria del Promotor
- Campo: donation_preference (0-100%)
- Se aplica automáticamente en cada transacción
- Va a la causa activa

## 3.7. Tipos de Dinero (Tracking Separado)
1. **Dinero de Producto**: Venta del artículo
2. **Dinero de Donación**: Voluntario, no relacionado al precio
3. **Dinero de Comisiones**: De la comisión del creador

Cada tipo: tracking, liquidación, auditoría, reportes SEPARADOS

## 3.8. Ejemplos Numéricos
**Caso 1 - Venta sin donación:**
- Producto = 50€, Comisión = 10% = 5€
- Promotor Elite: 3€, Afiliador Pro: 1€, Plataforma: 1€

**Caso 2 - Venta con donación:**
- Donación: 2€
- Causa: 1.40€, Generador: 0.40€, Plataforma: 0.10€, Promotor: 0.10€

**Caso 3 - Promotor dona 100%:**
- Su parte va directo a causa activa
