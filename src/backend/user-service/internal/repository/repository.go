// Database repository for user-service
package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	_ "github.com/lib/pq"
	"github.com/tongxingzhe/user-service/internal/model"
)

type Postgres struct {
	db *sql.DB
}

func NewPostgres(connStr string) (*Postgres, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return &Postgres{db: db}, nil
}

func (r *Postgres) Close() error {
	return r.db.Close()
}

// User operations
func (r *Postgres) CreateUser(user *model.User) error {
	query := `
		INSERT INTO users (id, phone, nickname, avatar_url, bio, r_level, cycle_position, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(query, user.ID, user.Phone, user.Nickname, user.AvatarURL, 
		user.Bio, user.RLevel, user.CyclePosition, user.PasswordHash, user.CreatedAt, user.UpdatedAt)
	return err
}

func (r *Postgres) GetUserByPhone(phone string) (*model.User, error) {
	query := `SELECT id, phone, nickname, avatar_url, bio, r_level, cycle_position, password_hash, created_at, updated_at 
		FROM users WHERE phone = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, phone).Scan(&user.ID, &user.Phone, &user.Nickname, &user.AvatarURL,
		&user.Bio, &user.RLevel, &user.CyclePosition, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *Postgres) GetUserByID(id uuid.UUID) (*model.User, error) {
	query := `SELECT id, phone, nickname, avatar_url, bio, r_level, cycle_position, password_hash, created_at, updated_at 
		FROM users WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Phone, &user.Nickname, &user.AvatarURL,
		&user.Bio, &user.RLevel, &user.CyclePosition, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *Postgres) UpdateUser(user *model.User) error {
	query := `
		UPDATE users SET nickname = $2, avatar_url = $3, bio = $4, updated_at = $5
		WHERE id = $1
	`
	_, err := r.db.Exec(query, user.ID, user.Nickname, user.AvatarURL, user.Bio, time.Now())
	return err
}

func (r *Postgres) SearchUsers(keyword string, limit, offset int) ([]*model.User, error) {
	query := `
		SELECT id, phone, nickname, avatar_url, bio, r_level, cycle_position, created_at, updated_at
		FROM users 
		WHERE nickname ILIKE $1 OR bio ILIKE $1
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(query, "%"+keyword+"%", limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		user := &model.User{}
		if err := rows.Scan(&user.ID, &user.Phone, &user.Nickname, &user.AvatarURL,
			&user.Bio, &user.RLevel, &user.CyclePosition, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

// Skill operations
func (r *Postgres) GetAllSkills() ([]*model.Skill, error) {
	query := `SELECT id, name, category, description FROM skills ORDER BY category, name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []*model.Skill
	for rows.Next() {
		skill := &model.Skill{}
		if err := rows.Scan(&skill.ID, &skill.Name, &skill.Category, &skill.Description); err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}
	return skills, nil
}

func (r *Postgres) GetUserSkills(userID uuid.UUID) ([]*model.UserSkill, error) {
	query := `
		SELECT us.user_id, us.skill_id, s.name, us.level, us.is_offered, us.proficiency
		FROM user_skills us
		JOIN skills s ON us.skill_id = s.id
		WHERE us.user_id = $1
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []*model.UserSkill
	for rows.Next() {
		skill := &model.UserSkill{}
		if err := rows.Scan(&skill.UserID, &skill.SkillID, &skill.Level, &skill.IsOffered, &skill.Proficiency); err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}
	return skills, nil
}

func (r *Postgres) UpdateUserSkills(userID uuid.UUID, skills []model.UserSkill) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete existing skills
	_, err = tx.ExecContext(ctx, `DELETE FROM user_skills WHERE user_id = $1`, userID)
	if err != nil {
		return err
	}

	// Insert new skills
	for _, skill := range skills {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO user_skills (user_id, skill_id, level, is_offered, proficiency)
			VALUES ($1, $2, $3, $4, $5)
		`, userID, skill.SkillID, skill.Level, skill.IsOffered, skill.Proficiency)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// Cycle operations
func (r *Postgres) GetDiagnosisQuestions() ([]*model.DiagnosisQuestion, error) {
	query := `SELECT id, dimension, question, options, weight FROM diagnosis_questions WHERE status = 1 ORDER BY sort_order`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []*model.DiagnosisQuestion
	for rows.Next() {
		q := &model.DiagnosisQuestion{}
		var options []byte
		if err := rows.Scan(&q.ID, &q.Dimension, &q.Question, &options, &q.Weight); err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *Postgres) SaveDiagnosis(userID uuid.UUID, answers []model.DiagnosisAnswer) error {
	// Simplified - actual implementation would calculate scores
	query := `
		INSERT INTO diagnosis_records (id, user_id, total_score, cycle_position, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(query, uuid.New(), userID, 0.5, 2, time.Now())
	return err
}

// Redis operations
type Redis struct {
	rdb *redis.Client
}

func NewRedis(addr string) *Redis {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       0,
	})
	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		return nil
	}
	return &Redis{rdb: rdb}
}

func (r *Redis) Close() error {
	return r.rdb.Close()
}

func (r *Redis) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.rdb.Set(ctx, key, value, expiration).Err()
}

func (r *Redis) Get(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}

func (r *Redis) Del(ctx context.Context, keys ...string) error {
	return r.rdb.Del(ctx, keys...).Err()
}

// SMS code operations
func (r *Redis) SetSMSCode(ctx context.Context, phone, code string) error {
	key := fmt.Sprintf("sms:%s", phone)
	return r.Set(ctx, key, code, 5*time.Minute)
}

func (r *Redis) GetSMSCode(ctx context.Context, phone string) (string, error) {
	key := fmt.Sprintf("sms:%s", phone)
	return r.Get(ctx, key)
}

// Session operations
func (r *Redis) SetSession(ctx context.Context, userID uuid.UUID, token string, expiration time.Duration) error {
	key := fmt.Sprintf("session:%s", userID)
	return r.Set(ctx, key, token, expiration)
}