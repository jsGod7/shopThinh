import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from './entities/apiKey.entity';
import { Repository } from 'typeorm';
import { CreateApiKeyDto } from './dtos/create-apiKey.dto';

@Injectable()
export class ApiKeyService {
    constructor(@InjectRepository(ApiKey) private readonly apiKeyRepository:Repository<ApiKey>){}
    async createkey(createApiKey:CreateApiKeyDto) {
        const newKey = this.apiKeyRepository.create(createApiKey)
        await this.apiKeyRepository.save(newKey)
        return newKey
    }

    async findKeyById(key:string) {
        const foundKey = await this.apiKeyRepository.findOne({where:{key}})
        if(!foundKey) throw new NotFoundException('key not found !!!')
        return foundKey
    }


}
