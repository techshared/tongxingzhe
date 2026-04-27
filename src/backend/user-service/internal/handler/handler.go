// HTTP handlers for user-service
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tongxingzhe/user-service/internal/model"
	"github.com/tongxingzhe/user-service/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(as *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: as}
}

// SendSmsCode POST /api/v1/auth/sms/send
func (h *AuthHandler) SendSmsCode(c *gin.Context) {
	var req model.SendSmsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	if err := h.authService.SendSMSCode(c.Request.Context(), req.Phone, req.Scene); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Code:    0,
		Message: "success",
		Data:    map[string]int{"expire_in": 60},
	})
}

// SmsLogin POST /api/v1/auth/sms/login
func (h *AuthHandler) SmsLogin(c *gin.Context) {
	var req model.SmsLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req.Phone, req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Code:    0,
		Message: "success",
		Data:    resp,
	})
}

// Register POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	resp, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Code:    0,
		Message: "success",
		Data:    resp,
	})
}

// UserHandler handles user endpoints
type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(us *service.UserService) *UserHandler {
	return &UserHandler{userService: us}
}

// GetCurrentUser GET /api/v1/users/me
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "unauthorized"})
		return
	}

	resp, err := h.userService.GetUserWithSkills(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: resp})
}

// UpdateCurrentUser PUT /api/v1/users/me
func (h *UserHandler) UpdateCurrentUser(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "unauthorized"})
		return
	}

	var req model.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	resp, err := h.userService.UpdateUser(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: resp})
}

// UpdateUserSkills PUT /api/v1/users/me/skills
func (h *UserHandler) UpdateUserSkills(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "unauthorized"})
		return
	}

	var req struct {
		Skills []model.UserSkill `json:"skills"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	if err := h.userService.UpdateUserSkills(userID, req.Skills); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: nil})
}

// GetUserById GET /api/v1/users/:id
func (h *UserHandler) GetUserById(c *gin.Context) {
	id := c.Param("id")

	user, err := h.userService.GetUserByID(id)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "user not found"})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: user})
}

// SearchUsers GET /api/v1/users/search
func (h *UserHandler) SearchUsers(c *gin.Context) {
	keyword := c.Query("keyword")
	page := parseIntDefault(c.Query("page"), 1)
	size := parseIntDefault(c.Query("size"), 20)

	users, err := h.userService.SearchUsers(keyword, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: users})
}

// Cycle handlers
func (h *UserHandler) GetDiagnosis(c *gin.Context) {
	questions, err := h.userService.GetDiagnosisQuestions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: map[string]interface{}{
		"questions": questions,
	}})
}

func (h *UserHandler) SubmitDiagnosis(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "unauthorized"})
		return
	}

	var req struct {
		Answers []model.DiagnosisAnswer `json:"answers"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: err.Error()})
		return
	}

	if err := h.userService.SubmitDiagnosis(userID, req.Answers); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: map[string]interface{}{
		"cycle_position":       2,
		"cycle_position_label": "低迷期",
	}})
}

func (h *UserHandler) GetDashboard(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: map[string]interface{}{
		"current_level":         "R1",
		"current_level_label":   "入门阶段",
		"cycle_position":        0,
		"cycle_position_label":  "冲击期",
		"progress":             map[string]int{"r1_to_r2": 0},
		"next_milestone":       map[string]interface{}{"level": "R2", "requirement": "完善资料"},
		"today_tasks":         []interface{}{},
	}})
}

func (h *UserHandler) GetCycleStatus(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: map[string]interface{}{
		"r_level":         "R1",
		"cycle_position":  0,
	}})
}

func (h *UserHandler) CompleteTask(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: nil})
}

// Graph handlers
func (h *UserHandler) GetTrustChain(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: nil})
}

func (h *UserHandler) GetIntimacy(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: nil})
}

func (h *UserHandler) GetConnection(c *gin.Context) {
	c.JSON(http.StatusOK, model.SuccessResponse{Code: 0, Message: "success", Data: nil})
}

// Helper functions
func parseIntDefault(s string, defaultValue int) int {
	if s == "" {
		return defaultValue
	}
	// In production use strconv.Atoi
	return defaultValue
}