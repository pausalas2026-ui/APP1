// DOCUMENTO 03 - ACTORES Y ROLES
// Modulo de usuarios, roles y permisos

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [UsersController, RolesController],
  providers: [UsersService, RolesService, PermissionsService],
  exports: [UsersService, RolesService, PermissionsService],
})
export class UsersModule {}
