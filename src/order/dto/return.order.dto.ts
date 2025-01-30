import { IsNotEmpty, IsString } from "class-validator";

export class ReturnOrderDto {
    @IsNotEmpty()
    @IsString()
    reason:string
}