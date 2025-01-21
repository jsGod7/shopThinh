import { Injectable, NestMiddleware } from "@nestjs/common";
import { isArray } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";

declare global {
    namespace Express {
        interface Request {
            currentUser?: User;
        }
    }
}
@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
    constructor(private userService:UserService){}
    async use(req:Request , res:Response , next:NextFunction) {
        const authHeaders = req.headers.authorization || req.headers.Authorization
        if(!authHeaders || isArray(authHeaders) || !authHeaders.startsWith('Bearer '))
        {
            req.currentUser = null
            next()
            return;
        }
        else {
            try {
                const token =authHeaders.split(' ')[1]
                const {id} = <JwtPayload> verify(token,process.env.ACCESSTOKEN_KEY)
                const currentUser = await this.userService.findOne(+id)
                req.currentUser = currentUser
                next()
            } catch (error) {
                req.currentUser = null
                next()
            }
        }
        
    }
}
interface JwtPayload {
    id:string
}