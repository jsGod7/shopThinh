import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
@Injectable()
export class RedisService {
   public readonly client:Redis
   constructor(){
    this.client = new Redis({
        host:'localhost',
        port:6379,
        connectTimeout:5000,
        retryStrategy:(times)=> Math.min(times*50 , 2000)
    })
    this.client.on('connect',()=> {
        console.log('connected')
    })
    this.client.on('error',(error)=> {
        console.log('failed',error)
    })
   }
   async getProductStock(productId: string): Promise<number> {
    const stock = await this.client.get(`stock:${productId}`);
    return stock ? parseInt(stock, 10) : 0;
  }

  // Cập nhật tồn kho trong Redis
  async updateProductStock(productId: string, stock: number): Promise<void> {
    await this.client.set(`stock:${productId}`, stock.toString());
  }

  // Đặt khóa khi sản phẩm đang được xử lý
  async lockProductStock(productId: string): Promise<boolean> {
    const lock = await this.client.set(`lock:${productId}`, 'locked', 'EX', 10); // Thời gian khóa là 10 giây
    return lock === 'OK';
  }

  // Mở khóa sau khi xử lý xong
  async unlockProductStock(productId: string): Promise<void> {
    await this.client.del(`lock:${productId}`);
  }
  
  

}
