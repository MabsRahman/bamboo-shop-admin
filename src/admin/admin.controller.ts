import { Controller, Post, Body, UseGuards, Req, Param, Put, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminJwtAuthGuard } from './jwt/jwt-auth.guard';
import { Roles } from './roles.decorator';
import { Role } from './roles.enum';
import { RolesGuard } from './roles.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Post('create')
  createAdmin(@Req() req, @Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(req.user.id, dto);
  }

  @Post('login')
  login(@Body() dto: CreateAdminDto) {
    return this.adminService.login(dto);
  }

  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Put(':id')
  updateAdmin(@Req() req, @Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.updateAdmin(req.user.id, +id, dto);
  }

  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  deleteAdmin(@Req() req, @Param('id') id: string) {
    return this.adminService.deleteAdmin(req.user.id, +id);
  }
}
