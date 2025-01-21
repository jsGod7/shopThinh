import { Product } from "src/product/entities/product.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";

@Entity()
export class Inventory {
    @PrimaryGeneratedColumn()
    id:number
    @ManyToOne(()=>Product , (pro) =>pro.inventories,{eager:true})
    inven_product:Product
    @Column({default:'unknonw'})
    inven_location:string
    @Column({type:'int',nullable:false})
    inven_stock:number
    @ManyToOne(() =>User , (user) => user.inventories, { eager: true })
    inven_user: User; // Mối quan hệ với Shop
  
    @Column({ type: 'json', default: [] })
    inven_reservations: any[]; 
  
    @CreateDateColumn({ name: 'createdOn' })
    createdOn: Timestamp; 
  
    @UpdateDateColumn({ name: 'updatedOn' })
    updatedAt: Timestamp; 
  
}
