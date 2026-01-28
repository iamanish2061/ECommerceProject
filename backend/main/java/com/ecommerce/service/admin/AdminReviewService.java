package com.ecommerce.service.admin;

import com.ecommerce.dto.request.review.AddReviewRequest;
import com.ecommerce.dto.response.review.ReviewResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.review.ReviewMapper;
import com.ecommerce.model.review.Review;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.review.ReviewRepository;
import com.ecommerce.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(reviewMapper::mapEntityToReviewResponse)
                .toList();
    }

    @Transactional
    public void saveReview(UserModel user, AddReviewRequest request) {
        UserModel existingUser = userRepository.findById(user.getId())
                .orElseThrow(()-> new ApplicationException("User not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));

        Review review = Review.builder()
                .user(existingUser)
                .rating(request.rating())
                .title(request.title())
                .comment(request.comment())
                .build();

        reviewRepository.save(review);
    }

    @Transactional
    public void updateReview(Long reviewId, UserModel user, AddReviewRequest request) {
        Review review = reviewRepository.findByReviewId(reviewId)
                .orElseThrow(()-> new ApplicationException("Review not found!", "REVIEW_NOT_FOUND", HttpStatus.NOT_FOUND));

        if(review.getUser().getId() != user.getId()){
            throw new ApplicationException("Cannot update others comment!", "INVALID_ACTION", HttpStatus.BAD_REQUEST);
        }

        review.setRating(request.rating());
        review.setTitle(request.title());
        review.setComment(request.comment());
        review.setUpdatedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findByReviewId(reviewId)
                .orElseThrow(()-> new ApplicationException("Review not found!", "REVIEW_NOT_FOUND", HttpStatus.NOT_FOUND));

        reviewRepository.delete(review);
    }
}
