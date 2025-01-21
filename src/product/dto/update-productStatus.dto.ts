import { IsBoolean } from "class-validator";

export class UpdateStatusProductDto {
    isDraft?:boolean
    isPublished?:boolean
}