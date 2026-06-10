-- ============================================================
-- SIPAUNA: Limpieza automática de préstamos APROBADO/RECHAZADO
-- ============================================================
-- Descripción: Elimina préstamos con estado APROBADO o RECHAZADO
--              que tengan más de 2 meses de antigüedad.
--
-- Programación: pg_cron, bimestral — día 1 de cada 2 meses a las 3:00 AM
-- ============================================================


-- ── 1. Función almacenada ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_loans()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM "Loan"
    WHERE status IN ('APROBADO', 'RECHAZADO')
      AND "loanDate"::date <= (CURRENT_DATE - INTERVAL '2 months');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'cleanup_old_loans: % préstamo(s) eliminado(s) (ejecutado: %)',
        deleted_count, NOW();
END;
$$;


-- ── 2. Programar limpieza automática con pg_cron ───────────────────────────
--
-- Expresión cron: 0 3 1 */2 *
--   → Minuto 0, hora 3 AM, día 1 del mes, cada 2 meses

SELECT cron.schedule(
    'cleanup-old-loans',        -- nombre único del job (usar en unschedule)
    '0 3 1 */2 *',              -- bimestral: día 1, cada 2 meses, 3:00 AM
    $$ SELECT cleanup_old_loans(); $$
);


-- ── PRUEBA MANUAL ──────────────────────────────────────────────────────────
-- Descomenta el bloque DO para ejecutar la función inmediatamente:


DO $$
BEGIN
    RAISE NOTICE 'Ejecutando limpieza manual de préstamos...';
    PERFORM cleanup_old_loans();
    RAISE NOTICE 'Limpieza manual completada.';
END;
$$;



-- ── REFERENCIA RÁPIDA ──────────────────────────────────────────────────────
--
-- Ver todos los jobs programados:
--   SELECT * FROM cron.job;
--
-- Ver historial de ejecuciones:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Desactivar / eliminar el job:
--   SELECT cron.unschedule('cleanup-old-loans');
-- ============================================================
