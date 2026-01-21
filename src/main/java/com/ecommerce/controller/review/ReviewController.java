package com.ecommerce.controller.review;

import com.ecommerce.dto.request.review.AddReviewRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.review.ReviewResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.review.ReviewService;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/for-homepage")
    @Operation(summary = "to fetch highly rated reviews to display on homepage")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getHighRatedReviews (){
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getHighRatedReviews(), "Reviews fetched successfully"));
    }

    @GetMapping()
    @Operation(summary = "to fetch all reviews to display on review page")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviewsOnDescendingOrder (){
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getAllReviews(), "All reviews fetched successfully"));
    }

    @PostMapping()
    @Operation(summary = "to add new review")
    public ResponseEntity<ApiResponse<?>> saveReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddReviewRequest request
    ){
        reviewService.saveReview(currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully!"));
    }

    @GetMapping("/my-reviews")
    @Operation(summary = "to fetch reviews to display on profile page")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getMyReviews (
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getMyReviews(currentUser.getUser()), "Review fetched successfully"));
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "to update any existing review")
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
    @Operation(summary = "to delete review by an user from profile page")
    public ResponseEntity<ApiResponse<?>> deleteReview(
            @ValidId @PathVariable Long reviewId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        reviewService.deleteReview(reviewId, currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok("Review deleted successfully"));
    }


}
