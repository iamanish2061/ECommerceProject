package com.ecommerce.service.image;

import com.ecommerce.dto.request.product.AddProductImageRequest;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.product.ProductImageModel;
import com.ecommerce.utils.HelperClass;
import com.ecommerce.utils.ImageUploadHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class ImageStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String uploadSystemImage(MultipartFile file, String name, String type) throws IOException, InterruptedException {
        ImageUploadHelper.fileValidation(file);
        String folder = getFolder(type);
        String basename = HelperClass.generateSlug(name);
        String extension = ImageUploadHelper.getFileExtension(file);
        return uploadToCloud(file, folder, basename, extension);
    }

    public ProductImageModel uploadSystemImage(MultipartFile file, AddProductImageRequest request) throws IOException, InterruptedException {
        String fileUrl = uploadSystemImage(file, request.name().trim(), "PRODUCT");
        ProductImageModel imgModel = new ProductImageModel();
        imgModel.setUrl(fileUrl);
        imgModel.setAltText(request.altText().trim());
        imgModel.setThumbnail(request.thumbnail());
        return imgModel;
    }

    public String uploadClientImage(MultipartFile file, String username, String type) throws IOException, InterruptedException {
        ImageUploadHelper.fileValidation(file);
        String extension = ImageUploadHelper.getFileExtension(file);
        return uploadToCloud(file, getFolder(type), username, extension);
    }

    public String getFolder(String type){
        return switch (type.toUpperCase()) {
            case "PRODUCT"  -> "products";
            case "BRAND"    -> "brands";
            case "CATEGORY" -> "categories";
            case "SERVICE"  -> "services";
            case "PROFILE"  -> "profile-picture";
            case "LICENSE"  -> "license-photo";
            default         -> "others";
        };
    }

    private String uploadToCloud(MultipartFile file, String folder, String name, String extension) throws IOException, InterruptedException {
        String filename = folder + "/" + name + "-" + System.currentTimeMillis() + "." + extension;

//         Supabase Storage API URL
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filename;

//        Request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uploadUrl))
                .header("Authorization", "Bearer " + supabaseKey)
                .header("apikey", supabaseKey)
                .header("Content-Type", file.getContentType())
                .PUT(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                .build();

//        execute Upload
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + filename;
        } else {
            throw new ApplicationException("Supabase Error: " + response.body(), "STORAGE_ERROR", HttpStatus.BAD_GATEWAY);
        }
    }
}