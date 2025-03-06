import { Type } from "class-transformer";
import { IsArray, IsInt, IsObject, IsOptional, IsString, Matches, Min } from "class-validator";

export class findProductDto {
    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Limit must be at least 1' })
    @Type(() => Number)
    limit?: number = 10;
  
    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Page must be at least 1' })
    @Type(() => Number)
    page?: number = 1;
  
    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9_.]+:(asc|desc)(,[a-zA-Z0-9_.]+:(asc|desc))*$/, {
      message: 'Sort format must be field:asc or field:desc (multiple fields separated by commas)',
    })
    sort?: string = 'createdAt:desc';
  
    @IsOptional()
    @IsObject({ message: 'Filters must be a valid object' })
    filters?: Record<string, any>;

    @IsOptional()
    @IsArray()
    lastHitSort?: any[];
  }