package com.ecommerce.utils;

import com.ecommerce.dto.request.product.AddProductImageRequest;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.product.ProductImageModel;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.Set;

@Data
public class ImageUploadHelper {

    private static final Path UPLOAD_DIR = Paths.get("uploads/products").toAbsolutePath();
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );

    public static void fileValidation(MultipartFile file) throws ApplicationException{
        if (file.isEmpty()) {
            throw new ApplicationException("File is empty!", "FILE_IS_EMPTY", HttpStatus.NOT_ACCEPTABLE);
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ApplicationException("File too large! Max 5MB", "FILE_IS_TOO_BIG", HttpStatus.NOT_ACCEPTABLE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ApplicationException("Only JPEG, PNG, and WebP images are allowed", "INVALID_TYPE", HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }

    public static String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    private static String getExtensionFromContentType(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    public static String getFileExtension(MultipartFile file){
        String extension = getFileExtension(file.getOriginalFilename());
        if(extension.isEmpty()){
            extension = getExtensionFromContentType(Objects.requireNonNull(file.getContentType()));
        }
        return extension;
    }

    public static ProductImageModel uploadImage(MultipartFile file, AddProductImageRequest request) throws ApplicationException {
        fileValidation(file);
        String fileUrl = uploadImage(file, request.name().trim());
        ProductImageModel imgModel = new ProductImageModel();
        imgModel.setUrl(fileUrl);
        imgModel.setAltText(request.altText().trim());
        imgModel.setThumbnail(request.thumbnail());
        return imgModel;
    }

    public static String uploadImage(MultipartFile file, String name)throws ApplicationException{
        String basename = HelperClass.generateSlug(name);
        String extension = getFileExtension(file);

        String filename=basename+"."+extension;
        Path targetPath = UPLOAD_DIR.resolve(filename);
        int counter = 1;
        while(Files.exists(targetPath)){
            filename = basename+"-"+counter+"."+extension;
            counter++;
            targetPath = UPLOAD_DIR.resolve(filename);
        }
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApplicationException(e.getMessage(), "IO_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return "/uploads/products/" + filename;
    }

}








