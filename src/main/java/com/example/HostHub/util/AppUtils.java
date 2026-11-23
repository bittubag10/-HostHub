package com.example.HostHub.util;

import com.example.HostHub.entity.User;
import com.example.HostHub.exception.UnAuthorisedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AppUtils {
    public static User getCurrentUser(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new UnAuthorisedException("User is not authenticated");
        }
        return user;
    }
}
