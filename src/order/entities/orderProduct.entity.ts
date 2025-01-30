import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    JoinColumn,
  } from 'typeorm';
  import { Order } from './order.entity';
  import { Product } from 'src/product/entities/product.entity';
  
  @Entity()
  export class OrderProduct {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Order, (order) => order.orderProducts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' }) // Khóa ngoại tới bảng Order
    order: Order;
  
    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' }) // Khóa ngoại tới bảng Product
    product: Product;
  
    @Column({ type: 'int' })
    quantity: number;
  
    @Column({ type: 'float' })
    price: number;
  }
  