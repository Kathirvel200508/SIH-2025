export declare class GeocodeController {
    reverse(latStr?: string, lngStr?: string): Promise<{
        locationName?: string;
    } | {
        error: string;
    }>;
}
