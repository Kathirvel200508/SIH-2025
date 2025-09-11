import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type UserRecord = {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'citizen';
};

const USERS: UserRecord[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: '2', username: 'user', password: 'user123', role: 'citizen' },
];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<Omit<UserRecord, 'password'>> {
    const user = USERS.find((u) => u.username === username && u.password === password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const token = await this.jwtService.signAsync({ sub: user.id, role: user.role, username: user.username });
    return { token, user };
  }
}



