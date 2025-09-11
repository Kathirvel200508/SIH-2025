import { JwtService } from '@nestjs/jwt';
type UserRecord = {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'citizen';
};
export declare class AuthService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    validateUser(username: string, password: string): Promise<Omit<UserRecord, 'password'>>;
    login(username: string, password: string): Promise<{
        token: string;
        user: Omit<UserRecord, "password">;
    }>;
}
export {};
