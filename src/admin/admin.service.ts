import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from './roles.enum';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async createAdmin(superAdminId: number, dto: CreateAdminDto) {
    const requester = await this.prisma.admin.findUnique({ where: { id: superAdminId } });
    if (!requester || requester.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can create admins');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role ?? Role.ADMIN,
        active: true,
      },
    });

    const { password, ...result } = admin;
    return result;
  }

  async login(dto: CreateAdminDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.active) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { id: admin.id, role: admin.role, email: admin.email };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }

  async updateAdmin(requesterId: number, targetAdminId: number, dto: UpdateAdminDto) {
    const requester = await this.prisma.admin.findUnique({ where: { id: requesterId } });
    if (!requester) throw new ForbiddenException('Invalid requester');

    const target = await this.prisma.admin.findUnique({ where: { id: targetAdminId } });
    if (!target) throw new ForbiddenException('Target admin not found');

    if (requester.role === Role.SUPERADMIN) {
      if (dto.password) {
        dto.password = await bcrypt.hash(dto.password, 10);
      }
      return this.prisma.admin.update({
        where: { id: targetAdminId },
        data: dto,
      });
    }

    if (requester.id === targetAdminId) {
      const allowedFields: Partial<UpdateAdminDto> = {};
      if (dto.name) allowedFields.name = dto.name;
      if (dto.password) allowedFields.password = await bcrypt.hash(dto.password, 10);
      return this.prisma.admin.update({
        where: { id: targetAdminId },
        data: allowedFields,
      });
    }

    throw new ForbiddenException('You are not allowed to update this admin');
  }

  async deleteAdmin(requesterId: number, targetAdminId: number) {
    const requester = await this.prisma.admin.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can delete admins');
    }

    if (requesterId === targetAdminId) {
      throw new ForbiddenException('Superadmin cannot delete themselves');
    }

    return this.prisma.admin.delete({ where: { id: targetAdminId } });
  }
}
