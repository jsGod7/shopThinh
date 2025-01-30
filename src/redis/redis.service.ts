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
   async getProductStock(productId: string): Promise<string> {
    try {
      const stock = await this.client.get(productId);
      return stock || '0';  // Trả về '0' nếu không tìm thấy
    } catch (error) {
      console.error("Error khi lấy tồn kho từ Redis:", error);
      throw new Error("Không thể truy xuất tồn kho từ Redis");
    }
  }
  
  async updateProductStock(productId: string, stock: number): Promise<void> {
    await this.client.set(productId, stock.toString());
  }
  
  // Khóa tồn kho sản phẩm trong Redis
async lockProductStock(productId: string): Promise<boolean> {
  const lockKey = `lock:${productId}`;
  
  // Sử dụng SETNX để chỉ đặt giá trị nếu khóa chưa tồn tại
  const result = await this.client.set(lockKey, 'locked', 'EX', 60);  // 'EX' đặt thời gian hết hạn là 60 giây

  return result === 'OK';  // Nếu khóa được đặt thành công, trả về 'OK'
}


  async unlockProductStock(productId: string): Promise<void> {
    await this.client.del(productId);
  }
  async setProductStock(productId: string, stock: number): Promise<void> {
    try {
      // Lưu trữ số lượng tồn kho vào Redis
      await this.client.set(productId, stock.toString());
      console.log(`Cập nhật tồn kho cho sản phẩm ${productId}: ${stock}`);
    } catch (error) {
      console.error("Error khi set tồn kho cho sản phẩm:", error);
      throw new Error("Không thể cập nhật tồn kho vào Redis");
    }
  }
  
  

}
