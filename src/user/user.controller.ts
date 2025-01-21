import { Body, Controller, Param, Patch, Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dtos/signUp.dto';
import { SignInDto } from './dtos/signIn.dto';
import e, { Response } from 'express';
import { User } from './entities/user.entity';
import { updateUserDto } from './dtos/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signUp(@Body()signUpDto:SignUpDto) {
    const res = await this.userService.signup(signUpDto)
    return res
  }
  @Post('signin')
  async signIn(@Body() signInDto:SignInDto,@Res({passthrough:true}) res:Response):Promise< {
    user:User,
    refreshToken:string,
    accessToken:string
  }> {
    const user = await this.userService.signIn(signInDto)
    const refreshToken = await this.userService.refreshToken(user,res)
    const accessToken = await this.userService.accessToken(user)
    return {user,refreshToken,accessToken}
  }
  
  @Patch(':id')
  async updateUser(@Param('id') id:string , updateUserDto:updateUserDto): Promise<User & updateUserDto> {
    const res = await this.userService.updateUser(+id,updateUserDto)
    return res
  }
  @Post('forgot-password')
  async forgotPassword(@Body('email')email:string) {
    const res = await this.userService.forgotPassword(email)
    return res
  }
  @Post('reset-password')
  async resetPassword(@Body('email')email:string,@Body('password')password:string):Promise<User> {
    const res = await this.userService.resetPassword(email,password)
    return res
  }


}
