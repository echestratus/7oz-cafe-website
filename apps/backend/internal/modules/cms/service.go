package cms

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	db *database.Postgres
}

type PageSummary struct {
	ID                 string         `json:"id"`
	Slug               string         `json:"slug"`
	Title              string         `json:"title"`
	Status             string         `json:"status"`
	SEO                map[string]any `json:"seo"`
	PublishedVersionID *string        `json:"publishedVersionId,omitempty"`
}

type SectionDTO struct {
	ID        string         `json:"id"`
	Code      string         `json:"code"`
	Label     string         `json:"label"`
	IsEnabled bool           `json:"isEnabled"`
	SortOrder int32          `json:"sortOrder"`
	Data      map[string]any `json:"data"`
}

type PageDraftDTO struct {
	Page     PageSummary `json:"page"`
	Sections []SectionDTO `json:"sections"`
}

type VersionSummary struct {
	ID            string `json:"id"`
	VersionNumber int32  `json:"versionNumber"`
	Summary       string `json:"summary"`
	PublishedAt   string `json:"publishedAt"`
	PublishedBy   *string `json:"publishedBy,omitempty"`
}

type PublishInput struct {
	Summary string
	ActorID uuid.UUID
}

type RollbackInput struct {
	VersionNumber int32
	Summary       string
	ActorID       uuid.UUID
}

type UpdateSectionContentInput struct {
	SectionID uuid.UUID
	Data      map[string]any
	ActorID   uuid.UUID
}

type UpdateSectionEnabledInput struct {
	SectionID uuid.UUID
	IsEnabled bool
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

func (s *Service) ListPages(ctx context.Context) ([]PageSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	pages, err := s.db.Queries.ListCMSPages(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list CMS pages."), err)
	}

	result := make([]PageSummary, 0, len(pages))
	for _, page := range pages {
		summary, err := toPageSummary(page)
		if err != nil {
			return nil, err
		}
		result = append(result, summary)
	}

	return result, nil
}

func (s *Service) GetPublishedPage(ctx context.Context, slug string) (map[string]any, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	if page.Status != "published" || page.PublishedVersionID == nil {
		return nil, apperr.NotFound("Published CMS page not found.")
	}

	version, err := s.db.Queries.GetCMSVersionByID(ctx, *page.PublishedVersionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Published CMS version not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load published CMS page."), err)
	}

	var snapshot map[string]any
	if err := json.Unmarshal(version.Snapshot, &snapshot); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to decode published CMS snapshot."), err)
	}

	return snapshot, nil
}

func (s *Service) GetDraftPage(ctx context.Context, slug string) (*PageDraftDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	sections, err := s.db.Queries.ListCMSSectionsByPageID(ctx, page.ID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load CMS sections."), err)
	}

	contents, err := s.db.Queries.ListCMSContentsByPageID(ctx, page.ID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load CMS contents."), err)
	}

	contentBySection := make(map[uuid.UUID][]byte, len(contents))
	for _, content := range contents {
		contentBySection[content.SectionID] = content.Data
	}

	sectionDTOs := make([]SectionDTO, 0, len(sections))
	for _, section := range sections {
		data, err := decodeObject(contentBySection[section.ID])
		if err != nil {
			return nil, err
		}
		sectionDTOs = append(sectionDTOs, SectionDTO{
			ID:        section.ID.String(),
			Code:      section.Code,
			Label:     section.Label,
			IsEnabled: section.IsEnabled,
			SortOrder: section.SortOrder,
			Data:      data,
		})
	}

	summary, err := toPageSummary(page)
	if err != nil {
		return nil, err
	}

	return &PageDraftDTO{
		Page:     summary,
		Sections: sectionDTOs,
	}, nil
}

