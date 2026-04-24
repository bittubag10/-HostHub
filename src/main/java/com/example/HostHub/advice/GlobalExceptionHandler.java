package com.example.HostHub.advice;


import com.example.HostHub.exception.ResourseNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handelInternalServerError(Exception exception){
        ApiError apiError= ApiError.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message(exception.getMessage())
                .build();
        return buildErrorResponseEntity(apiError);
    }
    @ExceptionHandler(ResourseNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(ResourseNotFoundException exception) {
        // return new ResponseEntity<>("Resource not found ", HttpStatus.NOT_FOUND);

        ApiError apiError= ApiError.builder()
                .status(HttpStatus.NOT_FOUND)
                .message(exception.getMessage())
                .build();
        return buildErrorResponseEntity(apiError);

    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>>handelInputValidationError(MethodArgumentNotValidException exception){
        List<String> errors = exception.
                getBindingResult().
                getAllErrors().
                stream()
                .map(error ->error.getDefaultMessage())
                .collect(Collectors.toList());

        ApiError apiError= ApiError.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message("Input validation failed")
                .suberrors(errors)
                .build();
        return buildErrorResponseEntity(apiError);
    }

    private ResponseEntity<ApiResponse<?>> buildErrorResponseEntity(ApiError apiError) {

        return new ResponseEntity<>(new ApiResponse<>(apiError),apiError.getStatus());
    }
}
