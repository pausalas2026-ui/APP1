/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Barrel export para el módulo engagement
 */

// Module
export { EngagementModule } from './engagement.module';

// Services
export { MessagingService } from './messaging.service';
export { GeolocationService } from './geolocation.service';
export { CauseUpdatesService } from './cause-updates.service';

// Controllers
export { EngagementController } from './engagement.controller';
export { AdminEngagementController } from './admin-engagement.controller';

// Constants & Enums
export {
  MessageChannel,
  MessagePriority,
  CauseUpdateType,
  MilestoneType,
  EngagementEvent,
  SupportedLanguage,
  MessageReferenceType,
  EVENT_CHANNELS,
  IMMEDIATE_EVENTS,
  FREQUENCY_LIMITS,
  CAUSE_MILESTONES,
  DONOR_MILESTONES,
  MILESTONE_MESSAGES,
  DEFAULT_LANGUAGE,
  COUNTRY_TO_LANGUAGE,
  TEMPLATE_VARIABLES,
  ENGAGEMENT_ERRORS,
  isImmediateEvent,
  getChannelsForEvent,
  getLanguageByCountry,
} from './engagement.constants';

// DTOs
export {
  SendMessageDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  InternalMessageResponseDto,
  InternalMessagesListDto,
  MarkMessagesReadDto,
  CreateCauseUpdateDto,
  CauseUpdateResponseDto,
  CauseUpdatesListDto,
  RegisterDonationGeoDto,
  CountryGeoStatsDto,
  RecentLocationDto,
  CauseGeoStatsResponseDto,
  MessageTemplateResponseDto,
  MessageTemplatesListDto,
  EngagementStatsResponseDto,
  EngagementSuccessResponseDto,
} from './dto/engagement.dto';
