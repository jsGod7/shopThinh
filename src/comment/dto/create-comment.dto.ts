import { IsNumber, IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateCommentDto {
    userId: number;
  
    content: string;
  
    parentCommentId?: number;
  }
