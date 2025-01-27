import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cart } from "./cart.entity";
import { Product } from "src/product/entities/product.entity";

@Entity()
export class CartProduct {
    @PrimaryGeneratedColumn()
    id:number

    @ManyToOne(()=>Cart , cart => cart.cartProducts,{onDelete:'CASCADE'})
    cart:Cart
    
    @ManyToOne(()=>Product , cart => cart.cartProducts,{onDelete:'CASCADE'})
    product:Product

    @Column({type:'int',default:1})
    quantity:number
    @Column({type:'decimal',precision:10,scale:2})
    priceAtTheTime:number
    

}