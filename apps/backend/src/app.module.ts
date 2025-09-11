import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { UploadsModule } from './uploads/uploads.module';
import { GeocodeController } from './geocode.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, ReportsModule, UploadsModule],
  controllers: [AppController, GeocodeController, NotificationsController],
  providers: [AppService, NotificationsService],
})
export class AppModule {}
