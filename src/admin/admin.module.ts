import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAdminStrategy } from './jwt/jwt-admin.strategy';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get<string>('ADMIN_JWT_SECRET', 'default_admin_secret')
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [PrismaService, AdminService, JwtAdminStrategy, RolesGuard, Reflector],
  exports: [JwtModule],
})
export class AdminModule {}
