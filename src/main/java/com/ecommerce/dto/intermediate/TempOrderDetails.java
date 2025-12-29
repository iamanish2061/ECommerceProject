package com.ecommerce.dto.intermediate;

import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.product.ProductModel;

import java.util.List;
import java.util.Map;


public record TempOrderDetails(
        Long productId,
        List<CartModel> cartItems,
        Map<Long, ProductModel> productsInCart,
        OrderModel order
) {
}
