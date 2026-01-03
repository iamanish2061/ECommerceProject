package com.ecommerce.mapper.notification;


import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.model.notification.Notification;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(target = "isRead", constant = "false")
    NotificationResponse mapEventToNotificationResponse(NotificationEvent event);

    NotificationResponse mapEntityToNotificationResponce(Notification notification);

}

