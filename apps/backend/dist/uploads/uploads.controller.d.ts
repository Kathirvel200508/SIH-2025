import type { Request } from 'express';
export declare class UploadsController {
    upload(files: Express.Multer.File[], req: Request): {
        urls: string[];
    };
    listUploads(req: Request, type?: 'image' | 'audio'): {
        items: {
            filename: string;
            url: string;
        }[];
    };
}
