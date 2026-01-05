package com.ecommerce.service.user;

import com.ecommerce.dto.request.user.ChangePasswordRequest;
import com.ecommerce.dto.request.user.DriverRegisterRequest;
import com.ecommerce.dto.response.user.DetailedAddress;
import com.ecommerce.dto.response.user.UserProfileResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.user.Driver;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.model.user.VerificationStatus;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.repository.user.DriverRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.utils.EventHelper;
import com.ecommerce.utils.UserPictureUploadHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final AddressMapper addressMapper;
    private final NotificationProducer notificationProducer;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public UserProfileResponse getProfileDetails(Long userId) {
        UserModel user = userRepository.findUserDetailWithAddressById(userId)
                .orElseThrow(
                        ()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
                );
        Map<String, DetailedAddress> responseAddresses = new HashMap<>();
        user.getAddresses()
                .forEach(address->{
                    if(address.getType() == AddressType.HOME){
                        responseAddresses.put(String.valueOf(AddressType.HOME), addressMapper.mapEntityToDetailedAddress(address));
                    }
                    else if (address.getType() == AddressType.WORK) {
                        responseAddresses.put(String.valueOf(AddressType.WORK), addressMapper.mapEntityToDetailedAddress(address));
                    }
                });
        return new UserProfileResponse(
                user.getProfileUrl(),
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getCreatedAt(),
                responseAddresses
        );
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        if(!request.password().equals(request.rePassword())){
            throw new ApplicationException("Please enter same password in both fields!", "PASSWORD_MISMATCH", HttpStatus.BAD_REQUEST);
        }
        UserModel user = userRepository.findById(userId).orElseThrow(
                ()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        user.setPassword(encoder.encode(request.password()));
        userRepository.save(user);
    }

    public void changeProfilePicture(UserModel user, MultipartFile photo) {
        String profileUrl = UserPictureUploadHelper.uploadProfileImage(photo, user.getUsername());
        user.setProfileUrl(profileUrl);
        userRepository.save(user);
    }

    public String getDriverStatus(UserModel user) {
        return driverRepository.findById(user.getId())
                .map(driver -> driver.getVerified().name()) // Returns "PENDING", "APPROVED", etc.
                .orElse(null);
    }

    @Transactional
    public void registerDriver(UserModel user, MultipartFile license, DriverRegisterRequest driverRegisterRequest) {
        Driver existingDriver = driverRepository.findById(user.getId()).orElse(null);

        if(existingDriver != null){
            throw new ApplicationException("Driver already registered!", "DRIVER_ALREADY_REGISTERED", HttpStatus.CONFLICT);
        }

        String licenseUrl = UserPictureUploadHelper.uploadLicenseImage(license, user.getUsername());
        Driver newDriver = Driver.builder()
                .user(user)
                .verified(VerificationStatus.PENDING)
                .licenseNumber(driverRegisterRequest.licenseNumber())
                .licenseExpiry(driverRegisterRequest.licenseExpiry())
                .vehicleNumber(driverRegisterRequest.vehicleNumber())
                .licenseUrl(licenseUrl)
                .build();

        user.addDriver(newDriver);
        userRepository.save(user);

        notificationProducer.send("notify.user", EventHelper.createEventForDriverRegister(user));
    }

}
