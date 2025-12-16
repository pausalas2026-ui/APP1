# DOCUMENTO 15 — ENDPOINTS API REST

## Base URL: /api/v1

## 1. AUTH (Autenticación)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/register | Registro nuevo usuario |
| POST | /auth/login | Iniciar sesión |
| POST | /auth/logout | Cerrar sesión |
| POST | /auth/refresh | Renovar token |
| POST | /auth/forgot-password | Solicitar reset password |
| POST | /auth/reset-password | Cambiar password con token |
| GET | /auth/verify-email/:token | Verificar email |
| GET | /auth/me | Obtener usuario actual |

## 2. USERS (Usuarios)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /users/:id | Obtener perfil usuario |
| PUT | /users/:id | Actualizar perfil |
| GET | /users/:id/roles | Obtener roles usuario |
| POST | /users/:id/roles | Asignar rol |
| DELETE | /users/:id/roles/:role | Remover rol |
| GET | /users/:id/plan | Plan actual |
| POST | /users/:id/plan/upgrade | Upgrade plan |

## 3. PRODUCTS (Productos)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /products | Listar productos (público) |
| GET | /products/:id | Detalle producto |
| POST | /products | Crear producto (seller) |
| PUT | /products/:id | Actualizar producto |
| DELETE | /products/:id | Eliminar producto |
| POST | /products/:id/images | Subir imagen |
| DELETE | /products/:id/images/:imageId | Eliminar imagen |
| PATCH | /products/:id/status | Cambiar estado |
| GET | /products/my | Mis productos (seller) |

## 4. TRANSACTIONS (Transacciones)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /transactions | Crear transacción (checkout) |
| GET | /transactions/:id | Detalle transacción |
| GET | /transactions/my/purchases | Mis compras |
| GET | /transactions/my/sales | Mis ventas |
| POST | /transactions/:id/refund | Solicitar reembolso |
| GET | /transactions/:id/breakdown | Desglose económico |

## 5. DONATIONS (Donaciones)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /donations | Listar donaciones (público) |
| GET | /donations/:id | Detalle donación |
| GET | /donations/my | Mis donaciones |
| GET | /donations/cause/:causeId | Donaciones por causa |
| GET | /donations/stats | Estadísticas globales |

## 6. CAUSES (Causas)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /causes | Listar causas activas |
| GET | /causes/:id | Detalle causa |
| POST | /causes | Crear causa (ONG) |
| PUT | /causes/:id | Actualizar causa |
| DELETE | /causes/:id | Eliminar causa |
| GET | /causes/:id/donations | Donaciones de causa |
| GET | /causes/:id/progress | Progreso causa |
| GET | /causes/my | Mis causas (ONG) |

## 7. COMMISSIONS (Comisiones)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /commissions/my | Mis comisiones |
| GET | /commissions/:id | Detalle comisión |
| GET | /commissions/my/pending | Comisiones pendientes |
| GET | /commissions/my/paid | Comisiones pagadas |
| GET | /commissions/my/stats | Estadísticas comisiones |

## 8. PROMOTIONS (Promociones MLM)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /promotions/my-code | Mi código promocional |
| GET | /promotions/my-network | Mi red (afiliados) |
| GET | /promotions/my-stats | Estadísticas promoción |
| POST | /promotions/track/:code | Registrar visita con código |
| GET | /promotions/leaderboard | Top promotores |

## 9. RAFFLES (Sorteos)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /raffles | Listar sorteos activos |
| GET | /raffles/:id | Detalle sorteo |
| GET | /raffles/my-entries | Mis entradas |
| GET | /raffles/:id/entries | Entradas del sorteo |
| GET | /raffles/history | Historial sorteos |
| GET | /raffles/:id/winner | Ganador del sorteo |

## 10. PRIZES (Premios)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /prizes | Listar premios |
| GET | /prizes/:id | Detalle premio |
| POST | /prizes | Crear premio (Premium/Elite) |
| PUT | /prizes/:id | Actualizar premio |
| DELETE | /prizes/:id | Eliminar premio |
| POST | /prizes/:id/raffle | Iniciar sorteo con premio |

## 11. NOTIFICATIONS
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /notifications | Mis notificaciones |
| PUT | /notifications/:id/read | Marcar como leída |
| PUT | /notifications/read-all | Marcar todas leídas |
| DELETE | /notifications/:id | Eliminar notificación |
| GET | /notifications/unread-count | Contador no leídas |

## 12. ADMIN
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /admin/users | Listar usuarios |
| PUT | /admin/users/:id/status | Cambiar estado usuario |
| GET | /admin/transactions | Todas las transacciones |
| GET | /admin/commissions | Todas las comisiones |
| PUT | /admin/commissions/:id/approve | Aprobar comisión |
| GET | /admin/settings | Configuración global |
| PUT | /admin/settings/:key | Actualizar configuración |
| GET | /admin/audit-logs | Logs de auditoría |
| GET | /admin/dashboard | Dashboard estadísticas |
| POST | /admin/raffles/:id/draw | Ejecutar sorteo |

## Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid>
```

## Respuestas Estándar
### Éxito
```json
{
  "status": "success",
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

### Error
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Descripción del error"
}
```

## Códigos HTTP
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error
