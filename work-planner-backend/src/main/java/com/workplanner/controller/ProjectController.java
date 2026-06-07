package com.workplanner.controller;

import com.workplanner.dto.request.CreateProjectRequest;
import com.workplanner.dto.response.ProjectResponse;
import com.workplanner.repository.UserRepository;
import com.workplanner.service.ProjectService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAll() {
        return ResponseEntity.ok(projectService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest req,
                                                  Authentication auth) {
        Long managerId = userRepository.findByEmail(auth.getName()).orElseThrow().getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(req, managerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody CreateProjectRequest req) {
        return ResponseEntity.ok(projectService.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProjectResponse> updateStatus(@PathVariable Long id,
                                                        @RequestBody StatusRequest req) {
        return ResponseEntity.ok(projectService.updateStatus(id, req.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class StatusRequest {
        private String status;
    }
}
