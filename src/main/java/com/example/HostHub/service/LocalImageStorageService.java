package com.example.HostHub.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.*;

@Service("imageStorageService")
@Slf4j
public class LocalImageStorageService implements StorageService {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    public static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    public static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path uploadPath;

    public LocalImageStorageService() {
    }

    // For testing and programmatic initialization
    public LocalImageStorageService(String uploadDir) {
        this.uploadDir = uploadDir;
        init();
    }

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
            log.info("Initialized local upload directory at: {}", this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory at " + this.uploadPath, e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "image.jpg"));
        String extension = getFileExtension(originalFilename);
        String baseName = originalFilename.contains(".") ? originalFilename.substring(0, originalFilename.lastIndexOf('.')) : originalFilename;
        // Sanitize baseName to avoid invalid characters on disk
        String sanitizedBaseName = baseName.replaceAll("[^a-zA-Z0-9.-]", "_");
        if (sanitizedBaseName.isEmpty()) {
            sanitizedBaseName = "file";
        }

        String uniqueFilename = UUID.randomUUID() + "_" + sanitizedBaseName + extension;

        try {
            Path targetLocation = this.uploadPath.resolve(uniqueFilename).normalize();
            if (!targetLocation.startsWith(this.uploadPath)) {
                throw new IllegalArgumentException("Cannot store file outside current upload directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Successfully stored file: {}", uniqueFilename);
            return "/uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + uniqueFilename, e);
        }
    }

    @Override
    public List<String> storeFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return Collections.emptyList();
        }

        List<String> storedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                storedUrls.add(storeFile(file));
            }
        }
        return storedUrls;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        try {
            String filename = fileUrl.contains("/") ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : fileUrl;
            Path filePath = this.uploadPath.resolve(filename).normalize();

            if (filePath.startsWith(this.uploadPath)) {
                boolean deleted = Files.deleteIfExists(filePath);
                if (deleted) {
                    log.info("Deleted file: {}", filePath);
                } else {
                    log.warn("File to delete did not exist on disk: {}", filePath);
                }
            } else {
                log.warn("Attempted to delete file outside upload directory: {}", fileUrl);
            }
        } catch (IOException e) {
            log.error("Failed to delete file for url: {}", fileUrl, e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB. Current size: "
                    + (file.getSize() / (1024 * 1024)) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type: '" + contentType
                    + "'. Only JPEG, PNG, and WebP images are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = getFileExtension(originalFilename).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException("Invalid file extension: '" + extension
                        + "'. Allowed extensions: " + ALLOWED_EXTENSIONS);
            }
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(dotIndex) : "";
    }
}
