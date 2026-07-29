package health_test

import (
	"context"
	"errors"
	"testing"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
)

type stubChecker struct {
	err error
}

func (s stubChecker) Ping(context.Context) error {
	return s.err
}

func TestLiveAlwaysHealthy(t *testing.T) {
	service := health.NewService("7oz-test", nil, nil)
	report := service.Live()

	if report.Status != "healthy" {
		t.Fatalf("expected healthy, got %s", report.Status)
	}
}

func TestReadyReportsUnhealthyDependency(t *testing.T) {
	service := health.NewService(
		"7oz-test",
		stubChecker{err: errors.New("down")},
		stubChecker{err: nil},
	)

	report := service.Ready(context.Background())
	if report.Status != "unhealthy" {
		t.Fatalf("expected unhealthy, got %s", report.Status)
	}

	if report.Dependencies["postgres"] != health.DependencyUnhealthy {
		t.Fatalf("expected postgres unhealthy, got %s", report.Dependencies["postgres"])
	}

	if report.Dependencies["redis"] != health.DependencyHealthy {
		t.Fatalf("expected redis healthy, got %s", report.Dependencies["redis"])
	}
}

func TestReadySkipsMissingDependencies(t *testing.T) {
	service := health.NewService("7oz-test", nil, nil)
	report := service.Ready(context.Background())

	if report.Status != "healthy" {
		t.Fatalf("expected healthy when dependencies skipped, got %s", report.Status)
	}

	if report.Dependencies["postgres"] != health.DependencySkipped {
		t.Fatalf("expected postgres skipped")
	}
}
