// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Interceptor de logging de acciones admin
// Referencia: DOC 39 seccion 15

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AdminActionInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Solo loguear mutaciones (POST, PUT, DELETE, PATCH)
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (result) => {
          // Log de acción exitosa
          await this.logAdminAction(request, result, null, startTime);
        },
        error: async (error) => {
          // Log de acción fallida
          await this.logAdminAction(request, null, error, startTime);
        },
      }),
    );
  }

  private async logAdminAction(
    request: any,
    result: any,
    error: any,
    startTime: number,
  ) {
    const user = request.user;
    const duration = Date.now() - startTime;

    // Extraer tipo de entidad del path
    const entityType = this.extractEntityType(request.path);
    const entityId = request.params?.id || 'N/A';

    // Sanitizar body para no loguear datos sensibles
    const sanitizedBody = this.sanitizeBody(request.body);

    await this.auditLogService.log({
      eventType: 'ADMIN_ACTION',
      entityType,
      entityId,
      actorId: user?.id || 'UNKNOWN',
      actorType: 'ADMIN',
      metadata: {
        action: request.path,
        method: request.method,
        body: sanitizedBody,
        resultId: result?.id || null,
        success: !error,
        errorMessage: error?.message || null,
        durationMs: duration,
      },
      ipAddress: request.ip,
      userAgent: request.get?.('user-agent'),
      category: 'OPERATIONAL',
    });
  }

  private extractEntityType(path: string): string {
    // /api/admin/users/123 -> User
    // /api/admin/raffles/456 -> Sorteo
    // /api/admin/causes/789 -> Causa
    const segments = path.split('/').filter(Boolean);
    const adminIndex = segments.indexOf('admin');
    
    if (adminIndex >= 0 && segments[adminIndex + 1]) {
      const entityMap: Record<string, string> = {
        'users': 'User',
        'raffles': 'Sorteo',
        'sorteos': 'Sorteo',
        'causes': 'Causa',
        'causas': 'Causa',
        'prizes': 'Premio',
        'premios': 'Premio',
        'money': 'FundLedger',
        'incidents': 'Incident',
        'kyc': 'KycVerification',
        'legal-docs': 'LegalDocument',
        'roles': 'AdminRole',
        'dashboard': 'Dashboard',
      };
      
      const key = segments[adminIndex + 1];
      return entityMap[key] || key.toUpperCase();
    }

    return 'ADMIN_PANEL';
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Campos a ocultar
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'twoFactorSecret',
      'apiKey',
      'privateKey',
    ];

    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
