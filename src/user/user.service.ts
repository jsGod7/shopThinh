import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignUpDto } from './dtos/signUp.dto';
import {hash , compare} from 'bcrypt'
import { EmailService } from 'src/email/email.service';
import { SignInDto } from './dtos/signIn.dto';
import {sign} from 'jsonwebtoken'
import  { Response } from 'express';
import { updateUserDto } from './dtos/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq'
@Injectable()
export class UserService  {
    constructor(@InjectRepository(User)
                private readonly userRepository:Repository<User>,
                private emailService:EmailService,
                private readonly amqpConnection:AmqpConnection            
    ){

      console.log('📡 Kết nối RabbitMQ:', amqpConnection ? 'Thành công' : 'Thất bại');
    }
    async findOne(id:number) {
      const user = await this.userRepository.findOneBy({id})
      if(!user) throw new NotFoundException('user not found')
      return user 
    }
   
   
    
    async logout(res:Response) {
      res.clearCookie('refreshToken')
    }
    
  
    


    async findUserByEmail(email:string)
    {
        return await this.userRepository.findOneBy({email})
    }

}
