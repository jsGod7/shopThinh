import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Discount } from "./discount.entity";
import { User } from "src/user/entities/user.entity";

@Entity()
export class DiscountUsageHistory {

    @PrimaryGeneratedColumn()
    id:number
    @ManyToOne(() => Discount, (discount) => discount.discountHistory, { eager: true, nullable: false })
    discount: Discount;
  
    @ManyToOne(()=>User , (abc) => abc.discountHistory,{eager:true,nullable:false})
    user:User
    @Column({type:'decimal',precision:10,scale:2})
    discount_amount:number
    @Column({type:'decimal',precision:10,scale:2})
    order_total:number
    @CreateDateColumn()
    used_at:Date
}