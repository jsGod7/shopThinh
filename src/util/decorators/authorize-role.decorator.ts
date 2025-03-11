import { SetMetadata } from "@nestjs/common";
import { Roles } from "../common/user.role.enum"

export const ROLES_KEY = 'roles'
export const AuthorizeRoles = (...roles: Roles[]) => SetMetadata(ROLES_KEY, roles);