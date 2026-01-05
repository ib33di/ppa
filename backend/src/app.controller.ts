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

  @Get('health')
  @Public()
  health() {
    // Lightweight health check for load balancers / uptime monitors.
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

