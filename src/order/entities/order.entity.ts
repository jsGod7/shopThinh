import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
  import { User } from 'src/user/entities/user.entity';
  import { Product } from 'src/product/entities/product.entity';
import { OrderProduct } from './orderProduct.entity';
  
  @Entity()
  export class Order {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, (user) => user.orders, { eager: true })
    user: User;
  
    @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, {
      cascade: true,
      eager: true,  
    })
    orderProducts:OrderProduct[]
    @Column({ type: 'float', nullable: false })
    totalPrice: number; // Tổng giá trị đơn hàng
  
    @Column({
      type: 'enum',
      enum: ['pending', 'confirmed', 'shipped', 'cancelled', 'delivered', 'returned'],
      default: 'pending',
    })
    status: string; // Trạng thái đơn hàng
  
    @Column({ type: 'jsonb', default: {} })
    shippingInfo: {
      address: string;
      phoneNumber: string;
      deliveryMethod: 'standard' | 'express' | 'same-day';
      shippingCost: number;
      estimatedDeliveryDate: string; 
      trackingNumber: string;
      trackingUrl: string;
      carrier: 'VNPost' | 'Giao Hàng Nhanh' | 'Viettel Post'; 
      status: 'processing' | 'shipped' | 'delivered' | 'failed';
      instructions?: string; 
    }
    
    @Column({nullable:true})
    returnReason:string
  
    @Column({ type: 'varchar', default: null, nullable: true })
    trackingNumber: string; 
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
    
   
  }
  