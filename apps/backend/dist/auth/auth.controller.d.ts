import { AuthService } from './auth.service';
declare class LoginDto {
    username: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        token: string;
        user: Omit<{
            id: string;
            username: string;
            password: string;
            role: "admin" | "citizen";
        }, "password">;
    }>;
}
export {};
