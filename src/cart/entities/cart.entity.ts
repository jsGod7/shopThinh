import { Product } from "src/product/entities/product.entity";
import { User } from "src/user/entities/user.entity";
import { CartItemStatus } from "src/util/common/cartItemStatus.type.enum";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CartProduct } from "./cartProduct.entity";

@Entity()
export class Cart {

    @PrimaryGeneratedColumn()
    id:number

    @Column({
        type:'enum',
        enum:[CartItemStatus.C1,CartItemStatus.C2,CartItemStatus.C3,CartItemStatus.C4],
        default:CartItemStatus.C1
    })
    cart_state:string
    
    @Column({default:0})
    cart_count_product:number

    @ManyToOne(()=>User , user =>user.carts ,{onDelete:'CASCADE'})
    user:User

    @OneToMany(()=>CartProduct , abc => abc.cart)
    cartProducts:CartProduct[]

    @CreateDateColumn()
    createdAt:Date
    @UpdateDateColumn()
    updatedAt:Date
}
