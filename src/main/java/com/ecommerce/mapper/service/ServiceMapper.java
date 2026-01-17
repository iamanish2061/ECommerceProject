package com.ecommerce.mapper.service;

import com.ecommerce.dto.response.service.ServiceListResponse;
import com.ecommerce.model.service.ServiceModel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ServiceMapper {

    ServiceListResponse mapModelToServiceListResponse(ServiceModel service);



}
