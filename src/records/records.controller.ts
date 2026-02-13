import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordsService } from './records.service';

@Controller('clinic/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  list() {
    return this.recordsService.list();
  }

  @Post(':id/timeline')
  addTimeline(@Param('id') id: string, @Body() body: any) {
    return this.recordsService.addTimeline(id, body);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    const fileName = file?.originalname || `anexo-${Date.now()}`;
    const fileType = body?.type || 'document';
    return this.recordsService.addAttachment(id, fileName, fileType);
  }
}
