/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Barrel export para el módulo legal-consents
 */

// Module
export { LegalConsentsModule } from './legal-consents.module';

// Service
export { LegalConsentsService } from './legal-consents.service';

// Controllers
export { LegalConsentsController } from './legal-consents.controller';
export { AdminLegalConsentsController } from './admin-legal-consents.controller';

// Constants & Enums
export {
  ConsentType,
  ConsentContext,
  DocumentType,
  ConsentReferenceType,
  REQUIRED_CONSENTS_BY_CONTEXT,
  CONSENT_TO_DOCUMENT_TYPE,
  CONSENT_CONFIG,
  CONSENT_ERRORS,
  CONSENT_UX_TEXTS,
  isValidVersion,
  compareVersions,
  buildRaffleConsentType,
  extractRaffleIdFromConsentType,
  requiresReferenceId,
} from './legal-consents.constants';

// DTOs
export {
  RecordConsentDto,
  RecordBulkConsentsDto,
  CheckConsentDto,
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  FilterConsentsDto,
  ConsentResponseDto,
  ConsentHistoryResponseDto,
  ConsentCheckResponseDto,
  LegalDocumentResponseDto,
  LegalDocumentsListResponseDto,
  ConsentUxTextResponseDto,
  RequiredConsentsResponseDto,
  ConsentStatsResponseDto,
  ConsentSuccessResponseDto,
} from './dto/legal-consents.dto';
