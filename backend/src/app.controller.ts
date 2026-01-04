import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      message: 'PPA Backend API is running',
      timestamp: new Date().toISOString(),
    };
  }
}

