package health

import (
	"context"
	"time"
)

type DependencyStatus string

const (
	DependencyHealthy   DependencyStatus = "healthy"
	DependencyUnhealthy DependencyStatus = "unhealthy"
	DependencySkipped   DependencyStatus = "skipped"
)

type Checker interface {
	Ping(ctx context.Context) error
}

type Service struct {
	serviceName string
	postgres    Checker
	redis       Checker
}

type Report struct {
	Status       string                       `json:"status"`
	Service      string                       `json:"service"`
	Timestamp    string                       `json:"timestamp"`
	Dependencies map[string]DependencyStatus `json:"dependencies"`
}

func NewService(serviceName string, postgres Checker, redis Checker) *Service {
	return &Service{
		serviceName: serviceName,
		postgres:    postgres,
		redis:       redis,
	}
}

func (s *Service) Live() Report {
	return Report{
		Status:    "healthy",
		Service:   s.serviceName,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Dependencies: map[string]DependencyStatus{
			"api": DependencyHealthy,
		},
	}
}

func (s *Service) Ready(ctx context.Context) Report {
	dependencies := map[string]DependencyStatus{
		"postgres": checkDependency(ctx, s.postgres),
		"redis":    checkDependency(ctx, s.redis),
	}

	status := "healthy"
	for _, dependency := range dependencies {
		if dependency == DependencyUnhealthy {
			status = "unhealthy"
			break
		}
	}

	return Report{
		Status:       status,
		Service:      s.serviceName,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
		Dependencies: dependencies,
	}
}

func checkDependency(ctx context.Context, checker Checker) DependencyStatus {
	if checker == nil {
		return DependencySkipped
	}

	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := checker.Ping(pingCtx); err != nil {
		return DependencyUnhealthy
	}

	return DependencyHealthy
}
