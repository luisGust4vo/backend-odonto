import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { OdontogramService } from './odontogram.service';

@Controller('clinic/odontogram')
export class OdontogramController {
  constructor(private readonly odontogramService: OdontogramService) {}

  @Get()
  getByPatient(@Query('patientId') patientId: string) {
    return this.odontogramService.getByPatient(String(patientId || ''));
  }

  @Put(':patientId')
  save(@Param('patientId') patientId: string, @Body() body: any) {
    return this.odontogramService.save(patientId, body);
  }
}
