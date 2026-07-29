package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AccessClaims struct {
	Email       string   `json:"email"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	SessionID   string   `json:"sid"`
	jwt.RegisteredClaims
}

type AccessManager struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

func NewAccessManager(secret string, ttl time.Duration, issuer string) *AccessManager {
	return &AccessManager{
		secret: []byte(secret),
		ttl:    ttl,
		issuer: issuer,
	}
}

func (m *AccessManager) Issue(userID uuid.UUID, email, sessionID string, roles, permissions []string) (string, time.Time, error) {
	expiresAt := time.Now().UTC().Add(m.ttl)
	claims := AccessClaims{
		Email:       email,
		Roles:       roles,
		Permissions: permissions,
		SessionID:   sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    m.issuer,
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.NewString(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign access token: %w", err)
	}

	return signed, expiresAt, nil
}

func (m *AccessManager) Parse(tokenString string) (*AccessClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse access token: %w", err)
	}

	claims, ok := token.Claims.(*AccessClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid access token claims")
	}

	return claims, nil
}

func NewRefreshToken() (raw string, hash string, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}

	raw = base64.RawURLEncoding.EncodeToString(bytes)
	sum := sha256.Sum256([]byte(raw))
	hash = hex.EncodeToString(sum[:])
	return raw, hash, nil
}

func HashOpaqueToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
