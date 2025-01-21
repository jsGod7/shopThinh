import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dtos/create-apiKey.dto';

@Controller('api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}
  @Post()
  async createKey(@Body()createApiKeyDto:CreateApiKeyDto) {
    return this.apiKeyService.createkey(createApiKeyDto)
  }
  @Get(':id')
  async findById(@Param('id') key:string) {
    const res = await this.apiKeyService.findKeyById(key)
    return res
  }
}
