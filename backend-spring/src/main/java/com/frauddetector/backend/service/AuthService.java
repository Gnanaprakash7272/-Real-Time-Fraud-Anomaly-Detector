package com.frauddetector.backend.service;

import com.frauddetector.backend.dto.LoginRequest;
import com.frauddetector.backend.dto.LoginResponse;
import com.frauddetector.backend.model.AppUser;
import com.frauddetector.backend.repository.AppUserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;

    // Active sessions: token -> username
    private final ConcurrentHashMap<String, String> activeSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void seedDefaultUsers() {
        try {
            if (userRepository.findByUsername("analyst").isEmpty()) {
                createAndSaveUser("analyst", "SecureVault@2025", "ANALYST");
            }
            if (userRepository.findByUsername("admin").isEmpty()) {
                createAndSaveUser("admin", "AdminVault@2025", "ADMIN");
            }
            log.info("Default vault users seeded successfully (analyst, admin)");
        } catch (Exception e) {
            log.error("Failed to seed default vault users", e);
        }
    }

    private void createAndSaveUser(String username, String rawPassword, String role) throws Exception {
        byte[] saltBytes = new byte[16];
        new SecureRandom().nextBytes(saltBytes);
        String salt = Base64.getEncoder().encodeToString(saltBytes);
        String passwordHash = hashPassword(rawPassword, saltBytes);

        AppUser user = AppUser.builder()
                .username(username)
                .passwordHash(passwordHash)
                .salt(salt)
                .role(role)
                .active(true)
                .build();
        userRepository.save(user);
    }

    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return LoginResponse.builder()
                    .authenticated(false)
                    .message("Invalid username or password")
                    .build();
        }

        String username = request.getUsername().trim();
        Optional<AppUser> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || !userOpt.get().isActive()) {
            return LoginResponse.builder()
                    .authenticated(false)
                    .message("Invalid username or password")
                    .build();
        }

        AppUser user = userOpt.get();
        try {
            byte[] saltBytes = Base64.getDecoder().decode(user.getSalt());
            String computedHash = hashPassword(request.getPassword(), saltBytes);

            if (!MessageDigest.isEqual(computedHash.getBytes(), user.getPasswordHash().getBytes())) {
                return LoginResponse.builder()
                        .authenticated(false)
                        .message("Invalid username or password")
                        .build();
            }

            String token = "VAULT-" + UUID.randomUUID().toString().toUpperCase();
            activeSessions.put(token, user.getUsername());

            log.info("Vault user authenticated: {}", username);

            return LoginResponse.builder()
                    .authenticated(true)
                    .token(token)
                    .username(user.getUsername())
                    .role(user.getRole())
                    .message("Access granted")
                    .build();

        } catch (Exception e) {
            log.error("Error during vault authentication for user {}", username, e);
            return LoginResponse.builder()
                    .authenticated(false)
                    .message("Invalid username or password")
                    .build();
        }
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) return false;
        String cleanToken = token.replace("Bearer ", "").trim();
        return activeSessions.containsKey(cleanToken);
    }

    public void logout(String token) {
        if (token != null) {
            String cleanToken = token.replace("Bearer ", "").trim();
            activeSessions.remove(cleanToken);
        }
    }

    private String hashPassword(String password, byte[] salt) throws Exception {
        KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 256);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] hash = factory.generateSecret(spec).getEncoded();
        return Base64.getEncoder().encodeToString(hash);
    }
}
