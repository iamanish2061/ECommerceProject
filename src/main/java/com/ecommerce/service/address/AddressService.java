package com.ecommerce.service.address;

import com.ecommerce.dto.request.address.AddAddressRequest;
import com.ecommerce.dto.response.address.AddressWithDeliveryChargeResponse;
import com.ecommerce.dto.response.address.DetailedAddress;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.model.address.AddressModel;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.order.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final RouteService routeService;

    private final AddressMapper addressMapper;

    public AddressWithDeliveryChargeResponse getAddressOfType(UserModel user, AddressType addressType) {
        AddressModel address = addressRepository.findByUserIdAndType(user.getId(), addressType)
                .orElse(null);
        if(address != null){
            BigDecimal charge = routeService.calculateDeliveryCharge(address.getLatitude(), address.getLongitude());
            return addressMapper.mapEntityToAddressWithDeliveryChargeResponse(address, charge);
        }
        return null;
    }


    public DetailedAddress getAddressForProfileOfType(UserModel user, AddressType addressType) {
        AddressModel address = addressRepository.findByUserIdAndType(user.getId(), addressType)
                .orElse(null);
        if(address != null){
            return addressMapper.mapEntityToDetailedAddress(address);
        }
        return null;
    }

    @Transactional
    public DetailedAddress addAddress(Long userId, AddAddressRequest request) {
        UserModel user = userRepository.findUserDetailWithAddressById(userId).orElseThrow(
                ()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        AddressModel existingAddress = user.getAddresses().stream()
                .filter(address-> address.getType() == request.type())
                .findFirst().orElse(null);

        if(existingAddress != null){
            throw new ApplicationException("Address of type :"+request.type()+" already exists!", "ADDRESS_ALREADY_EXISTS", HttpStatus.CONFLICT);
        }
        AddressModel newAddress = AddressModel.builder()
                .type(request.type())
                .province(request.province())
                .district(request.district())
                .place(request.place())
                .landmark(request.landmark())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .build();
        user.addAddress(newAddress);
        userRepository.save(user);
        return addressMapper.mapEntityToDetailedAddress(newAddress);
    }

    @Transactional
    public DetailedAddress updateAddress(Long userId, Long addressId, AddAddressRequest request) {
        AddressModel existingAddress = addressRepository.findById(addressId).orElseThrow(
                ()-> new ApplicationException("Address not found!", "ADDRESS_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        if (!existingAddress.getUser().getId().equals(userId)) {
            throw new ApplicationException("Unauthorized access to address", "UNAUTHORIZED", HttpStatus.FORBIDDEN);
        }
        existingAddress.setProvince(request.province());
        existingAddress.setDistrict(request.district());
        existingAddress.setPlace(request.place());
        existingAddress.setLandmark(request.landmark());
        existingAddress.setLatitude(request.latitude());
        existingAddress.setLongitude(request.longitude());
        AddressModel savedAddress = addressRepository.save(existingAddress);
        return addressMapper.mapEntityToDetailedAddress(savedAddress);
    }

}
