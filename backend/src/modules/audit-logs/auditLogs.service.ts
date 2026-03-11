import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './auditLog.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(): Promise<AuditLog[]> {
    return await this.auditLogRepository.find();
  }

  async findOne(id: string): Promise<AuditLog> {
    return await this.auditLogRepository.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.auditLogRepository.delete(id);
  }
}