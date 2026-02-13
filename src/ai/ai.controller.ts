import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('dental-chat')
  @UseInterceptors(FileInterceptor('image'))
  dentalChat(@UploadedFile() _file: any, @Body() body: any) {
    return this.aiService.dentalChat(body?.message);
  }
}
