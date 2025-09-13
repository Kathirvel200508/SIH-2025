import { NotificationsService } from '../notifications.service';
export type ReportPriority = 'low' | 'medium' | 'high';
export type ReportStatus = 'in_progress' | 'accepted' | 'rejected' | 'finished';
export type ReportCategory = 'sewage' | 'electricity' | 'waste' | 'roads' | 'transport' | 'other';
export interface Report {
    id: string;
    title: string;
    description: string;
    priority: ReportPriority;
    priorityScore?: number;
    upvotes?: number;
    upvotedBy?: string[];
    status: ReportStatus;
    category: ReportCategory;
    createdAt: string;
    createdByUserId: string;
    createdByUsername?: string;
    attachments?: string[];
    location?: {
        lat: number;
        lng: number;
    };
    locationName?: string;
}
export declare class ReportsService {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    private reports;
    create(report: Omit<Report, 'id' | 'createdAt' | 'status' | 'upvotes' | 'upvotedBy' | 'priority'>): Report;
    list(filters?: {
        category?: ReportCategory;
        locationQuery?: string;
    }): Report[];
    listByUser(userId: string): Report[];
    update(id: string, update: Partial<Pick<Report, 'status' | 'priority'>>): Report | undefined;
    upvote(id: string, userId: string): Report | undefined;
    listByArea(userLocation?: {
        lat: number;
        lng: number;
    }, radiusKm?: number): Report[];
    private calculateDistance;
    private deg2rad;
    addTestReports(): number;
    private priorityToBaseScore;
    private seedSampleData;
}
