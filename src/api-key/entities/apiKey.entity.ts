import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";

@Entity()
export class ApiKey {
    @PrimaryGeneratedColumn()
    id:number
    @Column()
    key:string
    @Column({default:true})
    status:boolean
    @CreateDateColumn()
    createdAt:Timestamp
    @UpdateDateColumn()
    updatedAt:Timestamp

}