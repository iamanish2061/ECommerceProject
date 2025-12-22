package com.ecommerce.mapper.order;

import com.ecommerce.dto.response.order.OrderItemResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.mapper.product.ProductMapper;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = ProductMapper.class)
public interface OrderMapper {

    @Mapping(source = "id", target = "orderId")
    @Mapping(source = "totalAmount", target = "totalAmount")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "username", target = "username")
    OrderResponse mapEntityToOrderResponse(OrderModel order, String username);

    @Mapping(source = "id", target = "orderItemId")
    @Mapping(source = "quantity", target= "quantity")
    @Mapping(source = "priceAtPurchase", target= "price")
    @Mapping(source = "product", target = "product")
    OrderItemResponse mapEntityToOrderItemResponse(OrderItem item);


}
