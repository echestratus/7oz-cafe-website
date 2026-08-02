package mailer

import (
	"context"

	"go.uber.org/zap"
)

type logSender struct {
	log *zap.Logger
}

// NewLogSender writes email payloads to the application logger (development fallback).
func NewLogSender(log *zap.Logger) Sender {
	if log == nil {
		log = zap.NewNop()
	}
	return &logSender{log: log}
}

func (s *logSender) Send(_ context.Context, msg Message) error {
	s.log.Info("email (log sender)",
		zap.Strings("to", msg.To),
		zap.String("subject", msg.Subject),
		zap.String("text", msg.Text),
	)
	return nil
}
