package com.workplanner.controller;

import com.workplanner.dto.request.*;
import com.workplanner.dto.response.TaskProgressResponse;
import com.workplanner.dto.response.TaskResponse;
import com.workplanner.repository.UserRepository;
import com.workplanner.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    private Long currentUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow().getId();
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TaskResponse>> getFiltered(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(taskService.getFiltered(projectId, assignedTo, status, date));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<List<TaskResponse>> myTasks(Authentication auth) {
        return ResponseEntity.ok(taskService.getMyTasks(currentUserId(auth)));
    }

    @GetMapping("/my-suggestions")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<List<TaskResponse>> mySuggestions(Authentication auth) {
        return ResponseEntity.ok(taskService.getMySuggestions(currentUserId(auth)));
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TaskResponse>> pendingApproval() {
        return ResponseEntity.ok(taskService.getPendingApproval());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getById(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TaskProgressResponse>> history(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getHistory(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest req,
                                               Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(req, currentUserId(auth)));
    }

    @PostMapping("/suggest")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<TaskResponse> suggest(@Valid @RequestBody SuggestTaskRequest req,
                                                Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.suggestTask(req, currentUserId(auth)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> update(@PathVariable Long id,
                                               @RequestBody UpdateTaskRequest req,
                                               Authentication auth) {
        return ResponseEntity.ok(taskService.updateTask(id, req, currentUserId(auth)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> assign(@PathVariable Long id,
                                               @Valid @RequestBody AssignTaskRequest req,
                                               Authentication auth) {
        return ResponseEntity.ok(taskService.assignTask(id, req, currentUserId(auth)));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> approve(@PathVariable Long id,
                                                @RequestBody(required = false) ApproveRejectRequest req,
                                                Authentication auth) {
        return ResponseEntity.ok(taskService.approveTask(id,
                req != null ? req : new ApproveRejectRequest(), currentUserId(auth)));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> reject(@PathVariable Long id,
                                               @RequestBody(required = false) ApproveRejectRequest req,
                                               Authentication auth) {
        return ResponseEntity.ok(taskService.rejectTask(id,
                req != null ? req : new ApproveRejectRequest(), currentUserId(auth)));
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<TaskResponse> progress(@PathVariable Long id,
                                                 @RequestBody(required = false) ProgressUpdateRequest req,
                                                 Authentication auth) {
        return ResponseEntity.ok(taskService.advanceProgress(id,
                req != null ? req : new ProgressUpdateRequest(), currentUserId(auth)));
    }

    @PostMapping("/{id}/update")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<TaskResponse> postUpdate(@PathVariable Long id,
                                                   @RequestBody(required = false) ProgressUpdateRequest req,
                                                   Authentication auth) {
        return ResponseEntity.ok(taskService.postUpdate(id,
                req != null ? req : new ProgressUpdateRequest(), currentUserId(auth)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('TEAM_MEMBER')")
    public ResponseEntity<TaskResponse> complete(@PathVariable Long id,
                                                 @RequestBody(required = false) ProgressUpdateRequest req,
                                                 Authentication auth) {
        return ResponseEntity.ok(taskService.markComplete(id,
                req != null ? req : new ProgressUpdateRequest(), currentUserId(auth)));
    }
}
