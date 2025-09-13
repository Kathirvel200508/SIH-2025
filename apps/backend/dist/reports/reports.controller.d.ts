import { ReportsService } from './reports.service';
import type { Report, ReportPriority, ReportStatus, ReportCategory } from './reports.service';
declare class CreateReportDto {
    title: string;
    description: string;
    category: ReportCategory;
    attachments?: string[];
    location?: {
        lat: number;
        lng: number;
    };
    locationName?: string;
}
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    testCreate(body: CreateReportDto): Promise<Report>;
    create(req: any, body: CreateReportDto): Promise<Report>;
    list(category?: ReportCategory, q?: string): Report[];
    listCommunity(req: any, lat?: string, lng?: string): Report[];
    listMine(req: any): Report[];
    update(id: string, body: {
        status?: ReportStatus;
        priority?: ReportPriority;
    }): Report | {
        error: string;
    };
    testSeed(): Promise<{
        message: string;
        count: number;
    }>;
    upvote(id: string, req: any): Report | {
        error: string;
    };
}
export {};
