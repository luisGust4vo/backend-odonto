import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OdontogramEntity } from './odontogram.entity';
import { OdontogramController } from './odontogram.controller';
import { OdontogramService } from './odontogram.service';

@Module({
  imports: [TypeOrmModule.forFeature([OdontogramEntity])],
  controllers: [OdontogramController],
  providers: [OdontogramService],
})
export class OdontogramModule {}
