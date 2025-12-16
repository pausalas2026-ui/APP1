// DOCUMENTO 26 - FASE1 AUTH USERS PLANS
// DOCUMENTO 22 - SEGURIDAD
// Servicio de autenticacion

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Verificar si el email ya existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya esta registrado');
    }

    // Hash de la contrasena
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Crear usuario
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      nombre: registerDto.nombre,
      apellidos: registerDto.apellidos,
    });

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role.nombre);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role.nombre,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Verificar contrasena
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Verificar si esta activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role.nombre);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role.nombre,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token invalido');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role.nombre);

      return tokens;
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
