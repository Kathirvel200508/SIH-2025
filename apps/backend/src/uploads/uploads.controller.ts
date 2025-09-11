import { Controller, Post, UploadedFiles, UseGuards, UseInterceptors, Req, Get, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { join } from 'path';
import { readdirSync } from 'fs';

@Controller('uploads')
@UseGuards(AuthGuard('jwt'))
export class UploadsController {
  @Post()
  @UseInterceptors(FilesInterceptor('files', 2))
  upload(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    const basePath = '/static/uploads';
    const origin = `${req.protocol}://${req.get('host')}`;
    const urls = (files || []).map((f) => `${origin}${basePath}/${f.filename}`);
    return { urls };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  listUploads(@Req() req: Request, @Query('type') type?: 'image' | 'audio') {
    const uploadsDir = join(process.cwd(), 'apps', 'backend', 'uploads');
    const basePath = '/static/uploads';
    const origin = `${req.protocol}://${req.get('host')}`;
    const files = readdirSync(uploadsDir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => {
        if (!type) return true;
        const lower = name.toLowerCase();
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
        const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.amr'];
        const matches = (exts: string[]) => exts.some((ext) => lower.endsWith(ext));
        return type === 'image' ? matches(imageExts) : matches(audioExts);
      });
    const items = files.map((filename) => ({
      filename,
      url: `${origin}${basePath}/${filename}`,
    }));
    return { items };
  }
}


