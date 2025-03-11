import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dtos/signUp.dto';
import { SignInDto } from './dtos/signIn.dto';
import e, { query, Request, Response } from 'express';
import { User } from './entities/user.entity';
import { updateUserDto } from './dtos/update-user.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Ctx, RmqContext } from '@nestjs/microservices';
import { FindUserDto } from './dtos/searchUser.dto';
import { Roles } from 'src/util/common/user.role.enum';
import { AuthorizeGuard } from 'src/util/guard/authorization.guard';
import { AuthenticationGuard } from 'src/util/guard/authentication.guard';
import { AuthorizeRoles } from 'src/util/decorators/authorize-role.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly amqpConnection:AmqpConnection,
    private readonly userService: UserService) {}

  @Post('signup')
  async signUp(@Body()signUpDto:SignUpDto ,) {
    const res = await this.amqpConnection.request({
      exchange: 'user_exchange',
      routingKey: 'user_signUp',
      payload: signUpDto,
    })
    return res
   
    
  }
  @Post('signin')
async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
  const response = await this.amqpConnection.request<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }>({
    exchange: 'user_exchange',
    routingKey: 'user_signIn',
    payload: signInDto,
  });

  if (!response) throw new UnauthorizedException('Invalid credentials');

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  return {
    user: response.user,
    accessToken: response.accessToken,
  };
}

@Post('refresh-token')
async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const refreshToken = req.cookies?.refreshToken; 
  if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

  const response = await this.amqpConnection.request<{
    accessToken: string;
    refreshToken: string;
  }>({
    exchange: 'user_exchange',
    routingKey: 'refresh_token',
    payload: { refreshToken },
  });

  if (!response) throw new UnauthorizedException('Invalid refresh token');

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken: response.accessToken };
}



  
@Patch(':id')
async updateUser(
  @Param('id') id: string,
  @Body() updateUserDto: Partial<User>,
) {
  const updateUser = await this.amqpConnection.request({
    exchange: 'user_exchange',
    routingKey: 'user_update',
    payload: { id: Number(id), ...updateUserDto }  
  });

  return { msg: 'User updated successfully', user: updateUser };
}

  
  @Get('users')
  async findAllUsers(@Query() query: FindUserDto) {
    const payload = {
      limit: Number(query.limit) || 10,
      page: Number(query.page) || 1,
      sort: query.sort || 'createdAt:desc',
      filters: {
        name: query.filters?.name || null,
        role: query.filters?.role || null,
      },
      lastHitSort: query.lastHitSort || null, 
    };

    const response = await this.amqpConnection.request<{
      users: any[];
      total: number;
      page: number;
      limit: number;
      lastHitSort?: any[];
    }>({
      exchange: 'user_exchange',
      routingKey: 'user_findAll',
      payload,
    });

    if (!response || !response.users) {
      throw new BadRequestException('Error fetching users');
    }

    console.log(response);

    return response;
  }
  
  @Post('forgot-password')
  async forgotPassword(@Body('email')email:string) {
    return await this.amqpConnection.request({
      exchange:'user_exchange',
      routingKey:'user_forgotPassword',
      payload:{email}
    })
  } 
  @Post('reset-password')
  async resetPassword(@Body('email')email:string,@Body('password')password:string , @Body('resetToken') resetToken:string):Promise<User> {
    return this.amqpConnection.request({
      exchange:'user_exchange',
      routingKey:'reset_password',
      payload:{email,password ,resetToken}
    })
  }

  


  @Post('create-user')
  @AuthorizeRoles(Roles.ADMIN)
  @UseGuards(AuthenticationGuard,AuthorizeGuard)
  async createUser(@Body() createUserDto: updateUserDto) {
    try {
      console.log('📤 Sending request to user_create:', createUserDto);

      const createUser = await this.amqpConnection.request({
        exchange: 'user_exchange',
        routingKey: 'user_create',
        payload: { ...createUserDto },
        timeout: 15000, 
      });

      console.log('✅ Response from microservice:', createUser); 

      return { msg: 'User created successfully', user: createUser };
    } catch (error) {
      console.error('❌ Error from microservice:', error.message);
      throw new BadRequestException('Failed to create user');
    }
  }
  @Delete(':id')
  @AuthorizeRoles(Roles.ADMIN)
  @UseGuards(AuthenticationGuard,AuthorizeGuard)
  async deleteUser(@Param('id')id:string) {
    const response = await this.amqpConnection.request({
      exchange:'user_exchange',
      routingKey:'user_delete',
      payload:{id}
    })
    return {msg:'User deleted successfully' , user:response}
    
  }


  
  }

  

 



