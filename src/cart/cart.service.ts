import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/product/entities/product.entity";
import { CartItemStatus } from "src/util/common/cartItemStatus.type.enum";
import { BadRequest, NotFound } from "src/util/handleError/handleError";
import { DataSource, Repository } from "typeorm";
import { Cart } from "./entities/cart.entity";
import { CartProduct } from "./entities/cartProduct.entity";
import { UpdateCartDto } from "./dto/update-cart.dto";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartProduct) private readonly cartProductRepository: Repository<CartProduct>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    private readonly dataSource:DataSource
  ) {}

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  async updateCartQuantity(userId: number, productData: { productId: number; quantity: number }) {
    const { productId, quantity } = productData;

    // Tìm giỏ hàng hiện tại
    const existingCart = await this.cartRepository.findOne({
      where: { user: { id: userId }, cart_state: CartItemStatus.C1 },
      relations: ['cartProducts', 'cartProducts.product'],
    });
    if (!existingCart) throw new NotFound();

    // Tìm sản phẩm trong giỏ hàng
    const existingCartProduct = existingCart.cartProducts.find((cartProduct) => cartProduct.product.id === productId);

    if (!existingCartProduct) {
      // Kiểm tra sản phẩm tồn tại
      const product = await this.productRepository.findOneBy({ id: productId });
      if (!product) throw new NotFound();
      if (product.product_quantity < quantity) throw new Error('Not enough stock');

      // Thêm sản phẩm mới vào giỏ hàng
      const newCartProduct = this.cartProductRepository.create({
        cart: existingCart,
        product,
        quantity,
        priceAtTheTime: product.product_price,
      });
      await this.cartProductRepository.save(newCartProduct);
    } else {
      // Cập nhật số lượng sản phẩm
      if (existingCartProduct.quantity + quantity > existingCartProduct.product.product_quantity)
        throw new Error('Not enough stock');
      existingCartProduct.quantity += quantity;
      await this.cartProductRepository.save(existingCartProduct);
    }

    // Trả về giỏ hàng đã cập nhật
    return this.cartRepository.findOne({
      where: { id: existingCart.id },
      relations: ['cartProducts', 'cartProducts.product'],
    });
  }

  // Tạo giỏ hàng mới
  async createCart(userId: number, productData: { productId: number; quantity: number }) {
    const { productId, quantity } = productData;

    // Kiểm tra sản phẩm tồn tại
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) throw new NotFound();
    if (product.product_quantity < quantity) throw new Error('Not enough stock');

    // Tạo giỏ hàng mới
    const newCart = this.cartRepository.create({
      user: { id: userId },
      cart_state: CartItemStatus.C1,
      cart_count_product: 1,
    });
    const savedCart = await this.cartRepository.save(newCart);

    // Thêm sản phẩm vào giỏ hàng
    const newCartProduct = this.cartProductRepository.create({
      cart: savedCart,
      product,
      quantity,
      priceAtTheTime: product.product_price,
    });
    await this.cartProductRepository.save(newCartProduct);

    // Trả về giỏ hàng đã tạo
    return this.cartRepository.findOne({
      where: { id: savedCart.id },
      relations: ['cartProducts', 'cartProducts.product'],
    });
  }


  async addToCart(userId: number, productData: { productId: number; quantity: number }): Promise<Cart> {
    const existingCart = await this.cartRepository.findOne({
      where: { user: { id: userId }, cart_state: CartItemStatus.C1 },
      relations: ['cartProducts', 'cartProducts.product'],
    });

    if (!existingCart) {
      return this.createCart(userId, productData);
    }

    return this.updateCartQuantity(userId, productData);
  }
  async deleteItemInCart(userId:number,productId:number) {
    const cart = await this.cartRepository.findOne({
      where:{user:{id:userId},cart_state:CartItemStatus.C4},
      relations:['cartProducts']
    })
    if(!cart) throw new NotFound()
    const cartProduct = cart.cartProducts.find(item =>item.product.id === productId)
    if(!cartProduct) throw new NotFound()
    await this.cartProductRepository.delete(cartProduct.id)
    return this.cartRepository.findOne({
      where:{id:cart.id},
      relations:['cartProducts','cartProducts.product']
    })
  }
  async updateCart(userId: number, shopOrderIds: UpdateCartDto) {
    const shopOrderIdsArray = shopOrderIds.shop_order_ids;
    if (!shopOrderIdsArray || !Array.isArray(shopOrderIdsArray) || shopOrderIdsArray.length === 0) {
      throw new BadRequestException('Invalid payload structure: shop_order_ids is missing or empty');
    }
  
    const itemProducts = shopOrderIdsArray[0]?.item_products;
    if (!itemProducts || !Array.isArray(itemProducts) || itemProducts.length === 0) {
      throw new BadRequestException('Invalid payload structure: item_products is missing or empty');
    }
  
    const { productId, quantity, old_quantity } = itemProducts[0];
    if (!productId || quantity === undefined || old_quantity === undefined) {
      throw new BadRequestException('Invalid payload structure: Missing required fields');
    }
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const foundProduct = await queryRunner.manager.findOne(Product, { where: { id: productId } });
      if (!foundProduct) {
        throw new NotFoundException('Product not found');
      }
  
      if (foundProduct.product_quantity < quantity) {
        throw new BadRequestException('Not enough stock available');
      }
  
      if (quantity === 0) {
        await queryRunner.manager.delete(CartProduct, {
          product: { id: productId },
          cart: { user: { id: userId } },
        });
        await queryRunner.commitTransaction();
        return { message: 'Product removed from cart successfully' }; // Trả về thông báo
      }
  
      const cartProduct = await queryRunner.manager.findOne(CartProduct, {
        where: { product: { id: productId }, cart: { user: { id: userId } } },
        relations: ['cart', 'product'],
      });
  
      if (!cartProduct) {
        throw new NotFoundException('Product not found in cart');
      }
  
      cartProduct.quantity += quantity - old_quantity;
      await queryRunner.manager.save(CartProduct, cartProduct);
  
      const cart = await queryRunner.manager.findOne(Cart, { where: { user: { id: userId } } });
  
      if (cart) {
        cart.cart_count_product += quantity - old_quantity;
  
        if (cartProduct.quantity > 0) {
          cart.cart_state = CartItemStatus.C1;
        }
  
        await queryRunner.manager.save(Cart, cart);
      }
  
      await queryRunner.commitTransaction();
  
      return { 
        message: 'Cart updated successfully', 
        cartProduct, 
        cart 
      }; // Trả về kết quả
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error updating cart:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  
  async findCartById(cartId:number) {
    const cart = await this.cartRepository.findOne({where:{id:cartId}})
    if(!cart) return null
    return cart
  }
  
  async getCartByUserId(userId: number) {
    return this.cartRepository.findOne({
      where: { user: { id: userId }, cart_state: CartItemStatus.C1 },
      relations: ['cartProducts', 'cartProducts.product'],
    });
  }
  
  
}
