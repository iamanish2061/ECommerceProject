package com.ecommerce.utils;

import com.ecommerce.exception.ApplicationException;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Data
public class ProfilePictureUploadHelper {

    private static final Path PROFILE_UPLOAD_DIR = Paths.get("uploads/profile-picture").toAbsolutePath();

    public static String uploadImage(MultipartFile file, String name)throws ApplicationException {
        ImageUploadHelper.fileValidation(file);
        String extension = ImageUploadHelper.getFileExtension(file);

        String filename=name+"."+extension;
        Path targetPath = PROFILE_UPLOAD_DIR.resolve(filename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApplicationException(e.getMessage(), "IO_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return "/uploads/products/" + filename;
    }

}
