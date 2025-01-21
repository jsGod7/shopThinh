import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'
dotenv.config()

@Injectable()
export class EmailService {
    private transporter;
    constructor(){
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465, // Cổng SSL
            secure: true, // Sử dụng SSL
            auth: {
              user: process.env.EMAIL_USERNAME, // Email từ .env
              pass: process.env.EMAIL_PASSWORD, // App Password từ .env
            },
          });
          
    }
    async sendConfirmationEmail(email:string) {
        const mailOptions = {
            from:process.env.EMAIL_USERNAME,
            to:email,
            subject:'Xác nhận tài khoản',
            html:`<p> bạn đã đăng kí thành công tài khoản </p>`
        }
        
        try {
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error(error)
        }
    }
    async updateUser(email:string) {
        const mailOptions = {
            from:process.env.EMAIL_USERNAME,
            to:email,
            subject:'cập nhật tài khoản',
            html:`<p> tài khoản của bạn vừa được cập nhật </p>` 
        }
        await this.transporter.sendMail(mailOptions)
    }
    async sendMailResetPassword(email:string,resetToken:string) {
        const mailOptions = {
            from:process.env.EMAIL_USERNAME,
            to:email,
            subject:'Reset password',
            text:`Please click on the following link to reset your password ${resetToken}` ,
            html:`<p> Please click <a href="${resetToken}">here</a> to reset your password </p>` 
        }
        await this.transporter.sendMail(mailOptions)
    }
}

    

