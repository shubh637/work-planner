package com.workplanner.service;

import com.workplanner.entity.Task;
import com.workplanner.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendInviteEmail(User user, String setPasswordUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject("Work Planner — You've been invited");

            String body = """
                    <html><body style="font-family:Arial,sans-serif;">
                    <h2 style="color:#2563eb;">Welcome to Work Planner!</h2>
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Your account has been created. Click the button below to set your password and get started.</p>
                    <p style="margin:24px 0;">
                      <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                        Set My Password
                      </a>
                    </p>
                    <p style="color:#94a3b8;font-size:13px;">This link expires in 24 hours. If you did not expect this email, please ignore it.</p>
                    </body></html>
                    """.formatted(user.getName(), setPasswordUrl);

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Invite email sent to {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send invite email to {}: {}", user.getEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending invite email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Async
    public void sendTaskSuggestionEmail(Task task, User manager) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(manager.getEmail());
            helper.setSubject("Work Planner — New Task Suggestion: " + task.getTitle());

            String taskUrl = frontendUrl + "/manager/tasks/" + task.getId();
            String body = """
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
                    taskUrl
            );

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Task suggestion email sent to manager {} for task id={}", manager.getEmail(), task.getId());
        } catch (MessagingException e) {
            log.error("Failed to send suggestion email to {}: {}", manager.getEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending suggestion email to {}: {}", manager.getEmail(), e.getMessage(), e);
        }
    }

    @Async
    public void sendPasswordResetEmail(User user, String resetUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject("Work Planner — Reset Your Password");

            String body = """
                    <html><body style="font-family:Arial,sans-serif;">
                    <h2 style="color:#2563eb;">Password Reset Request</h2>
                    <p>Hi <strong>%s</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to set a new one.</p>
                    <p style="margin:24px 0;">
                      <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                        Reset Password
                      </a>
                    </p>
                    <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
                    </body></html>
                    """.formatted(user.getName(), resetUrl);

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending password reset email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Async
    public void sendTaskAssignmentEmail(Task task, User assignee) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(assignee.getEmail());
            helper.setSubject("Work Planner — Task Assigned: " + task.getTitle());

            String taskUrl = frontendUrl + "/member/tasks/" + task.getId();
            String body = """
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
                    taskUrl
            );

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Task assignment email sent to {} for task id={}", assignee.getEmail(), task.getId());
        } catch (MessagingException e) {
            log.error("Failed to send assignment email to {}: {}", assignee.getEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending assignment email to {}: {}", assignee.getEmail(), e.getMessage(), e);
        }
    }

    @Async
    public void sendTaskApprovalEmail(Task task, User recipient) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient.getEmail());
            helper.setSubject("Work Planner — Task Approved: " + task.getTitle());

            String body = """
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
                    task.getDueDate() != null ? task.getDueDate().toString() : "Not set"
            );

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Approval email sent to {} for task id={}", recipient.getEmail(), task.getId());
        } catch (MessagingException e) {
            log.error("Failed to send approval email: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending approval email: {}", e.getMessage(), e);
        }
    }
}
