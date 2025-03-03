import { IsOptional, IsInt, Min, IsString, Matches, IsObject, IsArray } from 'class-validator';

export class FindUserDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]+:(asc|desc)$/, { message: 'Sort format must be field:asc or field:desc' })
  sort?: string = 'createdAt:desc';

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  lastHitSort?: any[];
}
