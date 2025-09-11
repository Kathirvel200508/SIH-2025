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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
class CreateReportDto {
    title;
    description;
    priority;
    category;
    attachments;
    location;
    locationName;
}
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async testCreate(body) {
        const userId = 'test-user';
        const username = 'Test User';
        let locationName = body.locationName;
        if (!locationName && body.location?.lat && body.location?.lng) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${body.location.lat}&lon=${body.location.lng}`);
                if (res.ok) {
                    const data = await res.json();
                    const addr = data?.address || {};
                    const city = addr.city || addr.town || addr.village;
                    const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
                    locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
                }
            }
            catch { }
        }
        return this.reportsService.create({
            title: body.title,
            description: body.description,
            priority: body.priority,
            category: body.category ?? 'other',
            createdByUserId: userId,
            createdByUsername: username,
            attachments: body.attachments,
            location: body.location,
            locationName,
        });
    }
    async create(req, body) {
        const userId = req.user?.userId ?? 'unknown';
        const username = req.user?.username ?? 'unknown';
        let locationName = body.locationName;
        if (!locationName && body.location?.lat && body.location?.lng) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${body.location.lat}&lon=${body.location.lng}`);
                if (res.ok) {
                    const data = await res.json();
                    const addr = data?.address || {};
                    const city = addr.city || addr.town || addr.village;
                    const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
                    locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
                }
            }
            catch { }
        }
        return this.reportsService.create({
            title: body.title,
            description: body.description,
            priority: body.priority,
            category: body.category ?? 'other',
            createdByUserId: userId,
            createdByUsername: username,
            attachments: body.attachments,
            location: body.location,
            locationName,
        });
    }
    list(category, q) {
        return this.reportsService.list({ category, locationQuery: q });
    }
    listMine(req) {
        const userId = req.user?.userId ?? 'unknown';
        return this.reportsService.listByUser(userId);
    }
    update(id, body) {
        const updated = this.reportsService.update(id, { status: body.status, priority: body.priority });
        if (!updated)
            return { error: 'Not found' };
        return updated;
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)('test-create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "testCreate", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('citizen'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Array)
], ReportsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('citizen'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Array)
], ReportsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], ReportsController.prototype, "update", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map