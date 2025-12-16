// DOCUMENTO 03 - ACTORES Y ROLES
// Controller de roles

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // GET /api/v1/roles
  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  // GET /api/v1/roles/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  // POST /api/v1/roles
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  // PUT /api/v1/roles/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  // DELETE /api/v1/roles/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  // POST /api/v1/roles/:id/permissions
  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    return this.rolesService.assignPermissions(id, permissionIds);
  }
}
