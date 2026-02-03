package com.ecommerce.controller.admin;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.review.AddReviewRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.review.ReviewResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.admin.AdminReviewService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController extends BaseController {

    private final AdminReviewService reviewService;

    @GetMapping()
    @Operation(summary = "to fetch all reviews to display on admin review page")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviewsOnDescendingOrder (){
        return success(reviewService.getAllReviews(), "All reviews fetched successfully");
    }

    @PostMapping()
    @Operation(summary = "to add new review by admin")
    public ResponseEntity<ApiResponse<Void>> saveReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddReviewRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        reviewService.saveReview(currentUser.getUser(), request);
        return success("Review submitted successfully!");
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "to update any existing review of admin")
    public ResponseEntity<ApiResponse<Void>> updateReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddReviewRequest request,
            @ValidId @PathVariable Long reviewId
    ){
        if(currentUser == null){
            return unauthorized();
        }
        reviewService.updateReview(reviewId, currentUser.getUser(), request);
        return success("Review updated successfully");
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "to delete review by an admin")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @ValidId @PathVariable Long reviewId
    ){
        reviewService.deleteReview(reviewId);
        return success("Review deleted successfully");
    }


}
