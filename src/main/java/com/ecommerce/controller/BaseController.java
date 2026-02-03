package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public abstract class BaseController {

    protected <T> ResponseEntity<ApiResponse<T>> success(String message) {
        return ResponseEntity.ok(ApiResponse.ok(message));
    }

    protected <T> ResponseEntity<ApiResponse<T>> success( T data, String message) {
        return ResponseEntity.ok(ApiResponse.ok(data, message));
    }

    protected <T> ResponseEntity<ApiResponse<T>> success(T data, String message, HttpStatus status){
        return ResponseEntity.status(status)
                .body(ApiResponse.ok(data, message));
    }

    protected <T> ResponseEntity<ApiResponse<T>> error(String message, String errorCode, HttpStatus status) {
        return ResponseEntity.status(status).body(ApiResponse.error(message, errorCode));
    }

    protected <T> ResponseEntity<ApiResponse<T>> error(String message, HttpStatus status) {
        return ResponseEntity.status(status).body(ApiResponse.ok(message));
    }

    protected <T> ResponseEntity<ApiResponse<T>> unauthorized(){
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
    }


}
