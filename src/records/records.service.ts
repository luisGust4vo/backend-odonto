import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientRecordEntity } from './patient-record.entity';

const generateId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(PatientRecordEntity)
    private readonly repo: Repository<PatientRecordEntity>,
  ) {}

  async list() {
    await this.ensureSeed();
    const patients = await this.repo.find({ order: { createdAt: 'ASC' } });
    return { patients };
  }

  async addTimeline(patientId: string, body: any) {
    const patient = await this.repo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado.');

    const entry = {
      id: generateId('timeline'),
      createdAt: new Date().toISOString(),
      professional: 'Profissional da clínica',
      type: body.type || 'evolution',
      content: body.content || '',
    };

    patient.timeline = [entry, ...(patient.timeline || [])];
    await this.repo.save(patient);
    return entry;
  }

  async addAttachment(patientId: string, fileName: string, fileType: string) {
    const patient = await this.repo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado.');

    const attachment = {
      id: generateId('att'),
      fileName,
      fileType,
      uploadedAt: new Date().toISOString(),
    };

    patient.attachments = [attachment, ...(patient.attachments || [])];
    await this.repo.save(patient);
    return attachment;
  }

  private async ensureSeed() {
    const count = await this.repo.count();
    if (count > 0) return;

    const sample = this.repo.create({
      name: 'Mariana Ferreira',
      phone: '(11) 98888-1200',
      birthDate: '1992-03-18',
      riskLevel: 'low',
      allergies: ['Nenhuma'],
      lastVisit: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      nextVisit: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      timeline: [],
      treatmentPlan: [],
    });

    await this.repo.save(sample);
  }
}
