import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ManagementGuard } from '../security/management.guard.js';
import { SlotsService } from './slots.service.js';
import { CreateSlotDto, UpdateSlotDto, SlotQueryDto } from './slots.dto.js';
@Controller('slots')
export class SlotsController {
  constructor(@Inject(SlotsService) private readonly slots: SlotsService) {}
  @Get() list(@Query() query: SlotQueryDto) {
    return this.slots.available(query);
  }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.slots.get(id);
  }
  @Post() @UseGuards(ManagementGuard) create(@Body() dto: CreateSlotDto) {
    return this.slots.create(dto);
  }
  @Patch(':id') @UseGuards(ManagementGuard) update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.slots.update(id, dto);
  }
  @Delete(':id') @HttpCode(204) @UseGuards(ManagementGuard) remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.slots.remove(id);
  }
}
