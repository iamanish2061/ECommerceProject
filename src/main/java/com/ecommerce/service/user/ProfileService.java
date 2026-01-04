package com.ecommerce.service.user;

import com.ecommerce.dto.request.user.ChangePasswordRequest;
import com.ecommerce.dto.response.user.DetailedAddress;
import com.ecommerce.dto.response.user.UserProfileResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.utils.ProfilePictureUploadHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final AddressMapper addressMapper;

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
        String profileUrl = ProfilePictureUploadHelper.uploadImage(photo, user.getUsername());
        user.setProfileUrl(profileUrl);
        userRepository.save(user);
    }
}
