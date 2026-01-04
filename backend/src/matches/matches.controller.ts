import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateMatchFromSlotDto } from './dto/create-match-from-slot.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  create(@Body() createMatchDto: CreateMatchDto, @Request() req) {
    return this.matchesService.create({
      ...createMatchDto,
      created_by: req.user.sub,
    });
  }

  /**
   * Slot-driven match creation (used by center grid + right panel flow).
   * The optional `slot_time` is used for availability validation in HH:MM local "wall clock" format.
   */
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  createFromSlot(
    @Body() body: CreateMatchFromSlotDto,
    @Request() req,
  ) {
    return this.matchesService.createFromSlot(
      {
        ...body,
        created_by: req.user.sub,
      },
      body.slot_time,
    );
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('courtId') courtId?: string) {
    if (courtId) {
      return this.matchesService.findByCourt(courtId, status);
    }
    if (status) return this.matchesService.findByStatus(status);
    return this.matchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }
}

