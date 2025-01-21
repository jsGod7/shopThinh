import { User } from 'src/user/entities/user.entity';
import { DsicountAppliesTo } from 'src/util/common/discount.type.enum';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Timestamp,
  } from 'typeorm';

  
  @Entity('discounts') // COLLECTION_NAME
  export class Discount {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', nullable: false })
    discount_name: string;
  
    @Column({ type: 'text', nullable: false })
    discount_description: string;
  
    @Column({ type: 'varchar', default: 'fixed_amount' })
    discount_type: string;
  
    @Column({ type: 'decimal', nullable: false  ,precision:10,scale:2})
    discount_value: number;
  
    @Column({ type: 'varchar', nullable: false })
    discount_code: string;
  
    @Column({ type: 'timestamp', nullable: false })
    discount_start_date: Date;
  
    @Column({ type: 'timestamp', nullable: false })
    discount_end_date: Date;
  
    @Column({ type: 'int', nullable: false })
    discount_max_uses: number;
  
    @Column({ type: 'int', nullable: false })
    discount_uses_count: number;
  
    @Column({ type: 'simple-array', default: [] })
    discount_users_used: string[]; 
  
    @Column({ type: 'int', nullable: false })
    discount_max_uses_per_users: number;
  
    @Column({ type: 'decimal', nullable: false ,precision:10,scale:2})
    discount_min_order_value: number;
  
    @ManyToOne(() => User, (user) => user.discounts, { eager: true, nullable: false })
    discount_user: User; 
  
    @Column({ type: 'boolean', nullable: false })
    discount_is_active: boolean;
  
    @Column({
        type: 'enum',
        enum: DsicountAppliesTo,
        default: DsicountAppliesTo.ALL,
        nullable: false,
      })
    discount_applies_to: DsicountAppliesTo;

    @Column()
    discount_max_value:number
  
    @Column({ type: 'simple-array', default: [] })
    discount_product_ids: string[]; 
  
    @CreateDateColumn()
    createdAt: Timestamp;
  
    @UpdateDateColumn()
    updatedAt: Timestamp;
  }
  