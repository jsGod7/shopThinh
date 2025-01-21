import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from "typeorm"
import { Product } from "../product.entity"
import { User } from "src/user/entities/user.entity"

@Entity('clothing')
export class Clothing{
    @PrimaryGeneratedColumn()
    id:number
    @Column()
    manufacturer:string
    @Column()
    model:string
    @Column()
    color:string
    @ManyToOne(()=>User,user => user.clothing)
    userClothing:User
    @OneToOne(() =>Product,pro=>pro.clothing,{onDelete:'CASCADE'})
    @JoinColumn({name:'id'})
    clothingProduct:Product

}