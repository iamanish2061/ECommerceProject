package com.ecommerce.controller.product;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.product.*;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.product.ProductService;
import com.ecommerce.service.recommendation.RecommendationService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    private final RecommendationService recommendationService;

//   getting tags for putting in user interface so user clicks to the tag and get related product result (user side)
//   also for dropdowns and options while adding products (admin side)
    @GetMapping("/tags")
    @Operation(summary = "getting details of all available tags to display tag name")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags(){
        List<TagResponse> tags = productService.getAllTags();
        return ResponseEntity.ok(ApiResponse.ok(tags, "Tags fetched"));
    }

//   while user click the tag, the products related to that tag is returned
//   NOTE send tagSlug not tag name
    @GetMapping("/tags/{tagSlug}")
    @Operation(summary = "getting all products of selected tag")
    public ResponseEntity<ApiResponse<ProductsFromTagResponse>> getProductsOfTag(
            @NotBlank(message = "Tag is required")
            @PathVariable String tagSlug
    ){
        ProductsFromTagResponse response = productService.getProductsOfTag(tagSlug);
        return ResponseEntity.ok(ApiResponse.ok(response, "Products of tag: "+tagSlug));
    }

//  end point for getting brand name that can be used in dropdowns (admin) useful while adding products
//  and for displaying brands we have in brand section (customer sees it)
    @GetMapping("/brand-details")
    @Operation(summary = "getting details of all available brands to display brand name")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAllBrands(){
        List<BrandResponse> brands = productService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.ok(brands, "Brand name fetched"));
    }

//    after customer clicks particular brand from the list this end point return brand info
//    and products of that brand that we have
//    NOTE SEND SLUG WHILE SENDING DATA IN PATH VARIABLE
    @GetMapping("/brand-details/{brandSlug}")
    @Operation(summary = "getting all products of selected brand")
    public ResponseEntity<ApiResponse<ProductsFromBrandResponse>> getProductsOfBrand(
            @NotBlank(message = "Brand is required")
            @PathVariable String brandSlug
    ){
        ProductsFromBrandResponse response = productService.getProductsOfBrand(brandSlug);
        return ResponseEntity.ok(ApiResponse.ok(response, "Products of brand: "+ brandSlug));
    }

//  end point for getting category name that can be used in dropdowns (admin) useful while adding products
//  and for displaying categories we have in brand section (customer sees it)
    @GetMapping("/categories")
    @Operation(summary = "getting details of all available categories to display category name")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories(){
        List<CategoryResponse> categories = productService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories, "Categories fetched"));
    }

//    displaying products according to the selected category
//    NOTE SEND SLUG WHILE SENDING DATA IN PATH VARIABLE
    @GetMapping("/category-products/{categorySlug}")
    @Operation(summary = "getting all products of selected category")
    public ResponseEntity<ApiResponse<ProductsFromCategoryResponse>> getProductsOfCategory(
            @NotBlank(message = "Category is required")
            @PathVariable String categorySlug
    ){
        ProductsFromCategoryResponse categories = productService.getProductsOfCategory(categorySlug);
        return ResponseEntity.ok(ApiResponse.ok(categories, "Products fetched of: "+categorySlug));
    }

//    all products
//    recommendation for users too
    @GetMapping()
    @Operation(summary = "getting all products to display in main page (recommended product ni aauxa if user logged in xa vane")
    public ResponseEntity<ApiResponse<Map<String,List<BriefProductsResponse>>>> getAllProducts(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null || currentUser.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))){
            Map<String, List<BriefProductsResponse>> res = new HashMap<>();
            res.put("products", productService.getAllProducts());
            return ResponseEntity.ok(ApiResponse.ok(res, "Fetched successfully"));
        }

        List<BriefProductsResponse> personalizedProducts = recommendationService.getPersonalizedRecommendation(currentUser.getUser().getId());
        List<Long> personalizedIds = personalizedProducts.stream()
                .map(BriefProductsResponse::id)
                .toList();
        List<BriefProductsResponse> otherProducts = productService.getAllProductsExcept(personalizedIds);
        Map<String, List<BriefProductsResponse>> response = new HashMap<>();
        if(!personalizedProducts.isEmpty()){
            response.put("personalized", personalizedProducts);
        }
        response.put("products", otherProducts);

        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched successfully"));
    }

//    get details of one product
    @GetMapping("/{id}")
    @Operation(summary = "get detailed info of one product")
    public ResponseEntity<ApiResponse<SingleProductResponse>> getDetailOfProduct(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long id
    ){
        SingleProductResponse product = productService.getDetailOfProduct(currentUser, id);
        return ResponseEntity.ok(ApiResponse.ok(product, "Fetched successfully"));
    }

    //searched product
    @GetMapping("/searched")
    @Operation(summary = "getting products related user searched query")
    public ResponseEntity<ApiResponse<List<BriefProductsResponse>>> getSearchedProducts(
            @NotBlank(message = "Searched keyword is needed")
            @Pattern(
                    regexp = "^[a-zA-Z0-9 %]+$",
                    message = "Only letters, numbers, spaces and % are allowed"
            )
            @RequestParam String query
    ){
        List<BriefProductsResponse> response = productService.getSearchedProducts(query);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched searched product successfully"));
    }


}
