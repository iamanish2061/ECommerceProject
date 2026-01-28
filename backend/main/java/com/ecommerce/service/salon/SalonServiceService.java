package com.ecommerce.service.salon;

import com.ecommerce.dto.request.service.AssignStaffToServiceRequest;
import com.ecommerce.dto.request.service.ServiceCreateRequest;
import com.ecommerce.dto.request.service.ServiceUpdateRequest;
import com.ecommerce.dto.response.service.ServiceDetailResponse;
import com.ecommerce.dto.response.service.ServiceListResponse;
import com.ecommerce.dto.response.service.ServiceNameAndIdResponse;
import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.service.ServiceMapper;
import com.ecommerce.mapper.staff.StaffMapper;
import com.ecommerce.model.service.ServiceModel;
import com.ecommerce.model.user.Staff;
import com.ecommerce.repository.service.ServiceRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.service.image.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalonServiceService {

    private final ServiceRepository serviceRepository;
    private final StaffRepository staffRepository;

    private final ServiceMapper serviceMapper;
    private final StaffMapper staffMapper;
    private final ImageStorageService storageService;

//    User Methods
    public List<ServiceListResponse> getAllActiveServices() {
        return serviceRepository.findByActiveTrue().stream()
                .map(serviceMapper::mapEntityToServiceListResponse)
                .toList();
    }

    public List<ServiceListResponse> getServicesByCategory(String category) {
        return serviceRepository.findByCategoryAndActiveTrue(category).stream()
                .map(serviceMapper::mapEntityToServiceListResponse)
                .toList();
    }

    public List<ServiceListResponse> searchServices(String query) {
        return serviceRepository.findByNameContainingIgnoreCaseAndActiveTrue(query).stream()
                .map(serviceMapper::mapEntityToServiceListResponse)
                .toList();
    }

    public List<String> getAllCategories() {
        return serviceRepository.findDistinctCategories();
    }

    public ServiceDetailResponse getServiceDetail(Long id) {
        ServiceModel service = serviceRepository.findWithStaffById(id)
                .orElseThrow(() -> new ApplicationException("Service not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND));
        ServiceListResponse serviceListResponse = serviceMapper.mapEntityToServiceListResponse(service);
        List<StaffSummaryResponse> staffList = service.getStaff()
                .stream().map(staffMapper::mapEntityToStaffSummaryResponse)
                .toList();
        return new ServiceDetailResponse(serviceListResponse, staffList);
    }



//    Admin Methods
    public List<ServiceNameAndIdResponse> getNameAndIdOfServices() {
        return serviceRepository.findAll().stream()
                .map(s-> new ServiceNameAndIdResponse(s.getId(), s.getName()))
                .toList();
    }

    public List<ServiceListResponse> getAllServicesAdmin() {
        return serviceRepository.findAllByOrderByIdDesc().stream()
                .map(serviceMapper::mapEntityToServiceListResponse)
                .toList();
    }

    @Transactional
    public void createService(ServiceCreateRequest request, MultipartFile image) {
        if (serviceRepository.existsByNameIgnoreCase(request.name())) {
            throw new ApplicationException("Service with this name already exists", "ALREADY_EXISTS", HttpStatus.CONFLICT);
        }

        String imageUrl;
        try{
            imageUrl = storageService.uploadSystemImage(image, request.name(), "SERVICE");
        }catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApplicationException("Failed to upload service photo to cloud", "STORAGE_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        ServiceModel service = ServiceModel.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .imageUrl(imageUrl)
                .durationMinutes(request.durationMinutes())
                .category(request.category())
                .active(true)
                .build();
        serviceRepository.save(service);
    }

    @Transactional
    public void updateService(Long id, ServiceUpdateRequest request) {
        ServiceModel service = serviceRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("Service not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.name() != null) {
            // Check uniqueness if name is being changed
            if (!service.getName().equalsIgnoreCase(request.name()) &&
                    serviceRepository.existsByNameIgnoreCase(request.name())) {
                throw new ApplicationException("Service with this name already exists", "ALREADY_EXISTS", HttpStatus.CONFLICT);
            }
            service.setName(request.name());
        }
        if (request.description() != null)
            service.setDescription(request.description());
        if (request.price() != null)
            service.setPrice(request.price());
        if (request.durationMinutes() != null)
            service.setDurationMinutes(request.durationMinutes());
        if (request.category() != null)
            service.setCategory(request.category());
        serviceRepository.save(service);
    }

    @Transactional
    public void toggleServiceStatus(Long id) {
        ServiceModel service = serviceRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("Service not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND));
        service.setActive(!service.isActive());
        serviceRepository.save(service);
    }

    @Transactional
    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new ApplicationException("Service not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        serviceRepository.deleteById(id);
    }

    @Transactional
    public void assignStaffToService(Long serviceId, AssignStaffToServiceRequest request) {
        ServiceModel service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ApplicationException("Service not found with id: " + serviceId, "NOT_FOUND", HttpStatus.NOT_FOUND));
        request.staffIds().forEach(id->{
                    Staff staff = staffRepository.findById(id)
                            .orElseThrow(() -> new ApplicationException("Staff not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND));
                    staff.addService(service);
                    staffRepository.save(staff);
                }
        );
    }

}
