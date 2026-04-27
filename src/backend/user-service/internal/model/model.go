// Data models for user-service
package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID `json:"id" db:"id"`
	Phone           string   `json:"phone" db:"phone"`
	Nickname        string   `json:"nickname" db:"nickname"`
	AvatarURL       string   `json:"avatar_url" db:"avatar_url"`
	Bio             string   `json:"bio" db:"bio"`
	RLevel          string   `json:"r_level" db:"r_level"`
	CyclePosition   int      `json:"cycle_position" db:"cycle_position"`
	PasswordHash   string   `json:"-" db:"password_hash"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type Skill struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string   `json:"name" db:"name"`
	Category    string   `json:"category" db:"category"`
	Description string  `json:"description" db:"description"`
}

type UserSkill struct {
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	SkillID      uuid.UUID `json:"skill_id" db:"skill_id"`
	Level        string   `json:"level" db:"level"`
	IsOffered    bool     `json:"is_offered" db:"is_offered"`
	Proficiency string   `json:"proficiency" db:"proficiency"`
}

type CycleTask struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Type        string   `json:"type" db:"type"`
	Title       string   `json:"title" db:"title"`
	Description string  `json:"description" db:"description"`
	Reward      int      `json:"reward" db:"reward"`
	IsCompleted bool     `json:"is_completed" db:"is_completed"`
}

type DiagnosisQuestion struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Dimension string   `json:"dimension" db:"dimension"`
	Question  string   `json:"question" db:"question"`
	Options   []Option `json:"options" db:"options"`
	Weight    float64  `json:"weight" db:"weight"`
}

type Option struct {
	Value int    `json:"value"`
	Label string `json:"label"`
}

type DiagnosisAnswer struct {
	QuestionID uuid.UUID `json:"question_id"`
	Value     int       `json:"value"`
}

// API Request/Response types
type SendSmsRequest struct {
	Phone string `json:"phone" binding:"required"`
	Scene string `json:"scene" binding:"required,oneof=login register reset"`
}

type SmsLoginRequest struct {
	Phone string `json:"phone" binding:"required"`
	Code  string `json:"code" binding:"required,len=6"`
}

type RegisterRequest struct {
	Phone      string `json:"phone" binding:"required"`
	Code      string `json:"code" binding:"required,len=6"`
	Nickname   string `json:"nickname" binding:"required"`
	InviteCode string `json:"invite_code"`
}

type UpdateUserRequest struct {
	Nickname   string `json:"nickname"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
	User        *User  `json:"user"`
}

type UserResponse struct {
	*User
	Skills []UserSkill `json:"skills"`
}

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type SuccessResponse struct {
	Code    int       `json:"code"`
	Message string   `json:"message"`
	Data    interface{} `json:"data"`
}