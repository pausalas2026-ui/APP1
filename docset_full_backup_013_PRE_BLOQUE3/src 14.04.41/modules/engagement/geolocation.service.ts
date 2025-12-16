/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Servicio de geolocalización de donaciones
 * 
 * DOC36: El tablero del creador de la causa DEBE mostrar visualmente:
 * - desde qué países se generan donativos
 * - desde qué regiones / ciudades
 * - volumen por zona
 * 
 * 👉 "Esto genera orgullo, motivación y hábito de entrada."
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDonationGeoDto,
  CauseGeoStatsResponseDto,
  CountryGeoStatsDto,
  RecentLocationDto,
} from './dto/engagement.dto';
import { ENGAGEMENT_ERRORS } from './engagement.constants';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra la geolocalización de una donación
   * DOC36: Cada donación debe tener su origen geográfico registrado
   */
  async registerDonationGeo(dto: RegisterDonationGeoDto): Promise<void> {
    this.logger.log(
      `Registering geo for donation ${dto.donationId} from ${dto.countryCode}`
    );

    await this.prisma.donationGeolocation.create({
      data: {
        donationId: dto.donationId,
        causeId: dto.causeId,
        userId: dto.userId,
        countryCode: dto.countryCode.toUpperCase(),
        countryName: dto.countryName,
        region: dto.region,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        amount: dto.amount,
        currency: dto.currency || 'EUR',
      },
    });

    // Verificar si es un nuevo país para la causa
    await this.checkNewCountryMilestone(dto.causeId, dto.countryCode);
  }

  /**
   * Obtiene estadísticas geográficas de una causa
   * DOC36: Mapa del mundo con países iluminados según donaciones
   */
  async getCauseGeoStats(causeId: string): Promise<CauseGeoStatsResponseDto> {
    this.logger.log(`Getting geo stats for cause ${causeId}`);

    // Verificar que existe la causa
    const causeExists = await this.prisma.cause.findUnique({
      where: { id: causeId },
    });

    if (!causeExists) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.CAUSE_NOT_FOUND);
    }

    // Obtener agregaciones por país
    const countryStats = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode', 'countryName'],
      where: { causeId },
      _count: { id: true },
      _sum: { amount: true },
    });

    // Obtener donantes únicos por país
    const donorsByCountry = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode'],
      where: { causeId, userId: { not: null } },
      _count: { userId: true },
    });

    // Obtener ciudades top por país
    const citiesByCountry = await this.getCitiesByCountry(causeId);

    // Mapear resultados
    const countries: CountryGeoStatsDto[] = countryStats.map((stat) => {
      const donorStat = donorsByCountry.find(
        (d) => d.countryCode === stat.countryCode
      );
      const cities = citiesByCountry[stat.countryCode] || [];

      return {
        code: stat.countryCode,
        name: stat.countryName,
        donationCount: stat._count.id,
        totalAmount: Number(stat._sum.amount) || 0,
        uniqueDonors: donorStat?._count.userId || 0,
        topCities: cities.slice(0, 5),
      };
    });

    // Ordenar por monto total
    countries.sort((a, b) => b.totalAmount - a.totalAmount);

    // Obtener ubicaciones recientes
    const recentLocations = await this.getRecentLocations(causeId, 10);

    // Calcular totales
    const totalCountries = countries.length;
    const allCities = new Set<string>();
    countries.forEach((c) => c.topCities?.forEach((city) => allCities.add(city)));

    const totals = countries.reduce(
      (acc, c) => ({
        donations: acc.donations + c.donationCount,
        amount: acc.amount + c.totalAmount,
      }),
      { donations: 0, amount: 0 }
    );

    return {
      causeId,
      totalCountries,
      totalCities: allCities.size,
      totalDonations: totals.donations,
      totalAmount: totals.amount,
      countries,
      recentLocations,
    };
  }

  /**
   * Obtiene el resumen rápido para el tablero
   * DOC36: Contador tipo "Tu causa ha recibido apoyo desde 7 países"
   */
  async getQuickGeoSummary(
    causeId: string
  ): Promise<{ countries: number; message: string }> {
    const uniqueCountries = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode'],
      where: { causeId },
    });

    const count = uniqueCountries.length;
    const message =
      count === 0
        ? 'Aún no hay donaciones'
        : count === 1
        ? 'Tu causa ha recibido apoyo desde 1 país'
        : `Tu causa ha recibido apoyo desde ${count} países`;

    return { countries: count, message };
  }

  /**
   * Obtiene los países únicos de una causa
   */
  async getUniqueCountries(causeId: string): Promise<string[]> {
    const countries = await this.prisma.donationGeolocation.findMany({
      where: { causeId },
      distinct: ['countryCode'],
      select: { countryCode: true },
    });

    return countries.map((c) => c.countryCode);
  }

  /**
   * Verifica si una nueva donación es de un país nuevo
   * DOC36: Hito "Nuevo país" dispara mensaje
   */
  async checkNewCountryMilestone(
    causeId: string,
    countryCode: string
  ): Promise<boolean> {
    // Contar donaciones anteriores de este país para esta causa
    const previousDonations = await this.prisma.donationGeolocation.count({
      where: {
        causeId,
        countryCode: countryCode.toUpperCase(),
      },
    });

    // Si es la primera (contando la actual), es un nuevo país
    const isNewCountry = previousDonations === 1;

    if (isNewCountry) {
      this.logger.log(`New country milestone for cause ${causeId}: ${countryCode}`);
      // Aquí se podría emitir evento para el motor de mensajería
      // await this.messagingService.emitEvent(...)
    }

    return isNewCountry;
  }

  /**
   * Obtiene las ciudades agrupadas por país
   */
  private async getCitiesByCountry(
    causeId: string
  ): Promise<Record<string, string[]>> {
    const cities = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode', 'city'],
      where: { causeId, city: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const result: Record<string, string[]> = {};

    cities.forEach((c) => {
      if (c.city) {
        if (!result[c.countryCode]) {
          result[c.countryCode] = [];
        }
        result[c.countryCode].push(c.city);
      }
    });

    return result;
  }

  /**
   * Obtiene las ubicaciones más recientes
   */
  private async getRecentLocations(
    causeId: string,
    limit: number
  ): Promise<RecentLocationDto[]> {
    const locations = await this.prisma.donationGeolocation.findMany({
      where: { causeId, city: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        city: true,
        countryName: true,
        createdAt: true,
      },
    });

    return locations.map((l) => ({
      city: l.city || 'Unknown',
      country: l.countryName,
      timestamp: l.createdAt,
    }));
  }

  /**
   * Obtiene estadísticas globales de geolocalización (admin)
   */
  async getGlobalGeoStats(): Promise<{
    totalCountries: number;
    topCountries: CountryGeoStatsDto[];
    totalDonationsTracked: number;
  }> {
    const countryStats = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode', 'countryName'],
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const uniqueCountries = await this.prisma.donationGeolocation.groupBy({
      by: ['countryCode'],
    });

    const totalDonations = await this.prisma.donationGeolocation.count();

    return {
      totalCountries: uniqueCountries.length,
      topCountries: countryStats.map((stat) => ({
        code: stat.countryCode,
        name: stat.countryName,
        donationCount: stat._count.id,
        totalAmount: Number(stat._sum.amount) || 0,
        uniqueDonors: 0, // Simplificado para global
      })),
      totalDonationsTracked: totalDonations,
    };
  }
}
