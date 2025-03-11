import { BadGatewayException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { Roles } from "../common/user.role.enum";
import { ROLES_KEY } from "../decorators/authorize-role.decorator";

@Injectable()
export class AuthorizeGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
    
        if (!requiredRoles) {
          return true; 
        }
    
        const { user } = context.switchToHttp().getRequest();
        if (!user || !requiredRoles.includes(user.role)) {
          throw new ForbiddenException('Bạn không có quyền truy cập!');
        }
    
        return true;
      }
}