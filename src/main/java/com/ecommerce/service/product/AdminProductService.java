package com.ecommerce.service.product;

import com.ecommerce.dto.request.product.*;
import com.ecommerce.dto.response.product.NameAndIdResponse;
import com.ecommerce.dto.response.product.SingleProductResponse;
import com.ecommerce.dto.response.product.SingleProductWithCostPriceResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.product.BrandMapper;
import com.ecommerce.mapper.product.CategoryMapper;
import com.ecommerce.mapper.product.ProductImageMapper;
import com.ecommerce.mapper.product.TagMapper;
import com.ecommerce.model.product.*;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.BrandRepository;
import com.ecommerce.repository.product.CategoryRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.product.TagRepository;
import com.ecommerce.utils.HelperClass;
import com.ecommerce.utils.ImageUploadHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class AdminProductService {

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ProductRepository productRepository;

    private final BrandMapper brandMapper;
    private final TagMapper tagMapper;
    private final CategoryMapper categoryMapper;
    private final ProductImageMapper productImageMapper;


    @Transactional
    public void addBrand(BrandRequest brandRequest, MultipartFile logo) {
        BrandModel brandModel = new BrandModel();
        brandModel.setName(brandRequest.name().trim());
        brandModel.setSlug(HelperClass.generateSlug(brandRequest.name().trim()));
        String url = ImageUploadHelper.uploadImage(logo, brandRequest.name().trim());
        brandModel.setLogoUrl(url);

        brandRepository.save(brandModel);
    }

    @Transactional
    public void addCategory(CategoryRequest categoryRequest, MultipartFile image) {
        CategoryModel categoryParent = categoryRepository.findBySlug(categoryRequest.parentSlug().trim())
                .orElse(null);
        CategoryModel categoryModel = new CategoryModel();
        categoryModel.setName(categoryRequest.name());
        categoryModel.setSlug(HelperClass.generateSlug(categoryRequest.name().trim()));
        categoryModel.setParent(categoryParent);
        String url = ImageUploadHelper.uploadImage(image, categoryRequest.name().trim());
        categoryModel.setImageUrl(url);
        categoryRepository.save(categoryModel);
    }

    @Transactional
    public void addTags(TagRequest request){
        List<String> incomingNames = request.names().stream()
                .map(String::trim)
                .toList();
//        generating slugs of all tags
        List<String> incomingSlugs = incomingNames.stream()
                .map(HelperClass::generateSlug)
                .toList();

        Set<String> existingSlugs = tagRepository.findSlugsBySlugIn(incomingSlugs);

        List<TagModel> newTagModels = new ArrayList<>();

        for (String name : incomingNames) {
            String slug = HelperClass.generateSlug(name);

            if (!existingSlugs.contains(slug)) {
                newTagModels.add(new TagModel(name, slug));
            }
        }

        if (!newTagModels.isEmpty()) {
            tagRepository.saveAll(newTagModels);
        }
    }

    @Transactional
    public SingleProductWithCostPriceResponse addNewProduct(ProductRequest request, List<MultipartFile> imageFiles){

//        handling brands
        BrandModel brand = brandRepository.findBySlug(request.brandSlug().trim())
                .orElseThrow(() -> new ApplicationException("Brand not found", "BRAND_NOT_FOUND", HttpStatus.NOT_FOUND));
//        handling category
        CategoryModel category = categoryRepository.findBySlug(request.categorySlug().trim())
                .orElseThrow(() -> new ApplicationException("Category not found!", "CATEGORY_NOT_FOUND", HttpStatus.NOT_FOUND));
//        handling tags
        Set<TagModel> tags = new HashSet<>();
        for (String slug : request.tagSlugs()) {
            String cleanSlug = slug.trim().toLowerCase();
            if (cleanSlug.isBlank()) continue;
            TagModel tag = tagRepository.findBySlug(cleanSlug)
                    .orElseThrow(() -> new ApplicationException("Tag not found!", "TAG_NOT_FOUND", HttpStatus.NOT_FOUND));
            tags.add(tag);
        }
//        Creating Product
        ProductModel product = new ProductModel();
        product.setSku(request.sku().trim().toUpperCase());
        product.setTitle(request.title().trim());
        product.setSlug(HelperClass.generateSlug(request.title().trim()));
        product.setShortDescription(request.shortDescription().trim());
        product.setDescription(request.description().trim());
        product.setCostPrice(request.costPrice());
        product.setSellingPrice(request.sellingPrice());
        product.setStock(request.stock() != null ? request.stock() : 0);
        product.setSizeMl(request.sizeMl());
        product.setActive(request.active());

        product.addTags(tags);
        brand.addProduct(product);
        category.addProduct(product);


        List<ProductImageModel> imageModels = new ArrayList<>();

        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (int i = 0; i < imageFiles.size(); i++) {
                MultipartFile file = imageFiles.get(i);
                AddProductImageRequest imgReq = request.images().get(i);
                ProductImageModel imageModel = ImageUploadHelper.uploadImage(file, imgReq);
                imageModels.add(imageModel);
            }
        }
        imageModels.forEach(product::addImage);
        // 6. Save everything (cascade handles images + tags)
        ProductModel savedProduct = productRepository.save(product);

        return getAdminDetailOfProduct(savedProduct.getId());
    }





