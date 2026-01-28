package com.ecommerce.mapper.notification;


import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.model.notification.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "read", target = "isRead")
    NotificationResponse mapEntityToNotificationResponse(Notification notification);

}

