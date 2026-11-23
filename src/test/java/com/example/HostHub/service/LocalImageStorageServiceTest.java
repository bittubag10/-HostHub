package com.example.HostHub.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LocalImageStorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalImageStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new LocalImageStorageService(tempDir.toString());
    }

    @Test
    @DisplayName("Should store valid JPEG file and return accessible URL")
    void testStoreFile_ValidJpeg() throws IOException {
        byte[] content = "fake-jpeg-content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "files",
                "beach-view.jpg",
                "image/jpeg",
                content
        );

        String fileUrl = storageService.storeFile(file);

        assertNotNull(fileUrl);
        assertTrue(fileUrl.startsWith("/uploads/"));
        assertTrue(fileUrl.endsWith(".jpg"));

        // Verify the file was physically saved in tempDir
        String filename = fileUrl.substring("/uploads/".length());
        Path savedFile = tempDir.resolve(filename);
        assertTrue(Files.exists(savedFile));
        assertArrayEquals(content, Files.readAllBytes(savedFile));
    }

    @Test
    @DisplayName("Should store valid PNG and WebP files")
    void testStoreFile_ValidPngAndWebp() {
        MockMultipartFile pngFile = new MockMultipartFile(
                "files", "suite.png", "image/png", "png-data".getBytes());
        MockMultipartFile webpFile = new MockMultipartFile(
                "files", "pool.webp", "image/webp", "webp-data".getBytes());

        String pngUrl = storageService.storeFile(pngFile);
        String webpUrl = storageService.storeFile(webpFile);

        assertTrue(pngUrl.endsWith(".png"));
        assertTrue(webpUrl.endsWith(".webp"));

        List<String> multiUpload = storageService.storeFiles(new MockMultipartFile[]{pngFile, webpFile});
        assertEquals(2, multiUpload.size());
    }

    @Test
    @DisplayName("Should reject invalid MIME type with clean IllegalArgumentException")
    void testStoreFile_InvalidMimeType() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "files", "contract.pdf", "application/pdf", "pdf-data".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(pdfFile));

        assertTrue(ex.getMessage().contains("Invalid file type"));
    }

    @Test
    @DisplayName("Should reject invalid file extension with clean IllegalArgumentException")
    void testStoreFile_InvalidExtension() {
        MockMultipartFile scriptFile = new MockMultipartFile(
                "files", "malicious.sh", "image/jpeg", "echo hello".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(scriptFile));

        assertTrue(ex.getMessage().contains("Invalid file extension"));
    }

    @Test
    @DisplayName("Should reject empty file with clean IllegalArgumentException")
    void testStoreFile_EmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "files", "empty.jpg", "image/jpeg", new byte[0]);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(emptyFile));

        assertTrue(ex.getMessage().contains("Cannot upload an empty file"));
    }

    @Test
    @DisplayName("Should reject file exceeding 5MB maximum size")
    void testStoreFile_OversizedFile() {
        // 5MB + 1 byte
        byte[] largeContent = new byte[(int) LocalImageStorageService.MAX_FILE_SIZE + 1];
        MockMultipartFile largeFile = new MockMultipartFile(
                "files", "large.png", "image/png", largeContent);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(largeFile));

        assertTrue(ex.getMessage().contains("File size exceeds maximum limit of 5MB"));
    }

    @Test
    @DisplayName("Should delete file from disk and handle non-existent file gracefully")
    void testDeleteFile() {
        MockMultipartFile file = new MockMultipartFile(
                "files", "delete-me.jpg", "image/jpeg", "sample".getBytes());
        String fileUrl = storageService.storeFile(file);

        String filename = fileUrl.substring("/uploads/".length());
        Path savedFile = tempDir.resolve(filename);
        assertTrue(Files.exists(savedFile));

        // Delete file
        storageService.deleteFile(fileUrl);
        assertFalse(Files.exists(savedFile));

        // Deleting non-existent file should not throw exception
        assertDoesNotThrow(() -> storageService.deleteFile("/uploads/non-existent.jpg"));
        assertDoesNotThrow(() -> storageService.deleteFile(null));
    }
}
