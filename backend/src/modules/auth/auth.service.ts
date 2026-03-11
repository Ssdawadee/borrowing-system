import { Injectable } from '@nestjs/common';
import { User } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    return this.usersService.createUser(username, hashedPassword);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findUserByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<{ accessToken: string }> {
    const payload: JwtPayload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}