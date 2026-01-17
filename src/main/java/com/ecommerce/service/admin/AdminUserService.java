package com.ecommerce.service.admin;

import com.ecommerce.dto.response.address.DetailedAddress;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.dto.response.user.DetailedUser;
import com.ecommerce.dto.response.user.DetailedUserResponse;
import com.ecommerce.dto.response.user.DriverInfoResponse;
import com.ecommerce.dto.response.user.StaffInfoResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.address.AddressModel;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.user.*;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.user.DriverRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.order.RouteService;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final StaffRepository staffRepository;
    private final UserMapper userMapper;
    private final AddressMapper addressMapper;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;

    private final RedisService redisService;
    private final NotificationProducer notificationProducer;

    private final RouteService routeService;

    public List<DetailedUser> getAllUsers() {
        List<UserModel> users = userRepository.findAll();
        return users.stream()
                .map(userMapper::mapEntityToDetailedUser)
                .toList();
    }

    public DetailedUserResponse getSingleUserInfo(Long id) {
        UserModel userModel = userRepository.findUserDetailWithAddressById(id)
                .orElseThrow(()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        DetailedUser user = userMapper.mapEntityToDetailedUser(userModel);

        Map<String, DetailedAddress> responseAddresses = new HashMap<>();
        userModel.getAddresses()
                .forEach(address->{
                    if(address.getType() == AddressType.HOME){
                        responseAddresses.put(String.valueOf(AddressType.HOME), addressMapper.mapEntityToDetailedAddress(address));
                    }
                    else if (address.getType() == AddressType.WORK) {
                        responseAddresses.put(String.valueOf(AddressType.WORK), addressMapper.mapEntityToDetailedAddress(address));
                    }
                });

        return new DetailedUserResponse(user, responseAddresses);
    }

    @Transactional
    public void updateRole(Long id, Role role) throws ApplicationException{
        UserModel user = userRepository.findById(id)
                .orElseThrow(()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
        user.setRole(role);
    }

    @Transactional
    public void updateStatus(Long id, UserStatus status) throws ApplicationException{
        UserModel user = userRepository.findById(id)
                .orElseThrow(()->new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
        user.setStatus(status);
    }

    public DriverInfoResponse getDriverInformation(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(()->
                        new ApplicationException("Details not found!", "DETAILS_NOT_FOUND", HttpStatus.NOT_FOUND));
        return userMapper.mapEntityToDriverInfoResponse(driver);
    }

    public StaffInfoResponse getStaffInformation(Long id) {
        Staff staff = staffRepository.findStaffDetailWithLeaveInfoById(id)
                .orElseThrow(()-> new ApplicationException("Details not found!", "DETAILS_NOT_FOUND", HttpStatus.NOT_FOUND));
        staff.getStaffLeave().removeIf(leave-> leave.getLeaveDate().isBefore(LocalDate.now()));
        return userMapper.mapEntityToStaffInfoResponse(staff);
    }

    public void assignDeliveryToDriver(Long driverId) {
        UserModel driver = userRepository.findById(driverId).orElseThrow(
                ()-> new ApplicationException("Driver not found!", "DRIVER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        List<OrderModel> orders = orderRepository.findByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED));
        AddressModel adminAddress = addressRepository.findById(1L).orElseThrow(
                () -> new ApplicationException("Address not found!", "ADDRESS_NOT FOUND", HttpStatus.NOT_FOUND)
        );

        List<AssignedDeliveryResponse> addresses = new ArrayList<>(orders.stream()
                .map(
                        o -> new AssignedDeliveryResponse(
                                o.getId(),
                                o.getUser().getUsername(),
                                o.getPhoneNumber(),
                                o.getAddress().getDistrict(),
                                o.getAddress().getPlace(),
                                o.getAddress().getLandmark(),
                                o.getAddress().getLatitude(),
                                o.getAddress().getLongitude()
                        )
                ).toList());

        addresses.add(0, new AssignedDeliveryResponse(
                null,
                "adminCutLab",
                "9823166482",
                adminAddress.getDistrict(),
                adminAddress.getPlace(),
                adminAddress.getLandmark(),
                adminAddress.getLatitude(),
                adminAddress.getId())
        );

        List<AssignedDeliveryResponse> orderedList = routeService.startRoutingAlgorithm(addresses);
        redisService.addDeliveryAddressList(driverId, orderedList);

        notificationProducer.send("notify.driver", EventHelper.createEventForDeliveryAssignment(driver));
    }
}
