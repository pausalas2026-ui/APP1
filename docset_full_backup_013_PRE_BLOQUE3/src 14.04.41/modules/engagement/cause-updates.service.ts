/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Servicio de actualizaciones de causa
 * 
 * DOC36: El creador de la causa puede:
 * - Crear actualizaciones (texto, imagen, video)
 * - Marcar avances
 * - Compartir logros
 * - Agradecer públicamente
 * 
 * 👉 "El creador se vuelve generador de contenido sin darse cuenta."
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CauseUpdateType,
  EngagementEvent,
  ENGAGEMENT_ERRORS,
} from './engagement.constants';
import {
  CreateCauseUpdateDto,
  CauseUpdateResponseDto,
  CauseUpdatesListDto,
} from './dto/engagement.dto';
import { MessagingService } from './messaging.service';

@Injectable()
export class CauseUpdatesService {
  private readonly logger = new Logger(CauseUpdatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService
  ) {}

  /**
   * Crea una actualización de causa
   * DOC36: El creador puede crear actualizaciones (texto, imagen, video)
   */
  async createUpdate(
    causeId: string,
    userId: string,
    dto: CreateCauseUpdateDto
  ): Promise<CauseUpdateResponseDto> {
    this.logger.log(`Creating update for cause ${causeId} by user ${userId}`);

    // Verificar que la causa existe y el usuario es el creador
    const cause = await this.prisma.cause.findUnique({
      where: { id: causeId },
      select: { id: true, createdBy: true, name: true },
    });

    if (!cause) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.CAUSE_NOT_FOUND);
    }

    if (cause.createdBy !== userId) {
      throw new ForbiddenException(ENGAGEMENT_ERRORS.UNAUTHORIZED_UPDATE);
    }

    // Crear la actualización
    const update = await this.prisma.causeUpdate.create({
      data: {
        causeId,
        createdBy: userId,
        updateType: dto.updateType,
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        isPublic: dto.isPublic ?? true,
        isPinned: dto.isPinned ?? false,
        notifyDonors: dto.notifyDonors ?? true,
        notifyParticipants: dto.notifyParticipants ?? true,
      },
    });

    // Enviar notificaciones si es necesario
    if (dto.notifyDonors || dto.notifyParticipants) {
      await this.sendUpdateNotifications(update, cause.name, dto);
    }

    return this.mapToUpdateResponse(update);
  }

  /**
   * Obtiene actualizaciones de una causa
   */
  async getCauseUpdates(
    causeId: string,
    page: number = 1,
    limit: number = 10,
    publicOnly: boolean = true
  ): Promise<CauseUpdatesListDto> {
    const skip = (page - 1) * limit;

    const where: any = {
      causeId,
      deletedAt: null,
    };

    if (publicOnly) {
      where.isPublic = true;
    }

    const [updates, total] = await Promise.all([
      this.prisma.causeUpdate.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.causeUpdate.count({ where }),
    ]);

    return {
      updates: updates.map(this.mapToUpdateResponse),
      total,
      page,
      limit,
    };
  }

  /**
   * Obtiene una actualización específica
   */
  async getUpdate(updateId: string): Promise<CauseUpdateResponseDto> {
    const update = await this.prisma.causeUpdate.findUnique({
      where: { id: updateId },
    });

    if (!update || update.deletedAt) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.UPDATE_NOT_FOUND);
    }

    return this.mapToUpdateResponse(update);
  }

  /**
   * Actualiza una publicación (solo el creador)
   */
  async updateUpdate(
    updateId: string,
    userId: string,
    dto: Partial<CreateCauseUpdateDto>
  ): Promise<CauseUpdateResponseDto> {
    const existing = await this.prisma.causeUpdate.findUnique({
      where: { id: updateId },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.UPDATE_NOT_FOUND);
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException(ENGAGEMENT_ERRORS.UNAUTHORIZED_UPDATE);
    }

    const updated = await this.prisma.causeUpdate.update({
      where: { id: updateId },
      data: {
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        isPublic: dto.isPublic,
        isPinned: dto.isPinned,
        updatedAt: new Date(),
      },
    });

    return this.mapToUpdateResponse(updated);
  }

  /**
   * Elimina una actualización (soft delete)
   */
  async deleteUpdate(updateId: string, userId: string): Promise<void> {
    const existing = await this.prisma.causeUpdate.findUnique({
      where: { id: updateId },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.UPDATE_NOT_FOUND);
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException(ENGAGEMENT_ERRORS.UNAUTHORIZED_UPDATE);
    }

    await this.prisma.causeUpdate.update({
      where: { id: updateId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Fija/desfija una actualización
   */
  async togglePin(updateId: string, userId: string): Promise<CauseUpdateResponseDto> {
    const existing = await this.prisma.causeUpdate.findUnique({
      where: { id: updateId },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.UPDATE_NOT_FOUND);
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException(ENGAGEMENT_ERRORS.UNAUTHORIZED_UPDATE);
    }

    const updated = await this.prisma.causeUpdate.update({
      where: { id: updateId },
      data: { isPinned: !existing.isPinned },
    });

    return this.mapToUpdateResponse(updated);
  }

  /**
   * Crea actualización automática de hito
   * DOC36: Hitos automáticos que disparan mensajes
   */
  async createMilestoneUpdate(
    causeId: string,
    milestoneType: string,
    progressPercent: number
  ): Promise<void> {
    this.logger.log(`Creating milestone update for cause ${causeId}: ${milestoneType}`);

    const cause = await this.prisma.cause.findUnique({
      where: { id: causeId },
      select: { id: true, createdBy: true, name: true },
    });

    if (!cause) return;

    // Crear actualización automática
    const milestoneMessages: Record<string, string> = {
      PERCENT_25: '¡Un cuarto del camino! Tu causa ha alcanzado el 25% de su objetivo.',
      PERCENT_50: '¡Mitad del objetivo! Tu causa está al 50%.',
      PERCENT_75: '¡Ya casi lo logramos! Tu causa está al 75%.',
      PERCENT_100: '¡META CUMPLIDA! 🎉 Tu causa ha alcanzado el 100% de su objetivo.',
    };

    await this.prisma.causeUpdate.create({
      data: {
        causeId,
        createdBy: cause.createdBy,
        updateType: CauseUpdateType.MILESTONE,
        title: milestoneType.replace('PERCENT_', '') + '% alcanzado',
        content: milestoneMessages[milestoneType] || `Hito alcanzado: ${progressPercent}%`,
        isPublic: true,
        isPinned: false,
        notifyDonors: true,
        notifyParticipants: true,
      },
    });

    // Notificar a donantes y participantes
    await this.notifyMilestone(causeId, cause.name, milestoneType, progressPercent);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Envía notificaciones de actualización
   */
  private async sendUpdateNotifications(
    update: any,
    causeName: string,
    dto: CreateCauseUpdateDto
  ): Promise<void> {
    const recipients: string[] = [];

    // Obtener donantes
    if (dto.notifyDonors) {
      const donors = await this.prisma.donation.findMany({
        where: { causeId: update.causeId },
        distinct: ['userId'],
        select: { userId: true },
      });
      recipients.push(...donors.map((d) => d.userId).filter(Boolean) as string[]);
    }

    // Obtener participantes (de sorteos vinculados a la causa)
    if (dto.notifyParticipants) {
      const participants = await this.prisma.participation.findMany({
        where: {
          raffle: { causeId: update.causeId },
        },
        distinct: ['userId'],
        select: { userId: true },
      });
      recipients.push(...participants.map((p) => p.userId));
    }

    // Eliminar duplicados
    const uniqueRecipients = [...new Set(recipients)];

    // Enviar notificaciones (en lotes para no saturar)
    for (const userId of uniqueRecipients) {
      try {
        await this.messagingService.sendEventMessage(
          EngagementEvent.CAUSE_UPDATE_NEWS,
          userId,
          {
            cause_name: causeName,
            update_title: update.title || 'Nueva actualización',
          }
        );
      } catch (error) {
        this.logger.error(`Failed to notify user ${userId}: ${error.message}`);
      }
    }

    // Marcar que se enviaron notificaciones
    await this.prisma.causeUpdate.update({
      where: { id: update.id },
      data: { notificationSentAt: new Date() },
    });
  }

  /**
   * Notifica hito a usuarios relacionados
   */
  private async notifyMilestone(
    causeId: string,
    causeName: string,
    milestoneType: string,
    progressPercent: number
  ): Promise<void> {
    // Mapear hito a evento
    const eventMap: Record<string, EngagementEvent> = {
      PERCENT_25: EngagementEvent.CAUSE_MILESTONE_25,
      PERCENT_50: EngagementEvent.CAUSE_MILESTONE_50,
      PERCENT_75: EngagementEvent.CAUSE_MILESTONE_75,
      PERCENT_100: EngagementEvent.CAUSE_COMPLETED,
    };

    const event = eventMap[milestoneType];
    if (!event) return;

    // Obtener donantes únicos
    const donors = await this.prisma.donation.findMany({
      where: { causeId },
      distinct: ['userId'],
      select: { userId: true },
    });

    for (const donor of donors) {
      if (donor.userId) {
        try {
          await this.messagingService.sendEventMessage(event, donor.userId, {
            cause_name: causeName,
            progress_percent: progressPercent.toString(),
          });
        } catch (error) {
          this.logger.error(`Failed to notify donor: ${error.message}`);
        }
      }
    }
  }

  /**
   * Mapea a response
   */
  private mapToUpdateResponse = (update: any): CauseUpdateResponseDto => ({
    id: update.id,
    causeId: update.causeId,
    createdBy: update.createdBy,
    updateType: update.updateType as CauseUpdateType,
    title: update.title,
    content: update.content,
    imageUrl: update.imageUrl,
    videoUrl: update.videoUrl,
    isPublic: update.isPublic,
    isPinned: update.isPinned,
    notifyDonors: update.notifyDonors,
    notifyParticipants: update.notifyParticipants,
    notificationSentAt: update.notificationSentAt,
    createdAt: update.createdAt,
    updatedAt: update.updatedAt,
  });
}
