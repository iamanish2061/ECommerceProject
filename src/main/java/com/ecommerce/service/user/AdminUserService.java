package com.ecommerce.service.user;

import com.ecommerce.dto.response.user.*;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.user.*;
import com.ecommerce.repository.user.DriverRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final StaffRepository staffRepository;
    private final UserMapper userMapper;

    public List<AllUsersResponse> getAllUsers() {
        List<UserModel> users = userRepository.findAll();
        return users.stream()
                .map(userMapper::mapEntityToUserResponse)
                .toList();
    }

    public DetailedUserResponse getSingleUserInfo(Long id) {
        UserModel userModel = userRepository.findUserDetailWithAddressById(id)
                .orElseThrow(()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        DetailedUser user = userMapper.mapEntityToDetailedUser(userModel);
        AddressModel filteredAddress = userModel.getAddresses()
                .stream()
                .filter(a-> a.getType() == AddressType.HOME)
                .findFirst().orElse(null);

        DetailedAddress address = filteredAddress != null
                ? userMapper.mapEntityToDetailedAddress(filteredAddress)
                : null;

        return new DetailedUserResponse(user, address);
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

}
