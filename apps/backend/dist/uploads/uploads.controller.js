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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const path_1 = require("path");
const fs_1 = require("fs");
let UploadsController = class UploadsController {
    upload(files, req) {
        const basePath = '/static/uploads';
        const origin = `${req.protocol}://${req.get('host')}`;
        const urls = (files || []).map((f) => `${origin}${basePath}/${f.filename}`);
        return { urls };
    }
    listUploads(req, type) {
        const uploadsDir = (0, path_1.join)(process.cwd(), 'apps', 'backend', 'uploads');
        const basePath = '/static/uploads';
        const origin = `${req.protocol}://${req.get('host')}`;
        const files = (0, fs_1.readdirSync)(uploadsDir, { withFileTypes: true })
            .filter((d) => d.isFile())
            .map((d) => d.name)
            .filter((name) => {
            if (!type)
                return true;
            const lower = name.toLowerCase();
            const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
            const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.amr'];
            const matches = (exts) => exts.some((ext) => lower.endsWith(ext));
            return type === 'image' ? matches(imageExts) : matches(audioExts);
        });
        const items = files.map((filename) => ({
            filename,
            url: `${origin}${basePath}/${filename}`,
        }));
        return { items };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 2)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "listUploads", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'))
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map