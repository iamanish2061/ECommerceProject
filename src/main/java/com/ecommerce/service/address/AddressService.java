package com.ecommerce.service.address;

import com.ecommerce.dto.response.address.AddressWithDeliveryChargeResponse;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.model.user.AddressModel;
import com.ecommerce.model.user.AddressType;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.service.order.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final RedisService redisService;
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


}
