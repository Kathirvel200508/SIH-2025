"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3101',
            'http://localhost:3102',
        ],
        credentials: true,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'apps', 'backend', 'uploads'), {
        prefix: '/static/uploads',
    });
    await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
//# sourceMappingURL=main.js.map