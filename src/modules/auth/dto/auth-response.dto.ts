import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: '2024-11-23T10:30:00.000Z' })
  expiresIn: string;

  @ApiProperty({ example: '2024-11-30T10:30:00.000Z' })
  refreshExpiresIn: string;
}
