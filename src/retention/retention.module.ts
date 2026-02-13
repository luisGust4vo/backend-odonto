import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionAppointmentEntity } from './retention-appointment.entity';
import { RetentionReactivationEntity } from './retention-reactivation.entity';
import { RetentionWaitlistEntity } from './retention-waitlist.entity';
import { RetentionConfigEntity } from './retention-config.entity';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetentionAppointmentEntity,
      RetentionReactivationEntity,
      RetentionWaitlistEntity,
      RetentionConfigEntity,
    ]),
  ],
  controllers: [RetentionController],
  providers: [RetentionService],
})
export class RetentionModule {}
