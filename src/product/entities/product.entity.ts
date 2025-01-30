
// src/product/entities/product.entity.ts
import { User } from 'src/user/entities/user.entity';
import { ProductType } from 'src/util/common/product.type.enum';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Electronic } from './subEntities/electronic.entity';
import { Clothing } from './subEntities/clothing.entity';
import { Furniture } from './subEntities/furniture.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { CartProduct } from 'src/cart/entities/cartProduct.entity';
import { OrderProduct } from 'src/order/entities/orderProduct.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'varchar', length: 255 })
  product_thumb: string;

  @Column({ type: 'text', nullable: true })
  product_description: string;

  @Column({ type: 'varchar', nullable: true })
  product_slug: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  product_price: number;

  @Column({ type: 'int' })
  product_quantity: number;

  @Column({type:'enum',enum:ProductType,default:ProductType.ELECTRONIC})
  product_type:ProductType

  

  @Column({ type: 'jsonb', nullable: true })
  product_attributes: Record<string, any>;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 4.5 })
  product_ratingsAverage: number;

  @Column({ type: 'jsonb', default: [] })
  product_variations: any[];

  @Column({ type: 'boolean', default: true })
  isDraft: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' }) // Nếu tên cột trong cơ sở dữ liệu là created_at
  createdAt: Date;  


  @UpdateDateColumn()
  updatedAt: Date

  //relation

  @ManyToOne(()=>User,user => user.product)
  user:User
  
  @OneToOne(() => Electronic , (el )=> el.electroncProduct)
  electronic:Electronic
  @OneToOne(() => Clothing , (el )=> el.clothingProduct)
  clothing:Clothing
  @OneToOne(() => Furniture , (el )=> el.furnitureProduct)
  furniture:Furniture

  @OneToMany(()=>Comment , (comment) => comment.product)
  comments:Comment[]

  @OneToMany(()=>Inventory , (inven) => inven.inven_product)
  inventories:Inventory[]

  @OneToMany(()=>CartProduct,abc => abc.product)
  cartProducts:CartProduct[]

  @OneToMany(() => OrderProduct , orderProduct => orderProduct.product)
  orderProducts:OrderProduct
 



}