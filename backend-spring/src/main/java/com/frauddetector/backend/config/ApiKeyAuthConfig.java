package com.frauddetector.backend.config;

import com.frauddetector.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class ApiKeyAuthConfig implements WebMvcConfigurer {

    private final AuthService authService;

    @Value("${app.security.api-key:}")
    private String apiKey;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    return true;
                }
                if (apiKey == null || apiKey.isBlank()) {
                    return true;
                }
                String path = request.getRequestURI();
                if (path.startsWith("/actuator/") || path.startsWith("/api/auth/")) {
                    return true;
                }
                String providedKey = request.getHeader("X-API-Key");
                if (apiKey.equals(providedKey)) {
                    return true;
                }
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authService.validateToken(authHeader)) {
                    return true;
                }
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
        });
    }
}
