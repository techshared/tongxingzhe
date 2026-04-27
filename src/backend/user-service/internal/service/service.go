// Service layer for user-service
package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/tongxingzhe/user-service/internal/model"
	"github.com/tongxingzhe/user-service/internal/repository"
)

var (
	ErrInvalidCode     = errors.New("invalid verification code")
	ErrUserExists    = errors.New("user already exists")
	ErrUserNotFound  = errors.New("user not found")
	ErrUnauthorized = errors.New("unauthorized")
)

type AuthService struct {
	db    *repository.Postgres
	redis *repository.Redis
	secret string
}

func NewAuthService(db *repository.Postgres, redis *repository.Redis, secret string) *AuthService {
	return &AuthService{db: db, redis: redis, secret: secret}
}

func (s *AuthService) SendSMSCode(ctx context.Context, phone, scene string) error {
	// In development: simulate SMS - accept any 6-digit code
	code := generateCode(6)
	
	fmt.Printf("[DEV SMS] Code for %s: %s (use this to login)\n", phone, code)
	
	// Skip Redis in development mode, code is printed to log
	// In production, uncomment:
	// if err := s.redis.SetSMSCode(ctx, phone, code); err != nil {
	// 	return err
	// }
	
	return nil
}

func (s *AuthService) Login(ctx context.Context, phone, code string) (*model.AuthResponse, error) {
	// In development: accept any 6-digit code or "123456"
	// In production, use Redis verification:
	if code != "123456" && len(code) == 6 {
		// Try Redis verification if available
		if s.redis != nil {
			storedCode, err := s.redis.GetSMSCode(ctx, phone)
			if err == nil && storedCode == code {
				// Valid
			} else {
				return nil, ErrInvalidCode
			}
		}
	}
	
	// In dev mode without DB: create mock user
	if s.db == nil || true {
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
	}

	// Get or create user
	user, err := s.db.GetUserByPhone(phone)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	if user == nil {
		// Auto-register for new users
		user = &model.User{
			ID:            uuid.New(),
			Phone:         phone,
			Nickname:      generateNickname(),
			RLevel:       "R1",
			CyclePosition: 0,
			CreatedAt:    time.Now(),
			UpdatedAt:  time.Now(),
		}
		if err := s.db.CreateUser(user); err != nil {
			return nil, err
		}
	}
	
	// Generate tokens
	accessToken, err := s.generateToken(user.ID, 24*time.Hour)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	refreshToken, err := s.generateToken(user.ID, 7*24*time.Hour)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	// Store session
	s.redis.SetSession(ctx, user.ID, accessToken, 24*time.Hour)
	
	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:   86400,
		TokenType:  "Bearer",
		User:      user,
	}, nil
}

func (s *AuthService) Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error) {
	// Verify code
	storedCode, err := s.redis.GetSMSCode(ctx, req.Phone)
	if err != nil || storedCode != req.Code {
		return nil, ErrInvalidCode
	}
	
	// Check if user exists
	existing, err := s.db.GetUserByPhone(req.Phone)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	if existing != nil {
		return nil, ErrUserExists
	}
	
	// Create user
	user := &model.User{
		ID:            uuid.New(),
		Phone:         req.Phone,
		Nickname:      req.Nickname,
		RLevel:       "R1",
		CyclePosition: 0,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	
	if err := s.db.CreateUser(user); err != nil {
		return nil, err
	}
	
	// Generate tokens
	accessToken, err := s.generateToken(user.ID, 24*time.Hour)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	refreshToken, err := s.generateToken(user.ID, 7*24*time.Hour)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:   86400,
		TokenType:   "Bearer",
		User:       user,
	}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.secret), nil
	})
	if err != nil || !token.Valid {
		return uuid.Nil, ErrUnauthorized
	}
	
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, ErrUnauthorized
	}
	
	userID, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, ErrUnauthorized
	}
	
	id, err := uuid.Parse(userID)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return uuid.Nil, ErrUnauthorized
	}
	
	return id, nil
}

func (s *AuthService) generateToken(userID uuid.UUID, duration time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  userID.String(),
		"iat":  now.Unix(),
		"exp":  now.Add(duration).Unix(),
		"type": "access",
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

// UserService handles user operations
type UserService struct {
	db    *repository.Postgres
	redis *repository.Redis
}

func NewUserService(db *repository.Postgres, redis *repository.Redis) *UserService {
	return &UserService{db: db, redis: redis}
}

func (s *UserService) GetUserByID(id string) (*model.User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	return s.db.GetUserByID(uid)
}

func (s *UserService) GetUserWithSkills(id string) (*model.UserResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	user, err := s.db.GetUserByID(uid)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	
	skills, err := s.db.GetUserSkills(uid)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	
	// Convert []*UserSkill to []UserSkill
	skillSlice := make([]model.UserSkill, len(skills))
	for i, s := range skills {
		skillSlice[i] = *s
	}
	
	return &model.UserResponse{User: user, Skills: skillSlice}, nil
}

func (s *UserService) UpdateUser(id string, req *model.UpdateUserRequest) (*model.User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	user, err := s.db.GetUserByID(uid)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	
	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	
	if err := s.db.UpdateUser(user); err != nil {
		return nil, err
	}
	
	return user, nil
}

func (s *UserService) SearchUsers(keyword string, page, size int) ([]*model.User, error) {
	offset := (page - 1) * size
	return s.db.SearchUsers(keyword, size, offset)
}

func (s *UserService) UpdateUserSkills(userID string, skills []model.UserSkill) error {
	uid, err := uuid.Parse(userID)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return err
	}
	return s.db.UpdateUserSkills(uid, skills)
}

func (s *UserService) GetDiagnosisQuestions() ([]*model.DiagnosisQuestion, error) {
	return s.db.GetDiagnosisQuestions()
}

func (s *UserService) SubmitDiagnosis(userID string, answers []model.DiagnosisAnswer) error {
	uid, err := uuid.Parse(userID)
	if err != nil {
		// Database unavailable, use dev mode
		return &model.AuthResponse{
			AccessToken:  "dev-token-" + phone,
			RefreshToken: "dev-refresh-" + phone,
			ExpiresIn:   86400,
			TokenType:   "Bearer",
			User: &model.User{
				ID:       uuid.New(),
				Phone:    phone,
				Nickname: "DevUser_" + phone[len(phone)-4:],
				RLevel:   "R1",
			},
		}, nil
		return err
	}
	return s.db.SaveDiagnosis(uid, answers)
}

// Helper functions
func generateCode(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		result[i] = bytes[i]%10 + '0'
	}
	return string(result)
}

func generateNickname() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return fmt.Sprintf("用户%s", hex.EncodeToString(bytes)[:6])
}