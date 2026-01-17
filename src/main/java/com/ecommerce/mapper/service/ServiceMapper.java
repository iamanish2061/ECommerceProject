package com.ecommerce.mapper.service;

import com.ecommerce.dto.response.service.ServiceListResponse;
import com.ecommerce.dto.response.service.ServiceSummaryResponse;
import com.ecommerce.model.service.ServiceModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ServiceMapper {

    ServiceListResponse mapEntityToServiceListResponse(ServiceModel service);

    @Mapping(target = "serviceId", source = "id")
    ServiceSummaryResponse mapEntityToServiceSummaryResponse(ServiceModel service);

}
