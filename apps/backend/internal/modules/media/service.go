package media

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const maxUploadBytes = 10 * 1024 * 1024

var allowedMimeTypes = map[string]struct{}{
	"image/jpeg": {},
	"image/png":  {},
	"image/webp": {},
	"image/gif":  {},
	"video/mp4":  {},
	"application/pdf": {},
}

type Service struct {
	cfg *config.Config
	db  *database.Postgres
}

type AssetDTO struct {
	ID         string  `json:"id"`
	FolderID   *string `json:"folderId,omitempty"`
	FileName   string  `json:"fileName"`
	StorageKey string  `json:"storageKey"`
	URL        string  `json:"url"`
	MimeType   string  `json:"mimeType"`
	SizeBytes  int64   `json:"sizeBytes"`
	AltText    string  `json:"altText"`
	UploadedBy *string `json:"uploadedBy,omitempty"`
	CreatedAt  string  `json:"createdAt"`
}

type ListResult struct {
	Items []AssetDTO `json:"items"`
	Total int64      `json:"total"`
	Page  int        `json:"page"`
	Limit int        `json:"limit"`
}

func NewService(cfg *config.Config, db *database.Postgres) *Service {
	return &Service{cfg: cfg, db: db}
}

func (s *Service) List(ctx context.Context, page, limit int) (*ListResult, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	total, err := s.db.Queries.CountMediaAssets(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to count media assets."), err)
	}

	assets, err := s.db.Queries.ListMediaAssets(ctx, sqlcdb.ListMediaAssetsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list media assets."), err)
	}

	items := make([]AssetDTO, 0, len(assets))
	for _, asset := range assets {
		items = append(items, toAssetDTO(asset))
	}

	return &ListResult{
		Items: items,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *Service) Upload(
	ctx context.Context,
	fileName string,
	mimeType string,
	size int64,
	reader io.Reader,
	altText string,
	uploadedBy uuid.UUID,
) (*AssetDTO, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	fileName = filepath.Base(strings.TrimSpace(fileName))
	if fileName == "" || fileName == "." || fileName == string(filepath.Separator) {
		return nil, apperr.Validation("File name is required.", response.FieldError{
			Field:   "file",
			Message: "is required",
		})
	}

	mimeType = strings.TrimSpace(strings.ToLower(mimeType))
	if _, ok := allowedMimeTypes[mimeType]; !ok {
		return nil, apperr.Validation("Unsupported media type.", response.FieldError{
			Field:   "file",
			Message: "mime type is not allowed",
		})
	}

	if size <= 0 || size > maxUploadBytes {
		return nil, apperr.Validation("Invalid file size.", response.FieldError{
			Field:   "file",
			Message: fmt.Sprintf("must be between 1 byte and %d bytes", maxUploadBytes),
		})
	}

	assetID := uuid.New()
	ext := filepath.Ext(fileName)
	storageKey := fmt.Sprintf("%s%s", assetID.String(), ext)

	root := s.cfg.Storage.LocalPath
	if root == "" {
		root = "./storage"
	}
	mediaDir := filepath.Join(root, "media")
	if err := os.MkdirAll(mediaDir, 0o755); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to prepare media storage."), err)
	}

	destination := filepath.Join(mediaDir, storageKey)
	file, err := os.Create(destination)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create media file."), err)
	}
	defer file.Close()

	written, err := io.Copy(file, io.LimitReader(reader, maxUploadBytes+1))
	if err != nil {
		_ = os.Remove(destination)
		return nil, apperr.Wrap(apperr.Internal("Failed to store media file."), err)
	}
	if written > maxUploadBytes {
		_ = os.Remove(destination)
		return nil, apperr.Validation("File exceeds maximum allowed size.", response.FieldError{
			Field:   "file",
			Message: "too large",
		})
	}

	asset, err := s.db.Queries.CreateMediaAsset(ctx, sqlcdb.CreateMediaAssetParams{
		ID:         assetID,
		FolderID:   nil,
		FileName:   fileName,
		StorageKey: storageKey,
		MimeType:   mimeType,
		SizeBytes:  written,
		AltText:    strings.TrimSpace(altText),
		UploadedBy: &uploadedBy,
	})
	if err != nil {
		_ = os.Remove(destination)
		return nil, apperr.Wrap(apperr.Internal("Failed to save media metadata."), err)
	}

	metadata, _ := json.Marshal(map[string]any{
		"fileName": fileName,
		"mimeType": mimeType,
		"size":     written,
	})
	resourceID := asset.ID.String()
	_ = s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  &uploadedBy,
		Action:       "media.uploaded",
		ResourceType: "media_asset",
		ResourceID:   &resourceID,
		Metadata:     metadata,
	})

	dto := toAssetDTO(asset)
	return &dto, nil
}

func (s *Service) SoftDelete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}

	if _, err := s.db.Queries.GetMediaAssetByID(ctx, id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperr.NotFound("Media asset not found.")
		}
		return apperr.Wrap(apperr.Internal("Failed to load media asset."), err)
	}

	if err := s.db.Queries.SoftDeleteMediaAsset(ctx, id); err != nil {
		return apperr.Wrap(apperr.Internal("Failed to delete media asset."), err)
	}

	resourceID := id.String()
	_ = s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  &actorID,
		Action:       "media.deleted",
		ResourceType: "media_asset",
		ResourceID:   &resourceID,
		Metadata:     []byte("{}"),
	})

	return nil
}

func (s *Service) AbsolutePath(storageKey string) (string, error) {
	storageKey = filepath.Base(storageKey)
	if storageKey == "" || storageKey == "." {
		return "", apperr.NotFound("Media file not found.")
	}

	root := s.cfg.Storage.LocalPath
	if root == "" {
		root = "./storage"
	}
	path := filepath.Join(root, "media", storageKey)
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return "", apperr.NotFound("Media file not found.")
		}
		return "", apperr.Wrap(apperr.Internal("Failed to access media file."), err)
	}
	return path, nil
}

func toAssetDTO(asset sqlcdb.MediaAsset) AssetDTO {
	dto := AssetDTO{
		ID:         asset.ID.String(),
		FileName:   asset.FileName,
		StorageKey: asset.StorageKey,
		URL:        "/media/" + asset.StorageKey,
		MimeType:   asset.MimeType,
		SizeBytes:  asset.SizeBytes,
		AltText:    asset.AltText,
		CreatedAt:  asset.CreatedAt.UTC().Format(time.RFC3339Nano),
	}
	if asset.FolderID != nil {
		id := asset.FolderID.String()
		dto.FolderID = &id
	}
	if asset.UploadedBy != nil {
		id := asset.UploadedBy.String()
		dto.UploadedBy = &id
	}
	return dto
}
