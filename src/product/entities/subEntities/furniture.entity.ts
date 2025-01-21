import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, PrimaryColumn } from "typeorm"
import { Product } from "../product.entity"
import { User } from "src/user/entities/user.entity"

@Entity('furnitures')
export class Furniture{
    @PrimaryColumn()
    id:number
    @Column()
    brand:string
    @Column()
    material:string
    @Column()
    size:string
    @ManyToOne(()=>User,user => user.furniture)
    userFurniture:User
    @OneToOne(() =>Product,pro=>pro.furniture,{onDelete:'CASCADE'})
    @JoinColumn({name:'id'})
    furnitureProduct:Product

}