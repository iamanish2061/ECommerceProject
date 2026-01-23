package com.ecommerce.utils;

import com.ecommerce.dto.intermediate.AppointmentDetailForEvent;
import com.ecommerce.dto.intermediate.OrderItemDTO;
import com.ecommerce.dto.intermediate.StaffLeaveDTO;
import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.model.notification.NotificationType;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.model.user.VerificationStatus;
import com.ecommerce.rabbitmq.dto.NotificationEvent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EventHelper {

//    for instore purchase
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

//    for order placement and cancellation
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
        metaData.put("adminMessage", "User "+user.getUsername()+" has placed an order!");

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

    public static NotificationEvent createEventForOrderCancellation(UserModel user, OrderModel order){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("adminMessage", "User "+user.getUsername()+" has cancelled the order: "+order.getId());
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

//    for password change
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

//    for appointment related events
    public static NotificationEvent createEventForAppointment(AppointmentDetailForEvent detail) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", detail.getUser()+" has booked an appointment of service: "+detail.getServiceName()+ " staff: "+detail.getStaffId()+" for: "+detail.getAppointmentDate(),
                "email", detail.getEmail(),
                "staffId", detail.getStaffId(),
                "staffUsername", detail.getStaffName(),
                "staffMessage", detail.getUser()+" has booked an appointment of service: "+detail.getServiceName()+" for: "+ detail.getAppointmentDate()
        );
        return NotificationEvent.builder()
                .recipientId(detail.getUserId())
                .username(detail.getUser())
                .title("APPOINTMENT BOOKED")
                .message("Your service: "+detail.getServiceName()+" has been booked for: " +detail.getAppointmentDate())
                .type(NotificationType.APPOINTMENT_BOOKED)
                .metadata(metaData)
                .build();

    }

    public static NotificationEvent createEventForAppointmentCancellation(AppointmentDetailForEvent detail){
        Map<String, Object> metaData = Map.of(
                "adminMessage", detail.getUser()+" appointment of service: "+detail.getServiceName()+" for: "+detail.getAppointmentDate()+" has been cancelled",
                "email", detail.getEmail(),
                "staffId", detail.getStaffId(),
                "staffUsername", detail.getStaffName(),
                "staffMessage", detail.getUser()+" appointment of service: "+detail.getServiceName()+" for: "+ detail.getAppointmentDate()+" has been cancelled"
        );
        return NotificationEvent.builder()
                .recipientId(detail.getUserId())
                .username(detail.getUser())
                .title("APPOINTMENT CANCELLED")
                .message("Your service: "+detail.getServiceName()+" for: " +detail.getAppointmentDate()+" has been cancelled")
                .type(NotificationType.APPOINTMENT_CANCELLED)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForAppointmentCompletion(AppointmentDetailForEvent detail) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", detail.getUser()+" appointment of service: "+detail.getServiceName()+ " and staff: "+detail.getStaffId()+" has been completed.",
                "email", detail.getEmail(),
                "staffId", detail.getStaffId(),
                "staffUsername", detail.getStaffName(),
                "staffMessage", detail.getUser()+"  appointment of service: "+detail.getServiceName()+" has been completed."
        );
        return NotificationEvent.builder()
                .recipientId(detail.getUserId())
                .username(detail.getUser())
                .title("APPOINTMENT COMPLETED")
                .message("Your service: "+detail.getServiceName()+" has been completed.")
                .type(NotificationType.APPOINTMENT_COMPLETED)
                .metadata(metaData)
                .build();

    }

    public static NotificationEvent createEventForAppointmentNoShow(AppointmentDetailForEvent detail){
        Map<String, Object> metaData = Map.of(
                "adminMessage", detail.getUser()+" did not show up for an appointment of "+detail.getAppointmentDate(),
                "email", detail.getEmail(),
                "staffId", detail.getStaffId(),
                "staffUsername", detail.getStaffName(),
                "staffMessage", detail.getUser()+" did not show up for an appointment of "+detail.getAppointmentDate()
        );
        return NotificationEvent.builder()
                .recipientId(detail.getUserId())
                .username(detail.getUser())
                .title("APPOINTMENT CANCELLED")
                .message("You did not attend for "+detail.getServiceName()+" of: " +detail.getAppointmentDate())
                .type(NotificationType.APPOINTMENT_CANCELLED)
                .metadata(metaData)
                .build();
    }

//    for staff leave and admin response
    public static NotificationEvent createEventForLeaveRequest(StaffLeaveDTO detail) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", "Staff : "+detail.username()+" has made leave request for day "+detail.leaveDate()+".",
                "staffId", detail.staffId(),
                "staffUsername", detail.username(),
                "staffMessage", "Your leave request of day "+detail.leaveDate()+" has been submitted."
        );
        return NotificationEvent.builder()
                .recipientId(null)
                .username(null)
                .title("LEAVE REQUEST")
                .message(null)
                .type(NotificationType.STAFF_LEAVE)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForLeaveResponse(StaffLeaveDTO detail) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", "Leave request of staff : "+detail.username()+" for day "+detail.leaveDate()+" has been "+detail.status().toString().toLowerCase(),
                "staffId", detail.staffId(),
                "staffUsername", detail.username(),
                "staffMessage", "Your leave request of day "+detail.leaveDate()+" has been "+detail.status().toString().toLowerCase()
        );
        return NotificationEvent.builder()
                .recipientId(null)
                .username(null)
                .title("LEAVE REQUEST")
                .message(null)
                .type(NotificationType.STAFF_LEAVE)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForLeaveCancel(StaffLeaveDTO detail) {
        Map<String, Object> metaData = Map.of(
                "adminMessage", "Staff : "+detail.username()+" has cancelled the leave request for day "+detail.leaveDate()+".",
                "staffId", detail.staffId(),
                "staffUsername", detail.username(),
                "staffMessage", "Your leave request of day "+detail.leaveDate()+" has been cancelled."
        );
        return NotificationEvent.builder()
                .recipientId(null)
                .username(null)
                .title("LEAVE REQUEST")
                .message(null)
                .type(NotificationType.STAFF_LEAVE)
                .metadata(metaData)
                .build();
    }

//    for driver registration and admin response to that registration
    public static NotificationEvent createEventForDriverRegister(UserModel user){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("adminMessage", "User "+user.getUsername()+" has requested the role of driver!");

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Driver Registration")
                .message("Your form has been submitted. Admin will review it soon...")
                .type(NotificationType.DRIVER_REGISTRATION)
                .metadata(metaData)
                .build();
    }

    public static NotificationEvent createEventForDriverRegistrationResponse(UserModel user, VerificationStatus status){
        String message = (status == VerificationStatus.REJECTED)?
                "Your application request for driver role has been rejected":
                "Your form has been approved. You are now the verified driver...";

        Map<String, Object> metaData = new HashMap<>();
        metaData.put("adminMessage", "Request for driver role of "+user.getUsername()+" has been "+status.toString().toLowerCase());

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .username(user.getUsername())
                .title("Driver Registration")
                .message(message)
                .type(NotificationType.DRIVER_REGISTRATION)
                .metadata(metaData)
                .build();
    }


    //    for admin assigning orders to driver, driver starting and completing delivery of particular user
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

//    driver start garesi sab lai shipped wala notification

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
}
