package mailer

import (
	"context"
	"fmt"
	"strings"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"go.uber.org/zap"
)

// Message is a single outbound email.
type Message struct {
	To      []string
	Subject string
	Text    string
	HTML    string
	ReplyTo string
}

// Sender delivers email messages.
type Sender interface {
	Send(ctx context.Context, msg Message) error
}

// ReservationConfirmation carries booking details for confirmation emails.
type ReservationConfirmation struct {
	GuestFullName     string
	GuestEmail        string
	ReservationNumber string
	Date              string
	Time              string
	GuestCount        int32
	Status            string
}

// ContactInquiry carries a public contact form submission for staff notification.
type ContactInquiry struct {
	FullName string
	Email    string
	Phone    string
	Message  string
}

// Notifier sends product emails (verification, reset, reservation, contact).
type Notifier struct {
	sender         Sender
	fromEmail      string
	fromName       string
	websiteURL     string
	contactToEmail string
	log            *zap.Logger
}

// NewFromConfig builds a Sender + Notifier from application config.
// Development without SMTP_HOST uses a log sender. Non-development requires SMTP.
func NewFromConfig(cfg *config.Config, log *zap.Logger) (*Notifier, error) {
	if log == nil {
		log = zap.NewNop()
	}

	var sender Sender
	host := strings.TrimSpace(cfg.SMTP.Host)
	if host == "" {
		if !cfg.IsDevelopment() {
			return nil, fmt.Errorf("SMTP_HOST is required outside development")
		}
		log.Warn("SMTP_HOST empty; outbound email will be logged only")
		sender = NewLogSender(log)
	} else {
		sender = NewSMTPSender(cfg.SMTP)
	}

	websiteURL := strings.TrimRight(strings.TrimSpace(cfg.WebsiteURL), "/")
	if websiteURL == "" {
		websiteURL = "http://localhost:3000"
	}

	fromEmail := strings.TrimSpace(cfg.SMTP.FromEmail)
	if fromEmail == "" {
		fromEmail = "noreply@7oz.local"
	}

	fromName := strings.TrimSpace(cfg.SMTP.FromName)
	if fromName == "" {
		fromName = "7Oz Espresso Cafe"
	}

	contactTo := strings.TrimSpace(cfg.ContactToEmail)
	if contactTo == "" {
		contactTo = fromEmail
	}

	return &Notifier{
		sender:         sender,
		fromEmail:      fromEmail,
		fromName:       fromName,
		websiteURL:     websiteURL,
		contactToEmail: contactTo,
		log:            log,
	}, nil
}

func (n *Notifier) SendVerification(ctx context.Context, toEmail, fullName, rawToken string) error {
	link := fmt.Sprintf("%s/verify-email?token=%s", n.websiteURL, rawToken)
	subject := "Verify your 7Oz account"
	text := fmt.Sprintf(
		"Hello %s,\n\nPlease verify your email to activate your 7Oz account:\n%s\n\nThis link expires in 24 hours.\n\n— 7Oz Espresso Cafe\n",
		displayName(fullName),
		link,
	)
	html := fmt.Sprintf(
		`<p>Hello %s,</p><p>Please verify your email to activate your 7Oz account:</p><p><a href="%s">Verify email</a></p><p>This link expires in 24 hours.</p><p>— 7Oz Espresso Cafe</p>`,
		escapeHTML(displayName(fullName)),
		escapeHTML(link),
	)
	return n.send(ctx, toEmail, subject, text, html, "")
}

func (n *Notifier) SendPasswordReset(ctx context.Context, toEmail, fullName, rawToken string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", n.websiteURL, rawToken)
	subject := "Reset your 7Oz password"
	text := fmt.Sprintf(
		"Hello %s,\n\nReset your 7Oz password using this link:\n%s\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.\n\n— 7Oz Espresso Cafe\n",
		displayName(fullName),
		link,
	)
	html := fmt.Sprintf(
		`<p>Hello %s,</p><p>Reset your 7Oz password using this link:</p><p><a href="%s">Reset password</a></p><p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p><p>— 7Oz Espresso Cafe</p>`,
		escapeHTML(displayName(fullName)),
		escapeHTML(link),
	)
	return n.send(ctx, toEmail, subject, text, html, "")
}

