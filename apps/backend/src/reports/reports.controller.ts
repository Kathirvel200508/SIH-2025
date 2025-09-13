import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { Report, ReportPriority, ReportStatus, ReportCategory } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateReportDto {
  title!: string;
  description!: string;
  category!: ReportCategory;
  attachments?: string[];
  location?: { lat: number; lng: number };
  locationName?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // -------------------
  // PUBLIC TEST ROUTE
  // -------------------
  @Post('test-create')
  async testCreate(@Body() body: CreateReportDto): Promise<Report> {
    // Default test user info
    const userId = 'test-user';
    const username = 'Test User';

    let locationName = body.locationName;
    if (!locationName && body.location?.lat && body.location?.lng) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${body.location.lat}&lon=${body.location.lng}`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village;
          const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
          locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
        }
      } catch {}
    }

    return this.reportsService.create({
      title: body.title,
      description: body.description,
      category: body.category ?? 'other',
      createdByUserId: userId,
      createdByUsername: username,
      attachments: body.attachments,
      location: body.location,
      locationName,
    });
  }

  // -------------------
  // PROTECTED ROUTES
  // -------------------
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('citizen')
  async create(@Req() req: any, @Body() body: CreateReportDto): Promise<Report> {
    const userId = req.user?.userId ?? 'unknown';
    const username = req.user?.username ?? 'unknown';

    let locationName = body.locationName;
    if (!locationName && body.location?.lat && body.location?.lng) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${body.location.lat}&lon=${body.location.lng}`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village;
          const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
          locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
        }
      } catch {}
    }

    return this.reportsService.create({
      title: body.title,
      description: body.description,
      category: body.category ?? 'other',
      createdByUserId: userId,
      createdByUsername: username,
      attachments: body.attachments,
      location: body.location,
      locationName,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  list(@Query('category') category?: ReportCategory, @Query('q') q?: string): Report[] {
    return this.reportsService.list({ category, locationQuery: q });
  }

  @Get('community')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('citizen')
  listCommunity(@Req() req: any, @Query('lat') lat?: string, @Query('lng') lng?: string): Report[] {
    const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
    return this.reportsService.listByArea(userLocation);
  }

  @Get('mine')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('citizen')
  listMine(@Req() req: any): Report[] {
    const userId = req.user?.userId ?? 'unknown';
    return this.reportsService.listByUser(userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: { status?: ReportStatus; priority?: ReportPriority }): Report | { error: string } {
    const updated = this.reportsService.update(id, { status: body.status, priority: body.priority });
    if (!updated) return { error: 'Not found' };
    return updated;
  }

  // Test endpoint to add some reports in common areas
  @Post('test-seed')
  async testSeed(): Promise<{ message: string; count: number }> {
    const count = this.reportsService.addTestReports();
    return { message: 'Test reports added', count };
  }

  @Post(':id/upvote')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('citizen')
  upvote(@Param('id') id: string, @Req() req: any): Report | { error: string } {
    const userId = req.user?.userId ?? 'unknown';
    const updated = this.reportsService.upvote(id, userId);
    if (!updated) return { error: 'Not found' };
    return updated;
  }
}
