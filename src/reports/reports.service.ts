import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalReportEntity } from './report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DentalReportEntity)
    private readonly repo: Repository<DentalReportEntity>,
  ) {}

  async create(body: any) {
    const report = this.repo.create({
      reportNumber: `LAU-${Date.now()}`,
      payload: body || {},
    });
    const saved = await this.repo.save(report);

    return {
      id: saved.id,
      reportNumber: saved.reportNumber,
      message: 'Laudo odontológico salvo com sucesso.',
    };
  }
}
