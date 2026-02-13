import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetentionAppointmentEntity } from './retention-appointment.entity';
import { RetentionReactivationEntity } from './retention-reactivation.entity';
import { RetentionWaitlistEntity } from './retention-waitlist.entity';
import { RetentionConfigEntity } from './retention-config.entity';

const defaultTemplates = {
  whatsapp: {
    reminder:
      'Olá, {patientName}. Lembrete da sua consulta na {clinicName} em {date} às {time} com {professional} para {procedure}.',
    reactivation:
      'Olá, {patientName}. Sentimos sua falta na {clinicName}. Sua última consulta foi em {lastVisit}.',
    waitlist_call:
      'Olá, {patientName}. Abriu um encaixe para {procedure} na {clinicName}.',
  },
  sms: {
    reminder: '{patientName}, lembrete: consulta {date} {time} na {clinicName}.',
    reactivation:
      '{patientName}, está na hora da revisão odontológica. Última visita: {lastVisit}.',
    waitlist_call: '{patientName}, surgiu encaixe para {procedure}. Deseja confirmar?',
  },
  email: {
    reminder:
      'Prezado(a) {patientName}, confirmamos seu atendimento em {date} às {time}.',
    reactivation:
      'Olá, {patientName}. Notamos que sua última visita foi em {lastVisit}.',
    waitlist_call: 'Olá, {patientName}. Temos encaixe para {procedure}.',
  },
};

const defaultSettings = {
  reminderHoursBefore: 24,
  secondReminderEnabled: true,
  secondReminderHoursBefore: 2,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
};

@Injectable()
export class RetentionService {
  constructor(
    @InjectRepository(RetentionAppointmentEntity)
    private readonly appointmentsRepo: Repository<RetentionAppointmentEntity>,
    @InjectRepository(RetentionReactivationEntity)
    private readonly reactivationRepo: Repository<RetentionReactivationEntity>,
    @InjectRepository(RetentionWaitlistEntity)
    private readonly waitlistRepo: Repository<RetentionWaitlistEntity>,
    @InjectRepository(RetentionConfigEntity)
    private readonly configRepo: Repository<RetentionConfigEntity>,
  ) {}

  async dashboard() {
    await this.ensureSeed();
    const [appointments, reactivation, waitlist] = await Promise.all([
      this.appointmentsRepo.find({ order: { datetime: 'ASC' } }),
      this.reactivationRepo.find({ order: { lastVisit: 'DESC' } }),
      this.waitlistRepo.find({ order: { createdAt: 'DESC' } }),
    ]);
    return { appointments, reactivation, waitlist };
  }

  async getTemplates() {
    const config = await this.getConfig();
    return { templates: config.templates || defaultTemplates };
  }

  async saveTemplates(body: any) {
    const config = await this.getConfig();
    config.templates = body.templates || config.templates;
    await this.configRepo.save(config);
    return { message: 'Templates salvos com sucesso.' };
  }

  async getSettings() {
    const config = await this.getConfig();
    return config.settings || defaultSettings;
  }

  async saveSettings(body: any) {
    const config = await this.getConfig();
    config.settings = { ...(config.settings || defaultSettings), ...body };
    await this.configRepo.save(config);
    return { message: 'Configurações de automação atualizadas.' };
  }

  async appointmentAction(id: string, action: 'reminder' | 'confirm' | 'cancel') {
    if (action === 'confirm' || action === 'cancel') {
      const appt = await this.appointmentsRepo.findOne({ where: { id } });
      if (appt) {
        appt.status = action === 'confirm' ? 'confirmed' : 'canceled';
        await this.appointmentsRepo.save(appt);
      }
    }
    return { message: 'Ação processada com sucesso.' };
  }

  reactivate() {
    return { message: 'Campanha enviada com sucesso.' };
  }

  waitlistCall() {
    return { message: 'Paciente da fila acionado com sucesso.' };
  }

  private async getConfig() {
    let config = await this.configRepo.findOne({ where: { id: 'default' } });
    if (!config) {
      config = this.configRepo.create({
        id: 'default',
        templates: defaultTemplates,
        settings: defaultSettings,
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  private async ensureSeed() {
    const [appointmentsCount, reactivationCount, waitlistCount] = await Promise.all([
      this.appointmentsRepo.count(),
      this.reactivationRepo.count(),
      this.waitlistRepo.count(),
    ]);

    if (appointmentsCount === 0) {
      await this.appointmentsRepo.save(
        this.appointmentsRepo.create({
          patientName: 'Carla Mendes',
          patientPhone: '(11) 98888-1111',
          datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          procedure: 'Limpeza e profilaxia',
          professional: 'Dra. Juliana',
          status: 'pending_confirmation',
          reminderChannel: 'whatsapp',
        }),
      );
    }

    if (reactivationCount === 0) {
      await this.reactivationRepo.save(
        this.reactivationRepo.create({
          patientName: 'Otávio Santos',
          phone: '(11) 95555-4444',
          lastVisit: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString(),
          suggestedReturnInDays: 180,
          priority: 'high',
          notes: 'Último procedimento de canal. Sugestão de revisão.',
        }),
      );
    }

    if (waitlistCount === 0) {
      await this.waitlistRepo.save(
        this.waitlistRepo.create({
          patientName: 'Lucas Andrade',
          phone: '(11) 93333-6666',
          preferredPeriod: 'afternoon',
          treatment: 'Extração de siso',
          urgency: 'high',
        }),
      );
    }

    await this.getConfig();
  }
}
