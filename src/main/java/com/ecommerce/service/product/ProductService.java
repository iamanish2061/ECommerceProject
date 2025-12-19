package com.ecommerce.service.product;

import com.ecommerce.dto.response.product.*;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.product.*;
import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.product.BrandModel;
import com.ecommerce.model.product.CategoryModel;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.product.TagModel;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.product.BrandRepository;
import com.ecommerce.repository.product.CategoryRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.product.TagRepository;
import com.ecommerce.service.recommendation.UserActivityService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RequiredArgsConstructor
@Service
public class ProductService {

    private final TagRepository tagRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final RedisService redisService;
    private final UserActivityService userActivityService;
    private final TagMapper tagMapper;
    private final ProductMapper productMapper;
    private final BrandMapper brandMapper;
    private final CategoryMapper categoryMapper;
    private final ProductImageMapper productImageMapper;

    @PersistenceContext
    private EntityManager em;


    public List<TagResponse> getAllTags(){
        List<TagModel> tagModels = tagRepository.findAll();
        return tagModels.stream()
                .map(tagMapper::mapEntityToTagResponse)
                .toList();
    }

    public ProductsFromTagResponse getProductsOfTag(String tagSlug) {
        List<ProductModel> products = productRepository.findAllWithImageFromTagSlug(tagSlug);

        if(products.isEmpty()){
            throw new ApplicationException("Product not found!", "NOT_FOUND", HttpStatus.NOT_FOUND);
        }

        TagModel tagModel = products.get(0).getTags()
                .stream().filter(tag-> tag.getSlug().equals(tagSlug))
                .findFirst().orElseThrow(()->
                        new ApplicationException("Tag not found!", "TAG_NOT_FOUND", HttpStatus.NOT_FOUND));

        TagResponse tagResponse = tagMapper.mapEntityToTagResponse(tagModel);

        List<BriefProductsResponse> productsResponses = products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();

        return new ProductsFromTagResponse(tagResponse, productsResponses);
    }

    public List<BrandResponse> getAllBrands() {
        List<BrandModel> brands = brandRepository.findAll();
        return brands.stream()
                .map(brandMapper::mapEntityToBrandResponse)
                .toList();
    }

    public ProductsFromBrandResponse getProductsOfBrand(String brandSlug) {
        List<ProductModel> products= productRepository.findAllWithImageFromBrandSlug(brandSlug);

        if(products.isEmpty()){
            throw new ApplicationException("Products not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND);
        }

        BrandModel brandModel= products.get(0).getBrand();
        BrandResponse brandResponse = brandMapper.mapEntityToBrandResponse(brandModel);

        List<BriefProductsResponse> productsResponse = products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
        return new ProductsFromBrandResponse(brandResponse, productsResponse);
    }

    public List<CategoryResponse> getAllCategories() {
        List<CategoryModel> categories = categoryRepository.findAll();
        return categories.stream()
                .map(categoryMapper::mapEntityToCategoryResponse)
                .toList();
    }

    public ProductsFromCategoryResponse getProductsOfCategory(String categorySlug) {
        List<ProductModel> products = productRepository.findAllWithImageFromCategorySlug(categorySlug);
        if(products.isEmpty())
            throw new ApplicationException("Products not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND);
        CategoryModel categoryModel = products.get(0).getCategory();
        CategoryResponse categoryResponse = categoryMapper.mapEntityToCategoryResponse(categoryModel);
        List<BriefProductsResponse> productsResponse = products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
        return new ProductsFromCategoryResponse(categoryResponse, productsResponse);
    }

    public List<BriefProductsResponse> getAllProducts() {
        List<ProductModel> products = productRepository.findAllProductsAndImages();
        if(products.isEmpty())
            throw new ApplicationException("No products found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND);

        return products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
    }

    public List<BriefProductsResponse> getAllProductsExcept(List<Long> recommendedIds) {
        if (recommendedIds == null || recommendedIds.isEmpty()) {
            return getAllProducts();
        }
        List<ProductModel> products = productRepository.findAllByIdNotIn(recommendedIds);
        if(products.isEmpty())
            throw new ApplicationException("No products found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND);
        return products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
    }

    public SingleProductResponse getDetailOfProduct(UserPrincipal currentUser, Long id) {
        ProductModel product = productRepository.findProductDetailsById(id).orElseThrow(()->
                new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.BAD_REQUEST));

        if(currentUser != null && !currentUser.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))){
            Long userId = currentUser.getUser().getId();
            userActivityService.recordActivity(userId, id, ActivityType.VIEW, 1);
            redisService.updateViewedProduct(userId, id);
        }

        return new SingleProductResponse(
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
                product.getTags().stream()
                        .map(tagMapper::mapEntityToTagResponse)
                        .toList(),
                product.getImages().stream()
                        .map(productImageMapper::mapEntityToProductImageResponse)
                        .toList()
        );
    }

    public List<BriefProductsResponse> getSearchedProducts(String query) {

        List<String> keywords = Arrays.stream(
                            query.toLowerCase()
                                    .replaceAll("\\s*%\\s*", "%")
                                    .trim()
                                    .split("\\s+")
                    )
                    .filter(w -> w.length() > 1)
                    .toList();

        List<ProductModel> products = searchProducts(keywords);

        return products.stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
    }

    private List<ProductModel> searchProducts(List<String> keywords) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<ProductModel> cq = cb.createQuery(ProductModel.class);
        Root<ProductModel> product = cq.from(ProductModel.class);

        Join<ProductModel, TagModel> tagJoin = product.join("tags", JoinType.LEFT);
        Join<ProductModel, BrandModel> brandJoin = product.join("brand", JoinType.LEFT);
        Join<ProductModel, CategoryModel> categoryJoin = product.join("category", JoinType.LEFT);

        List<Predicate> keywordPredicates = new ArrayList<>();

        for (String word : keywords) {
            String pattern = "%" + word.toLowerCase() + "%";

            keywordPredicates.add(
                    cb.or(
                            cb.like(cb.lower(product.get("title")), pattern),
                            cb.like(cb.lower(product.get("slug")), pattern),
                            cb.like(cb.lower(product.get("shortDescription")), pattern),
                            cb.like(cb.lower(product.get("description")), pattern),
                            cb.like(cb.lower(tagJoin.get("name")), pattern),
                            cb.like(cb.lower(brandJoin.get("name")), pattern),
                            cb.like(cb.lower(categoryJoin.get("name")), pattern)
                    )
            );
        }

        cq.where(cb.and(keywordPredicates.toArray(new Predicate[0])))
                .distinct(true);

        return em.createQuery(cq)
                .setMaxResults(15)
                .getResultList();
    }


}