//    --
    public SingleProductWithCostPriceResponse getAdminDetailOfProduct(Long id) {
        ProductModel product = productRepository.findProductDetailsById(id)
                .orElseThrow(()->new ApplicationException("Product not found", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        SingleProductResponse productResponse = new SingleProductResponse(
                product.getId(),
                product.getSku(),
                product.getTitle(),
                product.getShortDescription(),
                product.getDescription(),
                brandMapper.mapEntityToBrandResponse(product.getBrand()),
                categoryMapper.mapEntityToCategoryResponse(product.getCategory()),
                product.getSellingPrice(),
                product.getStock(),
                product.getSizeMl(),
                product.getTags().stream().map(tagMapper::mapEntityToTagResponse).toList(),
                product.getImages().stream().map(productImageMapper::mapEntityToProductImageResponse).toList()
        );

        return new SingleProductWithCostPriceResponse(productResponse, product.getCostPrice());
    }

    @Transactional
    public void updatePrice(Long productId, BigDecimal price) {
        ProductModel productModel = productRepository.findById(productId)
                .orElseThrow(()->
                        new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        productModel.setSellingPrice(price);
        productRepository.save(productModel);
    }

    @Transactional
    public void updateQuantity(Long productId, int quantity) {
        ProductModel productModel = productRepository.findById(productId)
                .orElseThrow(()->
                        new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        Integer newStock = productModel.getStock()+quantity;
        productModel.setStock(newStock);
        productRepository.save(productModel);
    }

    @Transactional
    public void addTagToProduct(List<String> slugs, Long productId){
        ProductModel productModel = productRepository.findProductByIdWithTags(productId)
                .orElseThrow(()->
                        new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        Set<TagModel> tags = new HashSet<>();
        slugs.forEach(slug->{
            TagModel tagModel = tagRepository.findBySlug(slug)
                    .orElseThrow(()->new ApplicationException("Tag not found!", "TAG_NOT_FOUND", HttpStatus.NOT_FOUND));
            if(!productModel.getTags().contains(tagModel)){
                tags.add(tagModel);
            }
        });
        productModel.addTags(tags);
    }

    @Transactional
    public void removeTagFromProduct(List<String> slugs, Long productId){
        ProductModel productModel = productRepository.findProductByIdWithTags(productId)
                .orElseThrow(()->
                        new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        Set<TagModel> tags = new HashSet<>();
        slugs.forEach(slug->{
            TagModel tagModel = tagRepository.findBySlug(slug)
                    .orElseThrow(()->new ApplicationException("Tag not found!", "TAG_NOT_FOUND", HttpStatus.NOT_FOUND));
            if(productModel.getTags().contains(tagModel)){
                tags.add(tagModel);
            }
        });
        tags.forEach(productModel::removeTag);
    }

    public void updateShortDescription(Long productId, String shortDescription) {
        ProductModel product = productRepository.findById(productId)
                .orElseThrow(()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        product.setShortDescription(shortDescription);
        productRepository.save(product);
    }

    public void updateLongDescription(Long productId, String longDescription) {
        ProductModel product = productRepository.findById(productId)
                .orElseThrow(()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        product.setDescription(longDescription);
        productRepository.save(product);
    }


    public List<NameAndIdResponse> getNameAndIdOfAllProducts() {
        List<ProductModel> products = productRepository.findAll();
        return products.stream()
                .map(p-> new NameAndIdResponse(p.getId(), p.getTitle(), p.getStock(), p.getSellingPrice()))
                .toList();
    }
}
