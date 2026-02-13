import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { RetentionService } from './retention.service';

@Controller('clinic/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get('dashboard')
  dashboard() {
    return this.retentionService.dashboard();
  }

  @Get('templates')
  getTemplates() {
    return this.retentionService.getTemplates();
  }

  @Put('templates')
  saveTemplates(@Body() body: any) {
    return this.retentionService.saveTemplates(body);
  }

  @Get('settings')
  getSettings() {
    return this.retentionService.getSettings();
  }

  @Put('settings')
  saveSettings(@Body() body: any) {
    return this.retentionService.saveSettings(body);
  }

  @Post('appointments/:id/reminder')
  reminder(@Param('id') id: string) {
    return this.retentionService.appointmentAction(id, 'reminder');
  }

  @Post('appointments/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.retentionService.appointmentAction(id, 'confirm');
  }

  @Post('appointments/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.retentionService.appointmentAction(id, 'cancel');
  }

  @Post('reactivation/:id/send')
  reactivate(@Param('id') _id: string) {
    return this.retentionService.reactivate();
  }

  @Post('waitlist/:id/call')
  callWaitlist(@Param('id') _id: string) {
    return this.retentionService.waitlistCall();
  }
}
