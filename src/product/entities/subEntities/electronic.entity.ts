import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from "typeorm"
import { Product } from "../product.entity"
import { User } from "src/user/entities/user.entity"

@Entity('electronics')
export class Electronic {
    @PrimaryGeneratedColumn()
    id:number
    @Column()
    brand:string
    @Column()
    material:string
    @Column()
    size:string
    @ManyToOne(()=>User,user => user.electronic)
    userElectronic:User
    @OneToOne(() =>Product,pro=>pro.electronic,{onDelete:'CASCADE'})
    @JoinColumn({name:'id'})
    electroncProduct:Product

}