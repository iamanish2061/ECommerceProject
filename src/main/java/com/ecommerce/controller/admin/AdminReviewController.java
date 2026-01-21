package com.ecommerce.controller.admin;

import com.ecommerce.dto.request.review.AddReviewRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.review.ReviewResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.admin.AdminReviewService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Validated
@RequestMapping("/admin/api/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final AdminReviewService reviewService;

    @GetMapping()
    @Operation(summary = "to fetch all reviews to display on admin review page")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviewsOnDescendingOrder (){
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getAllReviews(), "All reviews fetched successfully"));
    }

    @PostMapping()
    @Operation(summary = "to add new review by admin")
    public ResponseEntity<ApiResponse<?>> saveReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddReviewRequest request
    ){
        reviewService.saveReview(currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully!"));
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "to update any existing review of admin")
    public ResponseEntity<ApiResponse<?>> updateReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddReviewRequest request,
            @ValidId @PathVariable Long reviewId
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        reviewService.updateReview(reviewId, currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Review updated successfully"));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "to delete review by an admin")
    public ResponseEntity<ApiResponse<?>> deleteReview(
            @ValidId @PathVariable Long reviewId
    ){
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.ok("Review deleted successfully"));
    }


}
