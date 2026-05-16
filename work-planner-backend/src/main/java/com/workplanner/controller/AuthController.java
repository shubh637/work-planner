package com.workplanner.controller;

import com.workplanner.dto.request.LoginRequest;
import com.workplanner.dto.request.RegisterUserRequest;
import com.workplanner.dto.request.SetPasswordRequest;
import com.workplanner.dto.response.AuthResponse;
import com.workplanner.service.AuthService;
import com.workplanner.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterUserRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/set-password")
    public ResponseEntity<Void> setPassword(@Valid @RequestBody SetPasswordRequest req) {
        userService.setPassword(req.getToken(), req.getPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        userService.forgotPassword(body.get("email"));
        return ResponseEntity.ok().build();
    }
}
