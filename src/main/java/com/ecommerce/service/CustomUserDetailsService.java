package com.ecommerce.service;

import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserModel user = userRepo.findByUsername(username).orElse(null);

        if(user == null){
            throw new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        return new UserPrincipal(user);
    }
}