func (s *Service) UpdatePageSEO(ctx context.Context, slug string, seo map[string]any) (*PageSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	payload, err := json.Marshal(seo)
	if err != nil {
		return nil, apperr.Validation("Invalid SEO payload.", response.FieldError{
			Field:   "seo",
			Message: "must be a valid object",
		})
	}

	updated, err := s.db.Queries.UpdateCMSPageSEO(ctx, sqlcdb.UpdateCMSPageSEOParams{
		ID:  page.ID,
		Seo: payload,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update page SEO."), err)
	}

	_ = s.writeAudit(ctx, nil, "cms.page.seo_updated", "cms_page", page.ID.String(), map[string]any{
		"slug": slug,
	})

	summary, err := toPageSummary(updated)
	if err != nil {
		return nil, err
	}
	return &summary, nil
}

func (s *Service) UpdateSectionEnabled(ctx context.Context, input UpdateSectionEnabledInput) (*SectionDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	section, err := s.db.Queries.UpdateCMSSectionEnabled(ctx, sqlcdb.UpdateCMSSectionEnabledParams{
		ID:        input.SectionID,
		IsEnabled: input.IsEnabled,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("CMS section not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to update CMS section."), err)
	}

	content, err := s.db.Queries.GetCMSContentBySectionID(ctx, section.ID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load section content."), err)
	}

	data, err := decodeObject(content.Data)
	if err != nil {
		return nil, err
	}

	_ = s.writeAudit(ctx, nil, "cms.section.enabled_updated", "cms_section", section.ID.String(), map[string]any{
		"isEnabled": input.IsEnabled,
	})

	return &SectionDTO{
		ID:        section.ID.String(),
		Code:      section.Code,
		Label:     section.Label,
		IsEnabled: section.IsEnabled,
		SortOrder: section.SortOrder,
		Data:      data,
	}, nil
}

func (s *Service) UpdateSectionContent(ctx context.Context, input UpdateSectionContentInput) (*SectionDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	if input.Data == nil {
		return nil, apperr.Validation("Content data is required.", response.FieldError{
			Field:   "data",
			Message: "is required",
		})
	}

	section, err := s.db.Queries.GetCMSSectionByID(ctx, input.SectionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("CMS section not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load CMS section."), err)
	}

	payload, err := json.Marshal(input.Data)
	if err != nil {
		return nil, apperr.Validation("Invalid content payload.", response.FieldError{
			Field:   "data",
			Message: "must be a valid object",
		})
	}

	actorID := input.ActorID
	content, err := s.db.Queries.UpdateCMSContentData(ctx, sqlcdb.UpdateCMSContentDataParams{
		SectionID: section.ID,
		Data:      payload,
		UpdatedBy: &actorID,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update section content."), err)
	}

	data, err := decodeObject(content.Data)
	if err != nil {
		return nil, err
	}

	_ = s.writeAudit(ctx, &actorID, "cms.section.content_updated", "cms_section", section.ID.String(), map[string]any{
		"code": section.Code,
	})

	return &SectionDTO{
		ID:        section.ID.String(),
		Code:      section.Code,
		Label:     section.Label,
		IsEnabled: section.IsEnabled,
		SortOrder: section.SortOrder,
		Data:      data,
	}, nil
}

func (s *Service) Publish(ctx context.Context, slug string, input PublishInput) (*VersionSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	draft, err := s.GetDraftPage(ctx, slug)
	if err != nil {
		return nil, err
	}

	snapshotSections := make([]map[string]any, 0, len(draft.Sections))
	for _, section := range draft.Sections {
		if !section.IsEnabled {
			continue
		}
		snapshotSections = append(snapshotSections, map[string]any{
			"id":        section.ID,
			"code":      section.Code,
			"label":     section.Label,
			"isEnabled": section.IsEnabled,
			"sortOrder": section.SortOrder,
			"data":      section.Data,
		})
	}

	snapshot := map[string]any{
		"page": map[string]any{
			"id":     draft.Page.ID,
			"slug":   draft.Page.Slug,
			"title":  draft.Page.Title,
			"status": "published",
			"seo":    draft.Page.SEO,
		},
		"sections": snapshotSections,
	}

	snapshotBytes, err := json.Marshal(snapshot)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to encode publish snapshot."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start publish transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.db.Queries.WithTx(tx)
	latest, err := qtx.GetLatestCMSVersionNumber(ctx, page.ID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to resolve CMS version number."), err)
	}

	actorID := input.ActorID
	version, err := qtx.CreateCMSVersion(ctx, sqlcdb.CreateCMSVersionParams{
		ID:            uuid.New(),
		PageID:        page.ID,
		VersionNumber: latest + 1,
		Summary:       strings.TrimSpace(input.Summary),
		Snapshot:      snapshotBytes,
		PublishedBy:   &actorID,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create CMS version."), err)
	}

	if _, err := qtx.MarkCMSPagePublished(ctx, sqlcdb.MarkCMSPagePublishedParams{
		ID:                 page.ID,
		PublishedVersionID: &version.ID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to mark CMS page published."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit CMS publish."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "cms.page.published", "cms_page", page.ID.String(), map[string]any{
		"slug":          slug,
		"versionNumber": version.VersionNumber,
	})

	return toVersionSummary(version), nil
}

func (s *Service) Rollback(ctx context.Context, slug string, input RollbackInput) (*VersionSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	if input.VersionNumber <= 0 {
		return nil, apperr.Validation("Version number is required.", response.FieldError{
			Field:   "versionNumber",
			Message: "must be greater than zero",
		})
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	source, err := s.db.Queries.GetCMSVersionByPageAndNumber(ctx, sqlcdb.GetCMSVersionByPageAndNumberParams{
		PageID:        page.ID,
		VersionNumber: input.VersionNumber,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("CMS version not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load CMS version."), err)
	}

	var snapshot struct {
		Page struct {
			SEO map[string]any `json:"seo"`
		} `json:"page"`
		Sections []struct {
			ID        string         `json:"id"`
			Code      string         `json:"code"`
			IsEnabled bool           `json:"isEnabled"`
			Data      map[string]any `json:"data"`
		} `json:"sections"`
	}
	if err := json.Unmarshal(source.Snapshot, &snapshot); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to decode CMS version snapshot."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start rollback transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.db.Queries.WithTx(tx)
	actorID := input.ActorID

	if snapshot.Page.SEO != nil {
		seoBytes, err := json.Marshal(snapshot.Page.SEO)
		if err != nil {
			return nil, apperr.Wrap(apperr.Internal("Failed to encode restored SEO."), err)
		}
		if _, err := qtx.UpdateCMSPageSEO(ctx, sqlcdb.UpdateCMSPageSEOParams{
			ID:  page.ID,
			Seo: seoBytes,
		}); err != nil {
			return nil, apperr.Wrap(apperr.Internal("Failed to restore page SEO."), err)
		}
	}

	for _, sectionSnap := range snapshot.Sections {
		sectionID, err := uuid.Parse(sectionSnap.ID)
		if err != nil {
			continue
		}

		if _, err := qtx.UpdateCMSSectionEnabled(ctx, sqlcdb.UpdateCMSSectionEnabledParams{
			ID:        sectionID,
			IsEnabled: sectionSnap.IsEnabled,
		}); err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Wrap(apperr.Internal("Failed to restore section state."), err)
		}

		payload, err := json.Marshal(sectionSnap.Data)
		if err != nil {
			return nil, apperr.Wrap(apperr.Internal("Failed to encode restored section content."), err)
		}

		if _, err := qtx.UpdateCMSContentData(ctx, sqlcdb.UpdateCMSContentDataParams{
			SectionID: sectionID,
			Data:      payload,
			UpdatedBy: &actorID,
		}); err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Wrap(apperr.Internal("Failed to restore section content."), err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit CMS rollback draft restore."), err)
	}

	summary := strings.TrimSpace(input.Summary)
	if summary == "" {
		summary = fmt.Sprintf("Rollback to version %d", input.VersionNumber)
	}

	return s.Publish(ctx, slug, PublishInput{
		Summary: summary,
		ActorID: actorID,
	})
}

func (s *Service) ListVersions(ctx context.Context, slug string) ([]VersionSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	page, err := s.getPageBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	versions, err := s.db.Queries.ListCMSVersionsByPageID(ctx, page.ID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list CMS versions."), err)
	}

	result := make([]VersionSummary, 0, len(versions))
	for _, version := range versions {
		result = append(result, *toVersionSummary(version))
	}
	return result, nil
}

func (s *Service) requireDB() error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}
	return nil
}

func (s *Service) getPageBySlug(ctx context.Context, slug string) (sqlcdb.CmsPage, error) {
	slug = strings.TrimSpace(strings.ToLower(slug))
	if slug == "" {
		return sqlcdb.CmsPage{}, apperr.Validation("Page slug is required.", response.FieldError{
			Field:   "slug",
			Message: "is required",
		})
	}

	page, err := s.db.Queries.GetCMSPageBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlcdb.CmsPage{}, apperr.NotFound("CMS page not found.")
		}
		return sqlcdb.CmsPage{}, apperr.Wrap(apperr.Internal("Failed to load CMS page."), err)
	}

	return page, nil
}

