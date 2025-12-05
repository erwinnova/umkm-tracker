import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ id: '1' } as any);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Test@1234',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test@1234',
        name: 'Test',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password: expect.not.stringContaining(registerDto.password), // Hashed
        }),
      );
    });
  });
});
