package com.ecommerce.rabbitmq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    @Value("${notification.exchange}")
    private String exchange;

    @Value("${notification.routing.user}")
    private String userRoutingKey;

    @Value("${notification.routing.driver}")
    private String driverRoutingKey;

    @Value("${notification.routing.staff}")
    private String staffRoutingKey;

    // 1. Define the Exchange
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(exchange);
    }

    // 2. Define the Queues
    @Bean
    public Queue userQueue() {
        return new Queue("user.notification.queue", true); // true = durable (survives restart)
    }

    @Bean
    public Queue driverQueue() {
        return new Queue("driver.notification.queue", true);
    }

    @Bean
    public Queue staffQueue() {
        return new Queue("staff.notification.queue", true);
    }

    @Bean
    public Queue emailQueue() {
        return new Queue("email.notification.queue", true);
    }

    @Bean
    public Binding emailBinding(Queue emailQueue, TopicExchange notificationExchange) {
        // This queue listens to ALL notification types (user, driver, staff)
        // using the wildcard '#'
        return BindingBuilder.bind(emailQueue).to(notificationExchange).with("notify.#");
    }

    // 3. Bind Queues to Exchange using Routing Keys
    @Bean
    public Binding userBinding(Queue userQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(userQueue).to(notificationExchange).with(userRoutingKey);
    }

    @Bean
    public Binding driverBinding(Queue driverQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(driverQueue).to(notificationExchange).with(driverRoutingKey);
    }

    @Bean
    public Binding staffBinding(Queue staffQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(staffQueue).to(notificationExchange).with(staffRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        // This tells RabbitMQ: "Use the ObjectMapper I just defined in my other bean!"
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}




































//    i am making the project of ecommerce of unisex saloon having : admin, staff, admin, and user
//
//    user can buy products and book services
//    admin manages all
//    driver is assigned delivery addresses to deliver the products
//    staff can view their appointments
//
//    now my requirement is
//    live notification and email system
//    when user buy products, the notification should be sent to admin and the email should be sent to the particular user regarding product description, total, delivery address and all other order details
//    admin can view the notification and has ability to change the status of order to set "OUT_FOR_DELIVERY", cancelled, or any other action
//    when admin do so, the notification is sent to the user
//    when user cancel the order, notificaiton is sent to admin, and email regarding cancellation is sent to user
//
//    when admin clicks the assign driver button
//    the info regarding delivery is loaded in driver ui , also driver should get notification regarding you are scheduled to delivery the items that you are assigned
//    when driver clicks delivered button of particular order
//    the notification should be sent to admin as: "order ... has been delivered to user ..."
//    the notification should be sent to user as: "your order has been delivered"
//
//for staff
//    when user books appointment, admin and staff should receive notification
//    admin should receive: user... has booked an appointment for ...service (staff ...)
//    staff should see notification like: "user.... has booked an appointment for ...time"
//    email should be sent to user regarding booking details
//
//    if user cancel staff and admin should be notified and email should be sent to the user
//    when admin do any operation to the appointment, notification should be sent to user only
//
//    just help me to design something that can fulfill my problem
//    i am thinking of using kafka or rabbitmq, if you have any other better solution please tell me
//    if not- dont give me code, just tell me how can i do it or the design with an informal flow
//
//    the notification should be persistent
//    all the notification should be stored in db
//    and the unread notifications should be stored in redis
//
//    i am thinking to show the notification icon
//    when the user click notification icon recent notifications which are unread and are stored in redis is displayed,
//    when user click mark as read or remove button, the notification is removed from redis but not from notification db
//    so when user view all notification button , it fetches from database and show

