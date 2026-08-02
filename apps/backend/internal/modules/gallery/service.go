package gallery

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var allowedCategories = map[string]struct{}{
	"atmosphere": {},
	"interior":   {},
	"exterior":   {},
	"coffee":     {},
	"food":       {},
	"events":     {},
}

type Service struct {
	db *database.Postgres
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

type ItemDTO struct {
	ID           string  `json:"id"`
	ImageURL     string  `json:"imageUrl"`
	MediaID      *string `json:"mediaId,omitempty"`
	LocationSlug string  `json:"locationSlug"`
	Category     string  `json:"category"`
	AltText      string  `json:"altText"`
	Caption      string  `json:"caption"`
	SortOrder    int32   `json:"sortOrder"`
	IsVisible    bool    `json:"isVisible"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

type WriteInput struct {
	ImageURL     string
	MediaID      *uuid.UUID
	LocationSlug string
	Category     string
	AltText      string
	Caption      string
	SortOrder    int32
	IsVisible    bool
}

func (s *Service) requireDB() error {
	if s == nil || s.db == nil || s.db.Queries == nil {
		return apperr.Internal("Database unavailable.")
	}
	return nil
}

func (s *Service) ListPublic(ctx context.Context, locationSlug string) ([]ItemDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	locationSlug = strings.TrimSpace(locationSlug)
	if locationSlug == "" {
		return nil, apperr.Validation("Location slug is required.", response.FieldError{
			Field: "locationSlug", Message: "is required",
		})
	}

	rows, err := s.db.Queries.ListPublicGalleryItems(ctx, locationSlug)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Unable to list gallery items."), err)
	}
	items := make([]ItemDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toDTO(row))
	}
	return items, nil
}

func (s *Service) ListAdmin(ctx context.Context, locationSlug string, page, limit int) ([]ItemDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	page, limit = normalizePagination(page, limit)
	offset := int32((page - 1) * limit)

	var slugPtr *string
	if trimmed := strings.TrimSpace(locationSlug); trimmed != "" {
		slugPtr = &trimmed
	}

	total, err := s.db.Queries.CountAdminGalleryItems(ctx, slugPtr)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list gallery items."), err)
	}

	rows, err := s.db.Queries.ListAdminGalleryItems(ctx, sqlcdb.ListAdminGalleryItemsParams{
		Limit:        int32(limit),
		Offset:       offset,
		LocationSlug: slugPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list gallery items."), err)
	}

	items := make([]ItemDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toDTO(row))
	}
	return items, total, nil
}

func (s *Service) GetAdmin(ctx context.Context, id uuid.UUID) (*ItemDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	row, err := s.db.Queries.GetGalleryItemByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Gallery item not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Unable to load gallery item."), err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Create(ctx context.Context, input WriteInput) (*ItemDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	normalized, err := normalizeWrite(input)
	if err != nil {
		return nil, err
	}

	row, err := s.db.Queries.CreateGalleryItem(ctx, sqlcdb.CreateGalleryItemParams{
		ID:           uuid.New(),
		ImageUrl:     normalized.ImageURL,
		MediaID:      normalized.MediaID,
		LocationSlug: normalized.LocationSlug,
		Category:     normalized.Category,
		AltText:      normalized.AltText,
		Caption:      normalized.Caption,
		SortOrder:    normalized.SortOrder,
		IsVisible:    normalized.IsVisible,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Unable to create gallery item."), err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, input WriteInput) (*ItemDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if _, err := s.GetAdmin(ctx, id); err != nil {
		return nil, err
	}
	normalized, err := normalizeWrite(input)
	if err != nil {
		return nil, err
	}

	row, err := s.db.Queries.UpdateGalleryItem(ctx, sqlcdb.UpdateGalleryItemParams{
		ID:           id,
		ImageUrl:     normalized.ImageURL,
		MediaID:      normalized.MediaID,
		LocationSlug: normalized.LocationSlug,
		Category:     normalized.Category,
		AltText:      normalized.AltText,
		Caption:      normalized.Caption,
		SortOrder:    normalized.SortOrder,
		IsVisible:    normalized.IsVisible,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Gallery item not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Unable to update gallery item."), err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	if _, err := s.GetAdmin(ctx, id); err != nil {
		return err
	}
	if err := s.db.Queries.SoftDeleteGalleryItem(ctx, id); err != nil {
		return apperr.Wrap(apperr.Internal("Unable to delete gallery item."), err)
	}
	return nil
}

func normalizeWrite(input WriteInput) (WriteInput, error) {
	imageURL := strings.TrimSpace(input.ImageURL)
	if imageURL == "" {
		return WriteInput{}, apperr.Validation("Image URL is required.", response.FieldError{
			Field: "imageUrl", Message: "is required",
		})
	}
	location := strings.TrimSpace(strings.ToLower(input.LocationSlug))
	if location == "" {
		return WriteInput{}, apperr.Validation("Location slug is required.", response.FieldError{
			Field: "locationSlug", Message: "is required",
		})
	}
	category := strings.TrimSpace(strings.ToLower(input.Category))
	if category == "" {
		category = "atmosphere"
	}
	if _, ok := allowedCategories[category]; !ok {
		return WriteInput{}, apperr.Validation("Invalid category.", response.FieldError{
			Field: "category", Message: "must be atmosphere, interior, exterior, coffee, food, or events",
		})
	}

	return WriteInput{
		ImageURL:     imageURL,
		MediaID:      input.MediaID,
		LocationSlug: location,
		Category:     category,
		AltText:      strings.TrimSpace(input.AltText),
		Caption:      strings.TrimSpace(input.Caption),
		SortOrder:    input.SortOrder,
		IsVisible:    input.IsVisible,
	}, nil
}

func toDTO(row sqlcdb.GalleryItem) ItemDTO {
	dto := ItemDTO{
		ID:           row.ID.String(),
		ImageURL:     row.ImageUrl,
		LocationSlug: row.LocationSlug,
		Category:     row.Category,
		AltText:      row.AltText,
		Caption:      row.Caption,
		SortOrder:    row.SortOrder,
		IsVisible:    row.IsVisible,
		CreatedAt:    row.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:    row.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if row.MediaID != nil {
		id := row.MediaID.String()
		dto.MediaID = &id
	}
	return dto
}

func normalizePagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	return page, limit
}
