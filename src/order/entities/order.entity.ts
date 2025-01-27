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
  
  @Entity()
  export class Order {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, (user) => user.orders, { eager: true })
    user: User;
  
    @Column({ type: 'jsonb', nullable: false })
    orderProducts: Array<{
      productId: number;
      quantity: number;
      price: number;
      discount: number;
    }>; // Danh sách sản phẩm trong đơn hàng
  
    @Column({ type: 'float', nullable: false })
    totalPrice: number; // Tổng giá trị đơn hàng
  
    @Column({
      type: 'enum',
      enum: ['pending', 'confirmed', 'shipped', 'cancelled', 'delivered'],
      default: 'pending',
    })
    status: string; // Trạng thái đơn hàng
  
    @Column({ type: 'jsonb', default: {} })
    shippingInfo: Record<string, any>; // Thông tin vận chuyển
  
    @Column({ type: 'varchar', default: null, nullable: true })
    trackingNumber: string; // Số theo dõi vận đơn
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  