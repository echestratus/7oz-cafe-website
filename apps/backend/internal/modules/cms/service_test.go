package cms

import "testing"

func TestDecodeObjectEmpty(t *testing.T) {
	object, err := decodeObject(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(object) != 0 {
		t.Fatalf("expected empty object, got %#v", object)
	}
}

func TestDecodeObjectValid(t *testing.T) {
	object, err := decodeObject([]byte(`{"title":"7Oz"}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if object["title"] != "7Oz" {
		t.Fatalf("unexpected title: %#v", object["title"])
	}
}
