package com.ecommerce.service.cart;

import com.ecommerce.dto.response.cart.CartResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.product.ProductMapper;
import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.ecommerce.service.recommendation.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserActivityService userActivityService;
    private final RedisService redisService;
    private final SimilarUserUpdater similarUserUpdater;

    private final ProductMapper productMapper;

    @Transactional
    public String addToCart(Long userId, Long productId, int quantity){
        ProductModel product = productRepository.findById(productId)
                .orElseThrow(()-> new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if(product.getStock() < quantity)
            throw new ApplicationException("Not enough stock", "NOT_ENOUGH_STOCK", HttpStatus.BAD_REQUEST);

        CartModel cart = cartRepository.findByUserIdAndProductId(userId, productId)
                .orElseGet(()-> CartModel.builder()
                        .userId(userId)
                        .product(product)
                        .quantity(0)
                        .build()
                );

        cart.setQuantity(cart.getQuantity() + quantity);
        CartModel savedCart = cartRepository.save(cart);

        if(savedCart.getQuantity() == 1){
            userActivityService.recordActivity(userId, productId, ActivityType.CART_ADD, 5);
            redisService.incrementUserVector(userId, productId, 5);
        }else{
            redisService.incrementUserVector(userId, productId, 2);
        }
        similarUserUpdater.updateSimilarUsersAsync(userId);
        return "Added to cart! Quantity: "+ savedCart.getQuantity();
    }

    @Transactional
    public Long getCartCount(Long userId){
        return cartRepository.countByUserId(userId);
    }

    @Transactional
    public List<CartResponse> getCartItems(Long userId) {
        List<CartModel> cartItems = cartRepository.findCartItemsByUserId(userId);
        if(cartItems.isEmpty())
            throw new ApplicationException("Nothing in cart!", "NOT_FOUND", HttpStatus.NOT_FOUND);

        return cartItems.stream()
                .map(item->
                        new CartResponse(productMapper.mapEntityToBriefProductsResponse(item.getProduct()), item.getQuantity())
                )
                .toList();
    }

    @Transactional
    public String updateCart(Long id, Long productId, int newQuantity) {
        if(newQuantity<0)
            throw new ApplicationException("Invalid quantity!", "INVALID_QUANTITY", HttpStatus.BAD_REQUEST);

        CartModel cartItem = cartRepository.findByUserIdAndProductId(id, productId)
                .orElseThrow(()->new ApplicationException("Cart item not found!", "CART_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND));

        if(newQuantity == 0){
            deleteFromCart(id, productId);
            return "Removed from cart!";
        }

        ProductModel product = productRepository.findById(productId)
                .orElseThrow(()-> new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        if(product.getStock() < newQuantity){
            throw new ApplicationException("Not enough stock", "NOT_ENOUGH_STOCK", HttpStatus.BAD_REQUEST);
        }

        cartItem.setQuantity(newQuantity);
        cartRepository.save(cartItem);

        redisService.incrementUserVector(id, productId, 2); //for still engaging with this product
        similarUserUpdater.updateSimilarUsersAsync(id);

        return "Cart updated successfully! Quantity: "+ newQuantity;
    }

    @Transactional
    public String deleteFromCart(Long userId, Long productId) {
        CartModel cartItem = cartRepository
                .findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ApplicationException("Item not in cart", "CART_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND));

        cartRepository.delete(cartItem);

        redisService.incrementUserVector(userId, productId, -5);
        similarUserUpdater.updateSimilarUsersAsync(userId);

        return "Item removed form cart!";
    }

    @Transactional
    public String clearCart(Long id) {
        List<CartModel> cartItems = cartRepository.findCartItemsByUserId(id);

        cartItems.forEach(c->{
            redisService.incrementUserVector(id, c.getProduct().getId(), -5);
            similarUserUpdater.updateSimilarUsersAsync(id);
        });

        int deletedRow = cartRepository.deleteAllByUserId(id);
        return deletedRow + " items removed";
    }
}