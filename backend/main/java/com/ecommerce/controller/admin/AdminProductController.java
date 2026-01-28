package com.ecommerce.controller.admin;


import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.product.*;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.product.*;
import com.ecommerce.service.admin.AdminProductService;
import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidPrice;
import com.ecommerce.validation.ValidQuantity;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController extends BaseController {

    private final AdminProductService adminProductService;

    //    get product name and id for putting in dropdown to sell product in store
    @GetMapping("/id-and-name")
    @Operation(summary = "to fetch id and name of product for selling product instore (form maa use hunxa)")
    public ResponseEntity<ApiResponse<List<NameAndIdResponse>>> getNameAndIdOfAllProducts(){
        return success(adminProductService.getNameAndIdOfAllProducts(), "Fetched name and if of products successfully");
    }

    @PostMapping(value = "/brand", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to add brand from admin side")
    public ResponseEntity<ApiResponse<BrandResponse>> addBrand(
            @Valid @RequestPart("addBrandRequest") BrandRequest brandRequest,
            @RequestPart("logo") MultipartFile logo
    ){
        return success(adminProductService.addBrand(brandRequest, logo), "Brand added successfully", HttpStatus.CREATED);
    }

//    for adding category
    @PostMapping(value = "/category", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to add category from admin side")
    public ResponseEntity<ApiResponse<CategoryResponse>> addCategory(
            @Valid @RequestPart("addCategoryRequest")CategoryRequest addCategoryRequest,
            @RequestPart("image") MultipartFile image
    ){
        return success(adminProductService.addCategory(addCategoryRequest, image), "Category added successfully", HttpStatus.CREATED);
    }

//    for adding tags
    @PostMapping("/tags")
    @Operation(summary = "to add tag from admin side")
    public ResponseEntity<ApiResponse<TagResponse>> addTag(
            @Valid @RequestBody TagRequest tagRequest
    ){
        return success(adminProductService.addTag(tagRequest), "Tags added successfully", HttpStatus.CREATED);
    }

    // send brand and category slug ---for adding product
    @PostMapping(value = "/", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to add new product from admin side")
    public ResponseEntity<ApiResponse<SingleProductWithCostPriceResponse>> addNewProduct(
            @Valid @RequestPart("addProductRequest") ProductRequest addProductRequest,
            @RequestPart("imageFiles") List<MultipartFile> imageFiles
    ){
        return success(adminProductService.addNewProduct(addProductRequest, imageFiles), "New product added successfully", HttpStatus.CREATED);
    }

//    --------specific product detail page maa huney operations haru-----------
//    for getting detail of specific product
    @GetMapping("/{id}")
    @Operation(summary = "to get details of required product")
    public ResponseEntity<ApiResponse<SingleProductWithCostPriceResponse>> getAdminDetailOfProduct(
            @ValidId @PathVariable Long id
    ){
        return success(adminProductService.getAdminDetailOfProduct(id), "Fetched successfully");
    }

//    for updating price of product
    @PutMapping("/{id}/price")
    @Operation(summary = "to update price of specific product")
    public ResponseEntity<ApiResponse<Void>> updateProductPrice(
            @ValidId @PathVariable Long id,
            @ValidPrice @RequestParam BigDecimal price
    ){
        adminProductService.updatePrice(id, price);
        return success("Price updated successfully");
    }

//    for updating quantity/stock of product
    @PutMapping("/{id}/quantity")
    @Operation(summary = "to update stock of specific product")
    public ResponseEntity<ApiResponse<Void>> updateProductQuantity(
            @ValidId @PathVariable Long id,
            @ValidQuantity @RequestParam int quantity
    ){
        adminProductService.updateQuantity(id, quantity);
        return success("Quantity updated successfully");
    }

//    for adding tags to specific product
    @PutMapping("/add-tag-to-product/{productId}")
    @Operation(summary = "to add existing tags to specific product")
    public ResponseEntity<ApiResponse<Void>> addTagToProduct(
            @RequestBody TagOperationRequest request,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.addTagToProduct(request.tagSlugs(), productId);
        return success("Tag added to product.");
    }

//    for removing tag from specific product
//    like offer tag, discount tag
    @PutMapping("/remove-tag-from-product/{productId}")
    @Operation(summary = "to remove tag from specific product")
    public ResponseEntity<ApiResponse<Void>> removeTagFromProduct(
            @RequestBody TagOperationRequest request,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.removeTagFromProduct(request.tagSlugs(), productId);
        return success("Tag removed from product.");
    }

//    update short description
    @PutMapping("/update-short-description/{productId}")
    @Operation(summary = "to update short description of specific product")
    public ResponseEntity<ApiResponse<Void>> updateShortDescription(
            @RequestBody ShortDescriptionRequest request,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.updateShortDescription(productId, request.shortDescription());
        return success("Short description updated successfully.");
    }

//    update long description
    @PutMapping("/update-long-description/{productId}")
    @Operation(summary = "to update long description of specific product")
    public ResponseEntity<ApiResponse<Void>> updateLongDescription(
            @RequestBody LongDescriptionRequest request,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.updateLongDescription(productId, request.longDescription());
        return success("Long description updated successfully.");
    }


}

