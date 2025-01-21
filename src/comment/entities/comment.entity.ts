import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Tree,
    TreeChildren,
    TreeParent,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('comments')
  export class Comment {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    content: string; 
  
    @Column({ default: 0 })
    left: number; 
  
    @Column({ default: 0 })
    right: number; 

    @TreeParent()
    parent: Comment;
  
    @TreeChildren()
    children: Comment[]; 
  
    @Column({ default: false })
    isDeleted: boolean; 
  
    @CreateDateColumn()
    createdAt: Date; 
  
    @UpdateDateColumn()
    updatedAt: Date; 

    //relation

    @ManyToOne(() => Product , (pro) => pro.comments)
    product:Product
    @ManyToOne(() => User , (user) => user.comments)
    user:User
  }
  