import { Cart } from "src/cart/entities/cart.entity";
import { Comment } from "src/comment/entities/comment.entity";
import { Discount } from "src/discount/entities/discount.entity";
import { DiscountUsageHistory } from "src/discount/entities/discountUsageHistory.entity";
import { Order } from "src/order/entities/order.entity";
import { Product } from "src/product/entities/product.entity";
import { Clothing } from "src/product/entities/subEntities/clothing.entity";
import { Electronic } from "src/product/entities/subEntities/electronic.entity";
import { Furniture } from "src/product/entities/subEntities/furniture.entity";
import { Roles } from "src/util/common/user.role.enum";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id:number
    @Column()
    name:string;
    @Column({unique:true})
    email:string;
    @Column({select:false})
    password:string;
    @Column({type:'enum',enum:Roles,array:true,default:[Roles.USER]})
    roles:Roles[]
    @Column({nullable:true})
    resetToken:string
    @CreateDateColumn()
    createdAt:Timestamp
    @UpdateDateColumn()
    updatedAt:Timestamp

    @OneToMany(()=>Product,product=>product.user)
    product:Product[]
    @OneToMany(()=>Electronic,el=>el.userElectronic)
    electronic:Electronic[]
    @OneToMany(()=>Furniture,el=>el.userFurniture)
    furniture:Furniture[]
    @OneToMany(()=>Clothing,el=>el.userClothing)
    clothing:Clothing[]
    @OneToMany(()=> Comment, (comment) => comment.user)
    comments:Comment[]
    @OneToMany(()=>Discount,(discount)=>discount.discount_user)
    discounts:Discount[]
    @OneToMany(()=>DiscountUsageHistory , (user)=>user.user)
    discountHistory:DiscountUsageHistory[]
    @OneToMany(()=>Cart , cart => cart.user)
    carts:Cart[]
    @OneToMany(()=> Order , order => order.user)
    orders:Order[]
}
