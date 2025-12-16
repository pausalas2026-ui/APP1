# DOCUMENTO 11 — CAPÍTULO 10: PRINCIPIOS TÉCNICOS

## 10.1. Separación Lógica/Presentación
- TODA lógica crítica en backend
- Frontend solo: mostrar, enviar, renderizar, navegar
- NUNCA: cálculos económicos, validaciones permisos

## 10.2. API Única para App y Web
- No APIs separadas
- Endpoints genéricos y estructurados
- Reglas verificadas en backend SIEMPRE

## 10.3. Manejo de Errores
```json
{
  "status": "error",
  "code": "PRODUCT_NOT_FOUND",
  "message": "Mensaje descriptivo"
}
```
- No revelar detalles internos
- Registrar en logs
- Códigos únicos para diagnóstico

## 10.4. Autenticación y Autorización
- JWT obligatorio
- Cada endpoint verifica:
  1. ¿Usuario autenticado?
  2. ¿Rol adecuado?
  3. ¿Plan adecuado?
  4. ¿Permisos específicos?
  5. ¿Estado permite operación?

## 10.5. Seguridad por Roles y Planes
- Free NO puede crear productos
- Solo Premium/Elite pueden crear premios
- Validación siempre en backend

## 10.6. Motor Económico Centralizado
- TODO cálculo económico en una única función
- PROHIBIDO copiar fórmulas, calcular fuera del motor

## 10.7. Documentación OpenAPI
- Cada endpoint documentado
- Request/response schema, errores, permisos, ejemplos

## 10.8. Validaciones en Backend
Antes de cualquier operación:
- Rol, plan, permisos, estado usuario
- Datos requeridos, integridad modelo

## 10.9. Prohibición Duplicación Lógica
- Si fórmula existe en motor, NINGÚN otro módulo la replica
- SIEMPRE llamar al motor correspondiente

## 10.10. Testing Obligatorio
- Unitarios, integración, simulaciones
- Motor económico, sorteos, donaciones

## 10.11. Estándares de Código
- Nombres consistentes, servicios modulares
- Carpetas ordenadas, modelos tipados
- Clean architecture recomendada

## 10.12. Prohibiciones Técnicas
❌ Calcular dinero en frontend
❌ Mezclar roles con planes
❌ Exponer IDs sensibles
❌ Ignorar auditoría
❌ Entradas sin sanitizar
❌ Endpoints sin permisos
❌ Código UI con lógica
❌ Variables mágicas

## 10.13. Matriz Acción → Motor
| Acción | Motor |
|--------|-------|
| Venta | Económico |
| Donación | Económico + Donaciones |
| Crear producto | Marketplace |
| Crear causa | Causas |
| Promoción | Tracking |
| Sorteo | Sorteos |
| Comisiones | Comisiones |

## 10.14. Transparencia Total
- Toda acción registrada, auditable, trazable, irreversible

## 10.15. Prevención de Fraude
- Detectar: compras repetidas, múltiples cuentas/IP, anomalías
