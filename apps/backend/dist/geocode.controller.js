"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodeController = void 0;
const common_1 = require("@nestjs/common");
let GeocodeController = class GeocodeController {
    async reverse(latStr, lngStr) {
        const lat = latStr ? Number(latStr) : undefined;
        const lng = lngStr ? Number(lngStr) : undefined;
        if (typeof lat !== 'number' || Number.isNaN(lat) || typeof lng !== 'number' || Number.isNaN(lng)) {
            return { error: 'Invalid coordinates' };
        }
        try {
            const googleKey = process.env.GOOGLE_MAPS_KEY;
            if (googleKey) {
                const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${encodeURIComponent(googleKey)}`;
                const gRes = await fetch(gUrl);
                if (gRes.ok) {
                    const gData = await gRes.json();
                    if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
                        const components = gData.results[0].address_components || [];
                        const get = (type) => components.find((c) => (c.types || []).includes(type))?.long_name;
                        const city = get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1');
                        const area = get('sublocality_level_1') || get('sublocality') || get('neighborhood');
                        let locationName = city ? (area ? `${area}, ${city}` : city) : undefined;
                        if (!locationName) {
                            const district = get('administrative_area_level_2');
                            const state = get('administrative_area_level_1');
                            locationName = district || state;
                        }
                        if (!locationName && Array.isArray(gData.results)) {
                            const name = (gData.results[0]?.formatted_address || '')
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s && !/^\d+/.test(s))
                                .slice(0, 2)
                                .join(', ');
                            if (name)
                                locationName = name;
                        }
                        if (locationName)
                            return { locationName };
                    }
                }
            }
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
            const res = await fetch(url, { headers: { 'User-Agent': 'sih-civic-local-dev/1.0 (contact@example.com)' } });
            if (!res.ok)
                return { error: 'Reverse geocoding failed' };
            const data = await res.json();
            const addr = data?.address || {};
            const city = addr.city || addr.town || addr.village;
            const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
            let locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
            if (!locationName) {
                const district = addr.city_district || addr.state_district || addr.county;
                const state = addr.state;
                locationName = district || state;
            }
            if (!locationName) {
                const parts = String(data.display_name || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s && !/^\d+/.test(s))
                    .slice(0, 2);
                if (parts.length)
                    locationName = parts.join(', ');
            }
            return { locationName };
        }
        catch {
            return { error: 'Reverse geocoding error' };
        }
    }
};
exports.GeocodeController = GeocodeController;
__decorate([
    (0, common_1.Get)('reverse'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GeocodeController.prototype, "reverse", null);
exports.GeocodeController = GeocodeController = __decorate([
    (0, common_1.Controller)('geocode')
], GeocodeController);
//# sourceMappingURL=geocode.controller.js.map