package blog

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type Service struct {
	db *database.Postgres
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

type PostDTO struct {
	ID           string         `json:"id"`
	Slug         string         `json:"slug"`
	Title        string         `json:"title"`
	Excerpt      string         `json:"excerpt"`
	Body         string         `json:"body"`
	Kind         string         `json:"kind"`
	CoverURL     *string        `json:"coverUrl,omitempty"`
	CoverMediaID *string        `json:"coverMediaId,omitempty"`
	Status       string         `json:"status"`
	PublishedAt  *string        `json:"publishedAt,omitempty"`
	SEO          map[string]any `json:"seo"`
	CreatedAt    string         `json:"createdAt"`
	UpdatedAt    string         `json:"updatedAt"`
}

type CreatePostInput struct {
	Slug         string
	Title        string
	Excerpt      string
	Body         string
	Kind         string
	CoverURL     *string
	CoverMediaID *string
	Status       string
	PublishedAt  *time.Time
	SEO          map[string]any
}

type UpdatePostInput struct {
	Slug         *string
	Title        *string
	Excerpt      *string
	Body         *string
	Kind         *string
	CoverURL     *string
	ClearCover   bool
	CoverMediaID *string
	Status       *string
	PublishedAt  *time.Time
	ClearPublishedAt bool
	SEO          map[string]any
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func (s *Service) requireDB() error {
	if s == nil || s.db == nil || s.db.Queries == nil {
		return apperr.Internal("Database unavailable.")
	}
	return nil
}

func (s *Service) ListPublished(ctx context.Context, page, limit int) ([]PostDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	page, limit = normalizePagination(page, limit)
	offset := int32((page - 1) * limit)

	total, err := s.db.Queries.CountPublishedBlogPosts(ctx)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list blog posts."), err)
	}

	rows, err := s.db.Queries.ListPublishedBlogPosts(ctx, sqlcdb.ListPublishedBlogPostsParams{
		Limit:  int32(limit),
		Offset: offset,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list blog posts."), err)
	}

	items := make([]PostDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toDTO(row))
	}
	return items, total, nil
}

func (s *Service) GetPublishedBySlug(ctx context.Context, slug string) (*PostDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, apperr.BadRequest("Slug is required.")
	}

	row, err := s.db.Queries.GetPublishedBlogPostBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Blog post not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Unable to load blog post."), err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) ListAdmin(ctx context.Context, status, kind, search string, page, limit int) ([]PostDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	page, limit = normalizePagination(page, limit)
	offset := int32((page - 1) * limit)

	params := sqlcdb.CountAdminBlogPostsParams{}
	listParams := sqlcdb.ListAdminBlogPostsParams{
		Limit:  int32(limit),
		Offset: offset,
	}
	if status = strings.TrimSpace(status); status != "" {
		params.Status = &status
		listParams.Status = &status
	}
	if kind = strings.TrimSpace(kind); kind != "" {
		params.Kind = &kind
		listParams.Kind = &kind
	}
	if search = strings.TrimSpace(search); search != "" {
		params.Search = &search
		listParams.Search = &search
	}

	total, err := s.db.Queries.CountAdminBlogPosts(ctx, params)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list blog posts."), err)
	}

	rows, err := s.db.Queries.ListAdminBlogPosts(ctx, listParams)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Unable to list blog posts."), err)
	}

	items := make([]PostDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toDTO(row))
	}
	return items, total, nil
}

