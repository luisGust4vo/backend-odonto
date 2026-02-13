import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdontogramEntity } from './odontogram.entity';

@Injectable()
export class OdontogramService {
  constructor(
    @InjectRepository(OdontogramEntity)
    private readonly repo: Repository<OdontogramEntity>,
  ) {}

  async getByPatient(patientId: string) {
    const data = await this.repo.findOne({ where: { patientId } });
    if (!data) {
      return {
        selectedTeeth: [],
        toothNotes: {},
        toothDetails: {},
      };
    }

    return {
      selectedTeeth: data.selectedTeeth || [],
      toothNotes: data.toothNotes || {},
      toothDetails: data.toothDetails || {},
    };
  }

  async save(patientId: string, body: any) {
    let record = await this.repo.findOne({ where: { patientId } });
    if (!record) {
      record = this.repo.create({ patientId });
    }

    record.selectedTeeth = body.selectedTeeth || [];
    record.toothNotes = body.toothNotes || {};
    record.toothDetails = body.toothDetails || {};
    await this.repo.save(record);

    return { message: 'Odontograma salvo com sucesso.' };
  }
}
