package mailer

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
)

type smtpSender struct {
	host      string
	port      int
	username  string
	password  string
	fromEmail string
	fromName  string
}

// NewSMTPSender creates an SMTP-backed Sender.
func NewSMTPSender(cfg config.SMTPConfig) Sender {
	return &smtpSender{
		host:      strings.TrimSpace(cfg.Host),
		port:      cfg.Port,
		username:  cfg.Username,
		password:  cfg.Password,
		fromEmail: strings.TrimSpace(cfg.FromEmail),
		fromName:  strings.TrimSpace(cfg.FromName),
	}
}

func (s *smtpSender) Send(ctx context.Context, msg Message) error {
	if len(msg.To) == 0 {
		return fmt.Errorf("email recipient is required")
	}
	if s.host == "" {
		return fmt.Errorf("SMTP host is not configured")
	}
	if s.port <= 0 {
		return fmt.Errorf("SMTP port is invalid")
	}
	if s.fromEmail == "" {
		return fmt.Errorf("SMTP from email is not configured")
	}

	from := mail.Address{Name: s.fromName, Address: s.fromEmail}
	raw, err := buildMIMEMessage(from.String(), msg)
	if err != nil {
		return err
	}

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	conn, err := dialer.DialContext(ctx, "tcp", addr)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("smtp client: %w", err)
	}
	defer func() {
		_ = client.Close()
	}()

	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{
			ServerName: s.host,
			MinVersion: tls.VersionTLS12,
		}
		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("smtp starttls: %w", err)
		}
	}

	if s.username != "" {
		auth := smtp.PlainAuth("", s.username, s.password, s.host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}

	if err := client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	for _, to := range msg.To {
		if err := client.Rcpt(to); err != nil {
			return fmt.Errorf("smtp rcpt %s: %w", to, err)
		}
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := writer.Write(raw); err != nil {
		_ = writer.Close()
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("smtp close data: %w", err)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf("smtp quit: %w", err)
	}
	return nil
}

func buildMIMEMessage(from string, msg Message) ([]byte, error) {
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("From: %s\r\n", from))
	builder.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(msg.To, ", ")))
	builder.WriteString(fmt.Sprintf("Subject: %s\r\n", sanitizeHeader(msg.Subject)))
	builder.WriteString("MIME-Version: 1.0\r\n")

	boundary := "7oz-boundary"
	if msg.HTML != "" {
		builder.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=%q\r\n\r\n", boundary))
		builder.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		builder.WriteString("Content-Type: text/plain; charset=UTF-8\r\n\r\n")
		builder.WriteString(msg.Text)
		builder.WriteString("\r\n")
		builder.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		builder.WriteString("Content-Type: text/html; charset=UTF-8\r\n\r\n")
		builder.WriteString(msg.HTML)
		builder.WriteString("\r\n")
		builder.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		builder.WriteString("Content-Type: text/plain; charset=UTF-8\r\n\r\n")
		builder.WriteString(msg.Text)
		builder.WriteString("\r\n")
	}

	return []byte(builder.String()), nil
}

func sanitizeHeader(value string) string {
	return strings.Map(func(r rune) rune {
		if r == '\r' || r == '\n' {
			return -1
		}
		return r
	}, value)
}
