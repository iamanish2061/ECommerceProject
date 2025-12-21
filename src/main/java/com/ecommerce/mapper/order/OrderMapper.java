package com.ecommerce.mapper.order;

import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.model.order.OrderModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.totalAmount", target = "totalAmount")
    @Mapping(source = "order.createdAt", target = "createdAt")
    @Mapping(source = "order.status", target = "status")
    @Mapping(source = "username", target = "username")
    OrderResponse mapEntityToOrderResponse(OrderModel order, String username);


}
