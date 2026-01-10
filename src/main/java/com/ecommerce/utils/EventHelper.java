package com.ecommerce.utils;

import com.ecommerce.dto.intermediate.OrderItemDTO;
import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.model.notification.NotificationType;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EventHelper {

    public static NotificationEvent createEventForOrder(UserModel user, TempOrderDetails tempOrder, PaymentModel paymentModel){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("email" , user.getEmail());

        List<OrderItemDTO> itemSummary = new ArrayList<>(tempOrder.items());
        metaData.put("items", itemSummary);
        metaData.put("contactNumber", tempOrder.contactNumber());
        metaData.put("address", tempOrder.address().getDistrict() + ", " + tempOrder.address().getPlace()+", "+ tempOrder.address().getLandmark());
        metaData.put("totalAmount", tempOrder.totalIncludingDeliveryCharge());
        if(paymentModel == null){
            metaData.put("paymentMethod", PaymentMethod.CASH_ON_DELIVERY);
            metaData.put("transactionId", "-");
            metaData.put("paymentStatus", PaymentStatus.PENDING);
        }else{
            metaData.put("paymentMethod", paymentModel.getPaymentMethod());
            metaData.put("transactionId", paymentModel.getTransactionId());
            metaData.put("paymentStatus", paymentModel.getPaymentStatus());
        }
        metaData.put("adminMessage", "User "+user.getId()+" has placed an order!");

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Order placement")
                .message("Your order has been placed.")
                .type(NotificationType.ORDER_PLACED)
                .itemSummary(itemSummary)
                .metadata(metaData)
                .build();

    }

    public static NotificationEvent createEventForDriverRegister(UserModel user){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("adminMessage", "User "+user.getId()+" has requested the role of driver!");

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Driver Registration")
                .message("Your form has been submitted. Admin will review it soon...")
                .type(NotificationType.DRIVER_REGISTRATION)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForOrderCancellation(UserModel user, OrderModel order){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("adminMessage", "User "+user.getId()+" has cancelled the order: "+order.getId());
        metaData.put("email", user.getEmail());

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Order Cancellation")
                .message("Your order has been cancelled!")
                .type(NotificationType.ORDER_CANCELLED)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForPasswordChange(UserModel user){
        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Password Changed")
                .message("Your password has been changed")
                .type(NotificationType.PASSWORD_CHANGE)
                .metadata(null)
                .build();
    }

    public static NotificationEvent createEventForStartingOrder(UserModel driver, UserModel user) {
        Map<String, Object> metaData = Map.of("adminMessage", "Driver: "+ driver.getUsername() + " has started the delivery of user: "+user.getId());

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("ORDER STARTED")
                .message("Your order is on the way")
                .type(NotificationType.ORDER_STARTED)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForOrderCompletion(UserModel driver, UserModel user) {
        Map<String, Object> metaData = Map.of("adminMessage", "Driver: "+ driver.getUsername() + " has completed the delivery of user: "+user.getId());

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("ORDER COMPLETED")
                .message("Your order is delivered")
                .type(NotificationType.ORDER_DELIVERED)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForDeliveryAssignment(UserModel driver) {

        Map<String, Object> metaData = Map.of(
                "adminMessage", "Driver: "+ driver.getUsername() + " has been assigned for delivering orders",
                "driverId", driver.getId(),
                "driverUsername", driver.getUsername(),
                "driverMessage", "You have been assigned for the delivery of orders"
        );

        return NotificationEvent.builder()
                .recipientId(null)
                .title("DRIVER ASSIGN")
                .message(null)
                .type(NotificationType.DRIVER_ASSIGN)
                .metadata(metaData)
                .build();

    }

    public static NotificationEvent createEventForInstorePurchase(UserModel admin) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", "Admin: "+  admin.getId()+ " has done instore sales"
        );

        return NotificationEvent.builder()
                .recipientId(null)
                .title("INSTORE PURCHASE")
                .message(null)
                .type(NotificationType.INSTORE_PURCHASE)
                .metadata(metaData)
                .build();
    }
}
