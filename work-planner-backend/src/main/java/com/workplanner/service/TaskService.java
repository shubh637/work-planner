package com.workplanner.service;

import com.workplanner.dto.request.*;
import com.workplanner.dto.response.TaskProgressResponse;
import com.workplanner.dto.response.TaskResponse;
import com.workplanner.entity.*;
import com.workplanner.entity.Task.TaskStatus;
import com.workplanner.exception.*;
import com.workplanner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskProgressRepository taskProgressRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<TaskResponse> getFiltered(Long projectId, Long assignedTo, String status, LocalDate date) {
        TaskStatus taskStatus = (status != null && !status.isBlank()) ? TaskStatus.valueOf(status.toUpperCase()) : null;
        return taskRepository.findFiltered(projectId, assignedTo, taskStatus, date)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Long userId) {
        List<TaskStatus> visibleStatuses = List.of(
                TaskStatus.APPROVED, TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.CLOSED);
        return taskRepository.findByAssignedToIdAndStatusIn(userId, visibleStatuses)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMySuggestions(Long userId) {
        return taskRepository.findBySuggestedById(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getPendingApproval() {
        return taskRepository.findByStatus(TaskStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<TaskProgressResponse> getHistory(Long taskId) {
        return taskProgressRepository.findByTaskIdOrderByChangedAtAsc(taskId)
                .stream().map(this::toProgressResponse).toList();
    }

    @Transactional
    public TaskResponse createTask(CreateTaskRequest req, Long managerId) {
        Project project = findProject(req.getProjectId());
        if (project.getStatus() == Project.ProjectStatus.DONE) {
            throw new InvalidStatusTransitionException("Cannot add tasks to a completed project");
        }
        User manager = findUser(managerId);

        Task.TaskBuilder builder = Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .project(project)
                .createdBy(manager)
                .dueDate(req.getDueDate());

        if (req.getAssignedToUserId() != null) {
            User assignee = findUser(req.getAssignedToUserId());
            builder.assignedTo(assignee).status(TaskStatus.OPEN);
            Task saved = taskRepository.save(builder.build());
            recordProgress(saved, managerId, null, TaskStatus.OPEN, "Task created and assigned");
            emailService.sendTaskAssignmentEmail(saved, assignee);
            return toResponse(saved);
        } else {
            builder.status(TaskStatus.OPEN);
            Task saved = taskRepository.save(builder.build());
            recordProgress(saved, managerId, null, TaskStatus.OPEN, "Task created");
            return toResponse(saved);
        }
    }

    @Transactional
    public TaskResponse suggestTask(SuggestTaskRequest req, Long memberId) {
        Project project = findProject(req.getProjectId());
        if (project.getStatus() == Project.ProjectStatus.DONE) {
            throw new InvalidStatusTransitionException("Cannot suggest tasks for a completed project");
        }
        User member = findUser(memberId);

        Task task = Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .project(project)
                .createdBy(member)
                .suggestedBy(member)
                .status(TaskStatus.PENDING)
                .dueDate(req.getDueDate())
                .build();

        Task saved = taskRepository.save(task);
        recordProgress(saved, memberId, null, TaskStatus.PENDING, "Task suggested by member");
        String suggestedByName = member.getName();
        String projectName = project.getName();
        userRepository.findByRoleAndActiveTrue(User.Role.MANAGER)
                .forEach(manager -> emailService.sendTaskSuggestionEmail(saved, manager, suggestedByName, projectName));
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest req, Long managerId) {
        Task task = findOrThrow(id);
        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            TaskStatus newStatus = TaskStatus.valueOf(req.getStatus().toUpperCase());
            TaskStatus oldStatus = task.getStatus();
            if (newStatus != oldStatus) {
                task.setStatus(newStatus);
                Task saved = taskRepository.save(task);
                recordProgress(saved, managerId, oldStatus, newStatus,
                        req.getStatusNotes() != null ? req.getStatusNotes() : "Status updated by manager");
                return toResponse(saved);
            }
        }
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse editSuggestion(Long id, UpdateTaskRequest req, Long memberId) {
        Task task = findOrThrow(id);
        if (!task.getSuggestedBy().getId().equals(memberId)) {
            throw new UnauthorizedActionException("You can only edit your own suggestions");
        }
        if (task.getStatus() != TaskStatus.PENDING) {
            throw new InvalidStatusTransitionException("Can only edit suggestions that are still pending");
        }
        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long id) {
        findOrThrow(id);
        taskRepository.deleteById(id);
    }

    @Transactional
    public TaskResponse assignTask(Long taskId, AssignTaskRequest req, Long managerId) {
        Task task = findOrThrow(taskId);
        if (task.getProject().getStatus() == Project.ProjectStatus.DONE) {
            throw new InvalidStatusTransitionException("Cannot assign tasks in a completed project");
        }
        User assignee = findUser(req.getAssignedToUserId());

        if (assignee.getRole() != User.Role.TEAM_MEMBER) {
            throw new UnauthorizedActionException("Can only assign tasks to TEAM_MEMBER users");
        }

        TaskStatus old = task.getStatus();
        task.setAssignedTo(assignee);
        task.setStatus(TaskStatus.OPEN);
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());

        Task saved = taskRepository.save(task);
        recordProgress(saved, managerId, old, TaskStatus.OPEN, "Assigned to " + assignee.getName());
        emailService.sendTaskAssignmentEmail(saved, assignee);
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse approveTask(Long taskId, ApproveRejectRequest req, Long managerId) {
        Task task = findOrThrow(taskId);
        if (task.getStatus() != TaskStatus.PENDING) {
            throw new InvalidStatusTransitionException("Cannot approve task in status: " + task.getStatus());
        }
        task.setStatus(TaskStatus.APPROVED);
        Task saved = taskRepository.save(task);
        recordProgress(saved, managerId, TaskStatus.PENDING, TaskStatus.APPROVED,
                req.getNotes() != null ? req.getNotes() : "Approved by manager");

        User recipient = task.getSuggestedBy() != null ? task.getSuggestedBy() : task.getAssignedTo();
        if (recipient != null) emailService.sendTaskApprovalEmail(saved, recipient);

        return toResponse(saved);
    }

    @Transactional
    public TaskResponse rejectTask(Long taskId, ApproveRejectRequest req, Long managerId) {
        Task task = findOrThrow(taskId);
        if (task.getStatus() != TaskStatus.PENDING) {
            throw new InvalidStatusTransitionException("Cannot reject task in status: " + task.getStatus());
        }
        task.setStatus(TaskStatus.REJECTED);
        Task saved = taskRepository.save(task);
        recordProgress(saved, managerId, TaskStatus.PENDING, TaskStatus.REJECTED,
                req.getNotes() != null ? req.getNotes() : "Rejected by manager");
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse postUpdate(Long taskId, ProgressUpdateRequest req, Long memberId) {
        Task task = findOrThrow(taskId);
        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(memberId)) {
            throw new UnauthorizedActionException("You are not assigned to this task");
        }
        recordProgress(task, memberId, task.getStatus(), task.getStatus(),
                req.getNotes() != null ? req.getNotes() : "Update posted");
        return toResponse(task);
    }

    @Transactional
    public TaskResponse markComplete(Long taskId, ProgressUpdateRequest req, Long memberId) {
        Task task = findOrThrow(taskId);
        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(memberId)) {
            throw new UnauthorizedActionException("You are not assigned to this task");
        }
        if (task.getStatus() == TaskStatus.CLOSED) {
            throw new InvalidStatusTransitionException("Task is already completed");
        }
        TaskStatus prev = task.getStatus();
        task.setStatus(TaskStatus.CLOSED);
        Task saved = taskRepository.save(task);
        recordProgress(saved, memberId, prev, TaskStatus.CLOSED,
                req.getNotes() != null ? req.getNotes() : "Marked as complete");
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse advanceProgress(Long taskId, ProgressUpdateRequest req, Long memberId) {
        Task task = findOrThrow(taskId);

        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(memberId)) {
            throw new UnauthorizedActionException("You are not assigned to this task");
        }

        TaskStatus next = switch (task.getStatus()) {
            case OPEN        -> TaskStatus.IN_PROGRESS;
            case IN_PROGRESS -> TaskStatus.CLOSED;
            default -> throw new InvalidStatusTransitionException(
                    "Cannot advance from status: " + task.getStatus());
        };

        TaskStatus prev = task.getStatus();
        task.setStatus(next);
        Task saved = taskRepository.save(task);
        recordProgress(saved, memberId, prev, next, req.getNotes());
        return toResponse(saved);
    }

    private void recordProgress(Task task, Long changedById,
                                TaskStatus oldStatus, TaskStatus newStatus, String notes) {
        User changedBy = userRepository.getReferenceById(changedById);
        TaskProgress progress = TaskProgress.builder()
                .task(task)
                .changedBy(changedBy)
                .oldStatus(oldStatus != null ? oldStatus.name() : "NONE")
                .newStatus(newStatus.name())
                .notes(notes)
                .build();
        taskProgressRepository.save(progress);
    }

    private Task findOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    public TaskResponse toResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .projectId(t.getProject().getId())
                .projectName(t.getProject().getName())
                .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getName() : null)
                .createdById(t.getCreatedBy().getId())
                .createdByName(t.getCreatedBy().getName())
                .suggestedById(t.getSuggestedBy() != null ? t.getSuggestedBy().getId() : null)
                .suggestedByName(t.getSuggestedBy() != null ? t.getSuggestedBy().getName() : null)
                .status(t.getStatus().name())
                .dueDate(t.getDueDate())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TaskProgressResponse toProgressResponse(TaskProgress tp) {
        return TaskProgressResponse.builder()
                .id(tp.getId())
                .taskId(tp.getTask().getId())
                .taskTitle(tp.getTask().getTitle())
                .changedById(tp.getChangedBy().getId())
                .changedByName(tp.getChangedBy().getName())
                .oldStatus(tp.getOldStatus())
                .newStatus(tp.getNewStatus())
                .notes(tp.getNotes())
                .changedAt(tp.getChangedAt())
                .build();
    }
}
