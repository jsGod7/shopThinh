import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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


@Injectable()
export class UserService {
    constructor(@InjectRepository(User)
                private readonly userRepository:Repository<User>,
                private emailService:EmailService
    ){}

    async signup(signupDto:SignUpDto):Promise<User>{
      const userExist = await this.findUserByEmail(signupDto.email)
      if(userExist) throw new BadRequestException('EMAIL VALID')
      signupDto.password = await hash(signupDto.password,10)
      const newUser = this.userRepository.create({
        email:signupDto.email,
        password:signupDto.password,
        name:signupDto.name
      })
      const saveUser = await this.userRepository.save(newUser)
      await this.emailService.sendConfirmationEmail(signupDto.email)
      return saveUser
    }

    async signIn(signInDto:SignInDto) {
      const userExist  = await this.userRepository.createQueryBuilder('users').addSelect('users.password').where('users.email=:email',{email:signInDto.email}).getOne()
      if(!userExist) throw new BadRequestException('Bad Creaditial')
      const matchPassword = await compare(signInDto.password,userExist.password)
      if(!matchPassword) throw new BadRequestException('Bad Creaditial')
      delete userExist.password
      return userExist
    }
    async accessToken(user:User) {
      return sign({
        id:user.id,
        email:user.email
      },process.env.ACCESSTOKEN_KEY,{
        expiresIn:'10 days'
      })
    }
    async findOne(id:number) {
      const user = await this.userRepository.findOneBy({id})
      if(!user) throw new NotFoundException('user not found')
      return user 
    }
    async refreshToken(user:User,res:Response) {
      const refreshtoken =  sign({
        id:user.id,
        email:user.email
      },process.env.REFRESHTOKEN_KEY,{
        expiresIn:'30 days'
      })
      res.cookie('refreshToken',refreshtoken)
      return refreshtoken
    }
    
    async updateUser(id:number,updateUserDto:updateUserDto): Promise<User & updateUserDto> {
      const user = await this.findOne(id)
      if(!user) throw new NotFoundException('user not found')
      const update = Object.assign(user,updateUserDto)
      if(update.password) update.password = await this.generateHash(updateUserDto.password)
      await this.emailService.updateUser(user.email)
      return await this.userRepository.save(update)
    }
    async logout(res:Response) {
      res.clearCookie('refreshToken')
    }
    async generateHash(oassword:string) {
      return await hash(oassword,10)
    }
    async forgotPassword(email:string):Promise<User> {
      const user = await this.findUserByEmail(email) 
      if(user) 
      {
        const resetToken = sign({email},process.env.ACCESSTOKEN_KEY,{expiresIn:'1h'})
        user.resetToken = resetToken
        await this.userRepository.save(user)
        await this.emailService.sendMailResetPassword(user.email,resetToken)
      }
      return user
    }
    async resetPassword(email:string,password:string):Promise<User> {
      const user = await this.findUserByEmail(email) 
      if(user) {
        const hashPassword = await this.generateHash(password) 
        user.password  = hashPassword
        user.resetToken = null
        delete user.password
        await this.userRepository.save(user)
      }
      return user
    }


    async findUserByEmail(email:string)
    {
        return await this.userRepository.findOneBy({email})
    }

}
