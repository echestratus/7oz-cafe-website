package reservation

import (
	"testing"
	"time"
)

func TestClosingAtSameDay(t *testing.T) {
	loc := time.FixedZone("UZT", 5*3600)
	date := time.Date(2026, 7, 31, 0, 0, 0, 0, loc)
	openClock, _ := parseClock("08:00")
	closeClock, _ := parseClock("23:00")

	got := closingAt(date, openClock, closeClock, loc)
	want := time.Date(2026, 7, 31, 23, 0, 0, 0, loc)
	if !got.Equal(want) {
		t.Fatalf("closingAt same-day = %v, want %v", got, want)
	}
}

func TestClosingAtOvernightMidnight(t *testing.T) {
	loc := time.FixedZone("UZT", 5*3600)
	date := time.Date(2026, 7, 31, 0, 0, 0, 0, loc)
	openClock, _ := parseClock("08:00")
	closeClock, _ := parseClock("00:00")

	got := closingAt(date, openClock, closeClock, loc)
	want := time.Date(2026, 8, 1, 0, 0, 0, 0, loc)
	if !got.Equal(want) {
		t.Fatalf("closingAt overnight = %v, want %v", got, want)
	}
}
