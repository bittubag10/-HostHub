package com.example.HostHub.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StorageService {
    String storeFile(MultipartFile file);
    List<String> storeFiles(MultipartFile[] files);
    void deleteFile(String fileUrl);
}
