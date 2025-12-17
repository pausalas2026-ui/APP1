-- ============================================================================
-- MIGRACIÓN: INMUTABILIDAD DE AUDIT_LOGS
-- GAP CRÍTICO #1 - BLOQUE 3
-- Referencia: DOCUMENTO 37 - Sección 6 (Regla de Inmutabilidad)
-- Fecha: 17 diciembre 2025
-- ============================================================================

-- Propósito:
-- Este trigger garantiza que los registros de auditoría (audit_logs) sean
-- INMUTABLES a nivel de base de datos. Ningún UPDATE ni DELETE será permitido,
-- independientemente de quién intente ejecutarlo (aplicación, DBA, scripts).

-- ============================================================================
-- PASO 1: Crear función que bloquea modificaciones
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Bloquear UPDATE
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 
            'VIOLACIÓN DE INMUTABILIDAD: Los registros de audit_logs NO pueden ser modificados. '
            'Referencia: DOC 37 Sección 6. '
            'Operación bloqueada: UPDATE sobre registro id=%', OLD.id;
    END IF;
    
    -- Bloquear DELETE
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 
            'VIOLACIÓN DE INMUTABILIDAD: Los registros de audit_logs NO pueden ser eliminados. '
            'Referencia: DOC 37 Sección 6. '
            'Operación bloqueada: DELETE sobre registro id=%', OLD.id;
    END IF;
    
    -- Este punto nunca debería alcanzarse
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 2: Crear trigger que intercepta UPDATE y DELETE
-- ============================================================================

-- Eliminar trigger si existe (para idempotencia)
DROP TRIGGER IF EXISTS audit_logs_immutability_trigger ON audit_logs;

-- Crear trigger BEFORE UPDATE OR DELETE
CREATE TRIGGER audit_logs_immutability_trigger
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- PASO 3: Revocar permisos de UPDATE y DELETE al rol de aplicación
-- (Capa adicional de seguridad - ajustar nombre de rol según entorno)
-- ============================================================================

-- NOTA: Descomentar y ajustar según el rol de base de datos usado por la aplicación
-- REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
-- GRANT INSERT, SELECT ON audit_logs TO app_user;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Estas consultas fallarán si el trigger está activo (usar solo para testing):
-- UPDATE audit_logs SET event_type = 'TEST' WHERE id = 'xxx';
-- DELETE FROM audit_logs WHERE id = 'xxx';

-- ============================================================================
-- METADATA DE MIGRACIÓN
-- ============================================================================

COMMENT ON TRIGGER audit_logs_immutability_trigger ON audit_logs IS 
    'GAP CRÍTICO #1 - BLOQUE 3: Garantiza inmutabilidad de logs de auditoría. '
    'Referencia: DOCUMENTO 37 Sección 6. Fecha: 17-12-2025';

COMMENT ON FUNCTION prevent_audit_log_modification() IS 
    'Función que bloquea UPDATE y DELETE en audit_logs. '
    'Lanza excepción con mensaje descriptivo y referencia a documentación.';
