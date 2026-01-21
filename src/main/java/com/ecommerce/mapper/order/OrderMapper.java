package com.ecommerce.mapper.order;

import com.ecommerce.dto.response.order.OrderItemResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.OrderSummaryResponse;
import com.ecommerce.mapper.product.ProductMapper;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = ProductMapper.class)
public interface OrderMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.totalAmount", target = "totalAmount")
    @Mapping(source = "order.createdAt", target = "createdAt")
    @Mapping(source = "order.status", target = "status")
    @Mapping(source = "order.phoneNumber", target = "phoneNumber")
    @Mapping(source = "username", target = "username")
    OrderResponse mapEntityToOrderResponse(OrderModel order, String username);

    @Mapping(source = "id", target = "orderItemId")
    @Mapping(source = "quantity", target= "quantity")
    @Mapping(source = "priceAtPurchase", target= "price")
    @Mapping(source = "product", target = "product")
    OrderItemResponse mapEntityToOrderItemResponse(OrderItem item);

    @Mapping(target = "orderId", source = "id")
    OrderSummaryResponse mapEntityToOrderSummaryResponse(OrderModel order);

}
