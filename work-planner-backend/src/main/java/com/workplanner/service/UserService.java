package com.workplanner.service;

import com.workplanner.dto.request.RegisterUserRequest;
import com.workplanner.dto.response.UserResponse;
import com.workplanner.entity.User;
import com.workplanner.exception.ResourceNotFoundException;
import com.workplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public List<UserResponse> getAllMembers() {
        return userRepository.findByRoleAndActiveTrue(User.Role.TEAM_MEMBER)
                .stream().map(this::toResponse).toList();
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findByActiveTrue()
                .stream().map(this::toResponse).toList();
    }

    public UserResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return toResponse(user);
    }

    @Transactional
    public UserResponse addMember(RegisterUserRequest req) {
        User.Role role = (req.getRole() != null && req.getRole().equalsIgnoreCase("MANAGER"))
                ? User.Role.MANAGER : User.Role.TEAM_MEMBER;

        String token = UUID.randomUUID().toString();

        User user = userRepository.findByEmail(req.getEmail()).map(existing -> {
            if (existing.isActive()) {
                throw new IllegalArgumentException("Email already in use: " + req.getEmail());
            }
            existing.setName(req.getName());
            existing.setRole(role);
            existing.setActive(true);
            existing.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            existing.setPasswordResetToken(token);
            existing.setTokenExpiry(LocalDateTime.now().plusHours(24));
            return existing;
        }).orElseGet(() -> User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(role)
                .active(true)
                .passwordResetToken(token)
                .tokenExpiry(LocalDateTime.now().plusHours(24))
                .build());

        user = userRepository.save(user);

        String setPasswordUrl = frontendUrl + "/set-password?token=" + token;
        emailService.sendInviteEmail(user, setPasswordUrl);

        return toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, RegisterUserRequest req) {
        User user = findOrThrow(id);
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRole() != null && !req.getRole().isBlank()) {
            user.setRole(req.getRole().equalsIgnoreCase("MANAGER") ? User.Role.MANAGER : User.Role.TEAM_MEMBER);
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            String resetUrl = frontendUrl + "/set-password?token=" + token;
            emailService.sendPasswordResetEmail(user, resetUrl);
        });
    }

    @Transactional
    public void setPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired link."));
        if (user.getTokenExpiry() == null || user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This link has expired. Please contact your manager.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void deactivate(Long id) {
        User user = findOrThrow(id);
        user.setActive(false);
        userRepository.save(user);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
