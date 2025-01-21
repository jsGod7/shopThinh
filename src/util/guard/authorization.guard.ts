import { BadGatewayException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthorizeGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean {
        const allowedRoles = this.reflector.get<string>('allowedRoles',context.getHandler());
        const request = context.switchToHttp().getRequest()
        const result = request?.currentUser?.roles.map((role:string)=>allowedRoles.includes(role)).find((val:boolean)=>val === true)
        if(result) return true
        throw new BadGatewayException('Sorry , you not authorized')
    }
}