func (s *Service) GetAdmin(ctx context.Context, id uuid.UUID) (*PostDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	row, err := s.db.Queries.GetBlogPostByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Blog post not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Unable to load blog post."), err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Create(ctx context.Context, input CreatePostInput) (*PostDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	slug, title, excerpt, body, kind, status, err := normalizeWriteInput(
		input.Slug,
		input.Title,
		input.Excerpt,
		input.Body,
		input.Kind,
		input.Status,
		true,
	)
	if err != nil {
		return nil, err
	}

	publishedAt := input.PublishedAt
	if status == "published" && publishedAt == nil {
		now := time.Now().UTC()
		publishedAt = &now
	}
	if status != "published" {
		publishedAt = nil
	}

	seoBytes, err := marshalSEO(input.SEO)
	if err != nil {
		return nil, err
	}

	var coverMediaID *uuid.UUID
	if input.CoverMediaID != nil && strings.TrimSpace(*input.CoverMediaID) != "" {
		parsed, parseErr := uuid.Parse(strings.TrimSpace(*input.CoverMediaID))
		if parseErr != nil {
			return nil, apperr.BadRequest("Invalid cover media id.")
		}
		coverMediaID = &parsed
	}

	row, err := s.db.Queries.CreateBlogPost(ctx, sqlcdb.CreateBlogPostParams{
		ID:           uuid.New(),
		Slug:         slug,
		Title:        title,
		Excerpt:      excerpt,
		Body:         body,
		Kind:         kind,
		CoverUrl:     trimOptional(input.CoverURL),
		CoverMediaID: coverMediaID,
		Status:       status,
		PublishedAt:  publishedAt,
		Seo:          seoBytes,
	})
	if err != nil {
		return nil, mapWriteError(err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, input UpdatePostInput) (*PostDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	existing, err := s.db.Queries.GetBlogPostByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Blog post not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Unable to load blog post."), err)
	}

	slug := existing.Slug
	title := existing.Title
	excerpt := existing.Excerpt
	body := existing.Body
	kind := existing.Kind
	status := existing.Status
	publishedAt := existing.PublishedAt
	coverURL := existing.CoverUrl
	coverMediaID := existing.CoverMediaID
	seoBytes := existing.Seo

	if input.Slug != nil {
		slug = *input.Slug
	}
	if input.Title != nil {
		title = *input.Title
	}
	if input.Excerpt != nil {
		excerpt = *input.Excerpt
	}
	if input.Body != nil {
		body = *input.Body
	}
	if input.Kind != nil {
		kind = *input.Kind
	}
	if input.Status != nil {
		status = *input.Status
	}
	if input.CoverURL != nil {
		coverURL = trimOptional(input.CoverURL)
	}
	if input.ClearCover {
		coverURL = nil
	}
	if input.CoverMediaID != nil {
		if strings.TrimSpace(*input.CoverMediaID) == "" {
			coverMediaID = nil
		} else {
			parsed, parseErr := uuid.Parse(strings.TrimSpace(*input.CoverMediaID))
			if parseErr != nil {
				return nil, apperr.BadRequest("Invalid cover media id.")
			}
			coverMediaID = &parsed
		}
	}
	if input.SEO != nil {
		seoBytes, err = marshalSEO(input.SEO)
		if err != nil {
			return nil, err
		}
	}
	if input.ClearPublishedAt {
		publishedAt = nil
	}
	if input.PublishedAt != nil {
		publishedAt = input.PublishedAt
	}

	slug, title, excerpt, body, kind, status, err = normalizeWriteInput(slug, title, excerpt, body, kind, status, false)
	if err != nil {
		return nil, err
	}

	if status == "published" && publishedAt == nil {
		now := time.Now().UTC()
		publishedAt = &now
	}
	if status != "published" && input.PublishedAt == nil {
		publishedAt = nil
	}

	row, err := s.db.Queries.UpdateBlogPost(ctx, sqlcdb.UpdateBlogPostParams{
		ID:           id,
		Slug:         slug,
		Title:        title,
		Excerpt:      excerpt,
		Body:         body,
		Kind:         kind,
		CoverUrl:     coverURL,
		CoverMediaID: coverMediaID,
		Status:       status,
		PublishedAt:  publishedAt,
		Seo:          seoBytes,
	})
	if err != nil {
		return nil, mapWriteError(err)
	}
	dto := toDTO(row)
	return &dto, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	_, err := s.db.Queries.GetBlogPostByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperr.NotFound("Blog post not found.")
		}
		return apperr.Wrap(apperr.Internal("Unable to load blog post."), err)
	}
	if err := s.db.Queries.SoftDeleteBlogPost(ctx, id); err != nil {
		return apperr.Wrap(apperr.Internal("Unable to delete blog post."), err)
	}
	return nil
}

func normalizePagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

func normalizeWriteInput(slug, title, excerpt, body, kind, status string, requireAll bool) (string, string, string, string, string, string, error) {
	title = strings.TrimSpace(title)
	excerpt = strings.TrimSpace(excerpt)
	body = strings.TrimSpace(body)
	slug = strings.TrimSpace(strings.ToLower(slug))
	kind = strings.TrimSpace(strings.ToLower(kind))
	status = strings.TrimSpace(strings.ToLower(status))

	if requireAll || title != "" {
		if title == "" {
			return "", "", "", "", "", "", apperr.Validation("Title is required.")
		}
	}
	if slug == "" {
		slug = slugify(title)
	}
	if !slugPattern.MatchString(slug) {
		return "", "", "", "", "", "", apperr.Validation("Slug must be lowercase letters, numbers, and hyphens.")
	}
	if kind == "" {
		kind = "news"
	}
	if kind != "news" && kind != "event" {
		return "", "", "", "", "", "", apperr.Validation("Kind must be news or event.")
	}
	if status == "" {
		status = "draft"
	}
	if status != "draft" && status != "published" && status != "archived" {
		return "", "", "", "", "", "", apperr.Validation("Status must be draft, published, or archived.")
	}
	return slug, title, excerpt, body, kind, status, nil
}

func slugify(value string) string {
	var b strings.Builder
	lastHyphen := false
	for _, r := range strings.ToLower(strings.TrimSpace(value)) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
			lastHyphen = false
			continue
		}
		if (r == ' ' || r == '-' || r == '_') && !lastHyphen && b.Len() > 0 {
			b.WriteByte('-')
			lastHyphen = true
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "post"
	}
	return out
}

func trimOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func marshalSEO(seo map[string]any) ([]byte, error) {
	if seo == nil {
		return []byte("{}"), nil
	}
	bytes, err := json.Marshal(seo)
	if err != nil {
		return nil, apperr.BadRequest("Invalid SEO payload.")
	}
	return bytes, nil
}

func mapWriteError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return apperr.Conflict("A blog post with this slug already exists.")
	}
	return apperr.Wrap(apperr.Internal("Unable to save blog post."), err)
}

func toDTO(row sqlcdb.BlogPost) PostDTO {
	seo := map[string]any{}
	if len(row.Seo) > 0 {
		_ = json.Unmarshal(row.Seo, &seo)
	}

	dto := PostDTO{
		ID:        row.ID.String(),
		Slug:      row.Slug,
		Title:     row.Title,
		Excerpt:   row.Excerpt,
		Body:      row.Body,
		Kind:      row.Kind,
		CoverURL:  row.CoverUrl,
		Status:    row.Status,
		SEO:       seo,
		CreatedAt: row.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: row.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if row.CoverMediaID != nil {
		id := row.CoverMediaID.String()
		dto.CoverMediaID = &id
	}
	if row.PublishedAt != nil {
		value := row.PublishedAt.UTC().Format(time.RFC3339)
		dto.PublishedAt = &value
	}
	return dto
}