func (s *Service) writeAudit(
	ctx context.Context,
	actor *uuid.UUID,
	action, resourceType, resourceID string,
	payload map[string]any,
) error {
	if s.db == nil {
		return nil
	}
	if payload == nil {
		payload = map[string]any{}
	}
	metadata, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	var resourceIDPtr *string
	if resourceID != "" {
		resourceIDPtr = &resourceID
	}
	return s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  actor,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}

func toPageSummary(page sqlcdb.CmsPage) (PageSummary, error) {
	seo, err := decodeObject(page.Seo)
	if err != nil {
		return PageSummary{}, err
	}

	summary := PageSummary{
		ID:     page.ID.String(),
		Slug:   page.Slug,
		Title:  page.Title,
		Status: page.Status,
		SEO:    seo,
	}
	if page.PublishedVersionID != nil {
		id := page.PublishedVersionID.String()
		summary.PublishedVersionID = &id
	}
	return summary, nil
}

func toVersionSummary(version sqlcdb.CmsVersion) *VersionSummary {
	summary := &VersionSummary{
		ID:            version.ID.String(),
		VersionNumber: version.VersionNumber,
		Summary:       version.Summary,
		PublishedAt:   version.PublishedAt.UTC().Format(jsonTimeLayout),
	}
	if version.PublishedBy != nil {
		id := version.PublishedBy.String()
		summary.PublishedBy = &id
	}
	return summary
}

func decodeObject(raw []byte) (map[string]any, error) {
	if len(raw) == 0 {
		return map[string]any{}, nil
	}
	var object map[string]any
	if err := json.Unmarshal(raw, &object); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to decode JSON object."), err)
	}
	if object == nil {
		object = map[string]any{}
	}
	return object, nil
}

const jsonTimeLayout = "2006-01-02T15:04:05.000Z07:00"
