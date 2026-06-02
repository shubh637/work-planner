package com.workplanner.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.workplanner.entity.Task;
import com.workplanner.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final Resend resend;
    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from}") String fromAddress,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.resend = new Resend(apiKey);
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    private void send(String to, String subject, String html) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(to)
                    .subject(subject)
                    .html(html)
                    .build();
            resend.emails().send(params);
            log.info("Email sent to {}: {}", to, subject);
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    public void sendInviteEmail(User user, String setPasswordUrl) {
        String html = """
                <html><body style="font-family:Arial,sans-serif;">
                <h2 style="color:#2563eb;">Welcome to Work Planner!</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Your account has been created. Click the button below to set your password and get started.</p>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Set My Password
                  </a>
                </p>
                <p style="color:#94a3b8;font-size:13px;">This link expires in 24 hours.</p>
                </body></html>
                """.formatted(user.getName(), setPasswordUrl);
        send(user.getEmail(), "Work Planner — You've been invited", html);
    }

    @Async
    public void sendTaskSuggestionEmail(Task task, User manager) {
        String taskUrl = frontendUrl + "/manager/tasks/" + task.getId();
        String html = """
                <html><body style="font-family:Arial,sans-serif;">
                <h2 style="color:#f59e0b;">New Task Suggestion</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p><strong>%s</strong> has suggested a new task for your review:</p>
                <table style="border-collapse:collapse;width:100%%;max-width:500px;">
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Title</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Project</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Due Date</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Description</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                </table>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#f59e0b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Review Task
                  </a>
                </p>
                </body></html>
                """.formatted(
                manager.getName(),
                task.getSuggestedBy().getName(),
                task.getTitle(),
                task.getProject().getName(),
                task.getDueDate() != null ? task.getDueDate().toString() : "Not set",
                task.getDescription() != null ? task.getDescription() : "-",
                taskUrl);
        send(manager.getEmail(), "Work Planner — New Task Suggestion: " + task.getTitle(), html);
    }

    @Async
    public void sendPasswordResetEmail(User user, String resetUrl) {
        String html = """
                <html><body style="font-family:Arial,sans-serif;">
                <h2 style="color:#2563eb;">Password Reset Request</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Click the button below to reset your password.</p>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Reset Password
                  </a>
                </p>
                <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour.</p>
                </body></html>
                """.formatted(user.getName(), resetUrl);
        send(user.getEmail(), "Work Planner — Reset Your Password", html);
    }

    @Async
    public void sendTaskAssignmentEmail(Task task, User assignee) {
        String taskUrl = frontendUrl + "/member/tasks/" + task.getId();
        String html = """
                <html><body style="font-family:Arial,sans-serif;">
                <h2 style="color:#2563eb;">Task Assigned to You</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>A new task has been assigned to you in <strong>Work Planner</strong>:</p>
                <table style="border-collapse:collapse;width:100%%;max-width:500px;">
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Title</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Project</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Due Date</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Description</b></td>
                      <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                </table>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    View Task
                  </a>
                </p>
                </body></html>
                """.formatted(
                assignee.getName(),
                task.getTitle(),
                task.getProject().getName(),
                task.getDueDate() != null ? task.getDueDate().toString() : "Not set",
                task.getDescription() != null ? task.getDescription() : "-",
                taskUrl);
        send(assignee.getEmail(), "Work Planner — Task Assigned: " + task.getTitle(), html);
    }

    @Async
    public void sendTaskApprovalEmail(Task task, User recipient) {
        String html = """
                <html><body style="font-family:Arial,sans-serif;">
                <h2 style="color:#16a34a;">Your Task Suggestion Was Approved!</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Your suggested task <strong>"%s"</strong> has been approved by the manager.</p>
                <p><b>Due date:</b> %s</p>
                <p>You can now start working on it. Log in to Work Planner for details.</p>
                </body></html>
                """.formatted(
                recipient.getName(),
                task.getTitle(),
                task.getDueDate() != null ? task.getDueDate().toString() : "Not set");
        send(recipient.getEmail(), "Work Planner — Task Approved: " + task.getTitle(), html);
    }
}
