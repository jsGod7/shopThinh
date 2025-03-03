import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailModule } from 'src/email/email.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports:[TypeOrmModule.forFeature([User]),EmailModule,
  RabbitMQModule.forRoot({
    exchanges: [
      { name: 'notifications_exchange', type: 'topic' },
    ],
    uri:'amqp://guest:guest@localhost:5672',
    enableControllerDiscovery:true,
    
    

  }),
  
  ],
  controllers: [UserController],
  providers: [UserService],
  exports:[UserService]
})
export class UserModule {}