// SendReservationConfirmation notifies the guest that a booking request was received (pending).
func (n *Notifier) SendReservationConfirmation(ctx context.Context, reservation ReservationConfirmation) error {
	to := strings.TrimSpace(reservation.GuestEmail)
	if to == "" {
		return nil
	}

	subject := fmt.Sprintf("Reservation request %s received", reservation.ReservationNumber)
	text := fmt.Sprintf(
		"Hello %s,\n\nWe received your table request at 7Oz Espresso Cafe.\n\nReservation: %s\nDate: %s\nTime: %s\nGuests: %d\nStatus: %s\n\nOur team will confirm shortly.\n\n— 7Oz Espresso Cafe\n",
		displayName(reservation.GuestFullName),
		reservation.ReservationNumber,
		reservation.Date,
		reservation.Time,
		reservation.GuestCount,
		reservation.Status,
	)
	html := fmt.Sprintf(
		`<p>Hello %s,</p><p>We received your table request at 7Oz Espresso Cafe.</p><ul><li><strong>Reservation:</strong> %s</li><li><strong>Date:</strong> %s</li><li><strong>Time:</strong> %s</li><li><strong>Guests:</strong> %d</li><li><strong>Status:</strong> %s</li></ul><p>Our team will confirm shortly.</p><p>— 7Oz Espresso Cafe</p>`,
		escapeHTML(displayName(reservation.GuestFullName)),
		escapeHTML(reservation.ReservationNumber),
		escapeHTML(reservation.Date),
		escapeHTML(reservation.Time),
		reservation.GuestCount,
		escapeHTML(reservation.Status),
	)
	return n.send(ctx, to, subject, text, html, "")
}

// SendReservationConfirmed notifies the guest that staff confirmed their reservation.
func (n *Notifier) SendReservationConfirmed(ctx context.Context, reservation ReservationConfirmation) error {
	to := strings.TrimSpace(reservation.GuestEmail)
	if to == "" {
		return nil
	}

	subject := fmt.Sprintf("Reservation %s confirmed", reservation.ReservationNumber)
	text := fmt.Sprintf(
		"Hello %s,\n\nYour table reservation at 7Oz Espresso Cafe is confirmed.\n\nReservation: %s\nDate: %s\nTime: %s\nGuests: %d\nStatus: confirmed\n\nWe look forward to welcoming you.\n\n— 7Oz Espresso Cafe\n",
		displayName(reservation.GuestFullName),
		reservation.ReservationNumber,
		reservation.Date,
		reservation.Time,
		reservation.GuestCount,
	)
	html := fmt.Sprintf(
		`<p>Hello %s,</p><p>Your table reservation at 7Oz Espresso Cafe is confirmed.</p><ul><li><strong>Reservation:</strong> %s</li><li><strong>Date:</strong> %s</li><li><strong>Time:</strong> %s</li><li><strong>Guests:</strong> %d</li><li><strong>Status:</strong> confirmed</li></ul><p>We look forward to welcoming you.</p><p>— 7Oz Espresso Cafe</p>`,
		escapeHTML(displayName(reservation.GuestFullName)),
		escapeHTML(reservation.ReservationNumber),
		escapeHTML(reservation.Date),
		escapeHTML(reservation.Time),
		reservation.GuestCount,
	)
	return n.send(ctx, to, subject, text, html, "")
}

func (n *Notifier) SendContactMessage(ctx context.Context, inquiry ContactInquiry) error {
	to := strings.TrimSpace(n.contactToEmail)
	if to == "" {
		return fmt.Errorf("contact recipient email is not configured")
	}

	subject := fmt.Sprintf("New contact message from %s", displayName(inquiry.FullName))
	phoneLine := strings.TrimSpace(inquiry.Phone)
	if phoneLine == "" {
		phoneLine = "—"
	}
	text := fmt.Sprintf(
		"New website contact message\n\nName: %s\nEmail: %s\nPhone: %s\n\nMessage:\n%s\n",
		displayName(inquiry.FullName),
		strings.TrimSpace(inquiry.Email),
		phoneLine,
		strings.TrimSpace(inquiry.Message),
	)
	html := fmt.Sprintf(
		`<p>New website contact message</p><ul><li><strong>Name:</strong> %s</li><li><strong>Email:</strong> %s</li><li><strong>Phone:</strong> %s</li></ul><p><strong>Message</strong></p><p>%s</p>`,
		escapeHTML(displayName(inquiry.FullName)),
		escapeHTML(strings.TrimSpace(inquiry.Email)),
		escapeHTML(phoneLine),
		escapeHTML(strings.TrimSpace(inquiry.Message)),
	)
	return n.send(ctx, to, subject, text, html, strings.TrimSpace(inquiry.Email))
}

func (n *Notifier) send(ctx context.Context, to, subject, text, html, replyTo string) error {
	msg := Message{
		To:      []string{to},
		Subject: subject,
		Text:    text,
		HTML:    html,
		ReplyTo: replyTo,
	}
	if err := n.sender.Send(ctx, msg); err != nil {
		n.log.Error("failed to send email",
			zap.String("to", to),
			zap.String("subject", subject),
			zap.Error(err),
		)
		return err
	}
	n.log.Info("email sent", zap.String("to", to), zap.String("subject", subject))
	return nil
}

func displayName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "there"
	}
	return name
}

func escapeHTML(value string) string {
	replacer := strings.NewReplacer(
		`&`, "&amp;",
		`<`, "&lt;",
		`>`, "&gt;",
		`"`, "&quot;",
		`'`, "&#39;",
	)
	return replacer.Replace(value)
}
