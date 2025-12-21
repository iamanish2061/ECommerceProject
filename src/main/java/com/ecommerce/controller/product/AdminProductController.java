package com.ecommerce.controller.product;


import com.ecommerce.dto.request.product.BrandRequest;
import com.ecommerce.dto.request.product.CategoryRequest;
import com.ecommerce.dto.request.product.ProductRequest;
import com.ecommerce.dto.request.product.TagRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.product.NameAndIdResponse;
import com.ecommerce.dto.response.product.SingleProductWithCostPriceResponse;
import com.ecommerce.service.product.AdminProductService;
import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidPrice;
import com.ecommerce.validation.ValidQuantity;
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
public class AdminProductController {

    private final AdminProductService adminProductService;

//    --------main page maa huney operations haru-----------
//    for adding brand : format form maa xa mero desktop ko
    @PostMapping(value = "/brand", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> addBrand(
            @Valid @RequestPart("addBrandRequest") BrandRequest brandRequest,
            @RequestPart("logo") MultipartFile logo
    ){
        adminProductService.addBrand(brandRequest, logo);
        return ResponseEntity.ok(ApiResponse.ok("Brand added successfully"));
    }

//    for adding category
    @PostMapping(value = "/category", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> addCategory(
            @Valid @RequestPart("addCategoryRequest")CategoryRequest addCategoryRequest,
            @RequestPart("image") MultipartFile image
    ){
        adminProductService.addCategory(addCategoryRequest, image);
        return ResponseEntity.ok(ApiResponse.ok("Category added successfully"));
    }

//    for adding tags
    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<String>> addTags(
            @Valid @RequestBody TagRequest tagRequests
    ){
        adminProductService.addTags(tagRequests);
        return ResponseEntity.ok(
                ApiResponse.ok("Tags added successfully"));
    }

    // send brand and category slug ---for adding product
    @PostMapping(value = "/", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SingleProductWithCostPriceResponse>> addNewProduct(
            @Valid @RequestPart("addProductRequest") ProductRequest addProductRequest,
            @RequestPart("imageFiles") List<MultipartFile> imageFiles
    ){
        SingleProductWithCostPriceResponse response = adminProductService.addNewProduct(addProductRequest, imageFiles);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "New product added successfully"));
    }






//    --------specific product detail page maa huney operations haru-----------
//    for getting detail of specific product
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SingleProductWithCostPriceResponse>> getAdminDetailOfProduct(
            @ValidId @PathVariable Long id
    ){
        SingleProductWithCostPriceResponse product = adminProductService.getAdminDetailOfProduct(id);
        return ResponseEntity.ok(ApiResponse.ok(product, "Fetched successfully"));
    }

//    for updating price of product
    @PutMapping("/{id}/price")
    public ResponseEntity<ApiResponse<?>> updateProductPrice(
            @ValidId @PathVariable Long id,
            @ValidPrice @RequestParam BigDecimal price
    ){
        adminProductService.updatePrice(id, price);
        return ResponseEntity.ok(ApiResponse.ok("Price updated successfully"));
    }

//    for updating quantity/stock of product
    @PutMapping("/{id}/quantity")
    public ResponseEntity<ApiResponse<?>> updateProductQuantity(
            @ValidId @PathVariable Long id,
            @ValidQuantity @RequestParam int quantity
    ){
        adminProductService.updateQuantity(id, quantity);
        return ResponseEntity.ok(ApiResponse.ok("Quantity updated successfully"));
    }

//    for adding tags to specific product
//    like offer tag, discount tag
//    checkbox bata tag select garney and list banayera pathaune (checking if the product already has that tag frintend mai )
    @PutMapping("/add-tag-to-product/{productId}")
    public ResponseEntity<ApiResponse<?>> addTagToProduct(
            @RequestBody List<String> tagSlugs,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.addTagToProduct(tagSlugs, productId);
        return ResponseEntity.ok(
                ApiResponse.ok("Tag added to product.")
        );
    }

//    for removing tag from specific product
//    like offer tag, discount tag
//    checkbox bata tag select garney and list banayera pathaune (checking if the product already has that tag frintend mai )
    @PutMapping("/remove-tag-from-product/{productId}")
    public ResponseEntity<ApiResponse<?>> removeTagFromProduct(
            @RequestBody List<String> tagSlugs,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.removeTagFromProduct(tagSlugs, productId);
        return ResponseEntity.ok(
                ApiResponse.ok("Tag removed from product.")
        );
    }

//    update short description
    @PutMapping("/update-short-description/{productId}")
    public ResponseEntity<ApiResponse<?>> updateShortDescription(
            @RequestBody String shortDescription,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.updateShortDescription(productId, shortDescription);
        return ResponseEntity.ok(
                ApiResponse.ok("Short description updated successfully.")
        );
    }

//    update long description
    @PutMapping("/update-long-description/{productId}")
    public ResponseEntity<ApiResponse<?>> updateLongDescription(
            @RequestBody String longDescription,
            @ValidId
            @PathVariable Long productId
    ){
        adminProductService.updateLongDescription(productId, longDescription);
        return ResponseEntity.ok(
                ApiResponse.ok("Long description updated successfully.")
        );
    }

//    get product name and id for putting in dropdown to sell product in store
    @GetMapping("/id-and-name")
    public ResponseEntity<ApiResponse<List<NameAndIdResponse>>> getNameAndIdOfAllProducts(){
        List<NameAndIdResponse> response = adminProductService.getNameAndIdOfAllProducts();
        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched name and if of products successfully"));
    }


}

