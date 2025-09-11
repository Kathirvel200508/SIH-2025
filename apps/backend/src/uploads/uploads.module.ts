import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { diskStorage } from 'multer';
import { join } from 'path';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'apps', 'backend', 'uploads'),
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ts = Date.now();
          const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
          cb(null, `${ts}-${safe}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const isImage = file.mimetype?.startsWith('image/');
        const isAudio = file.mimetype?.startsWith('audio/');
        if (isImage || isAudio) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [RolesGuard],
})
export class UploadsModule {}


