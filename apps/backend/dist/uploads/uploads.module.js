"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const uploads_controller_1 = require("./uploads.controller");
const multer_1 = require("multer");
const path_1 = require("path");
const roles_guard_1 = require("../auth/roles.guard");
let UploadsModule = class UploadsModule {
};
exports.UploadsModule = UploadsModule;
exports.UploadsModule = UploadsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: (0, path_1.join)(process.cwd(), 'apps', 'backend', 'uploads'),
                    filename: (_req, file, cb) => {
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
                    }
                    else {
                        cb(null, false);
                    }
                },
            }),
        ],
        controllers: [uploads_controller_1.UploadsController],
        providers: [roles_guard_1.RolesGuard],
    })
], UploadsModule);
//# sourceMappingURL=uploads.module.js.map