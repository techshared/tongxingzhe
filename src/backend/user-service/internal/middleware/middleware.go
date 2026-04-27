// Middleware for user-service
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tongxingzhe/user-service/internal/model"
	"github.com/tongxingzhe/user-service/internal/service"
)

// CORS middleware
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// Recovery middleware
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, model.ErrorResponse{
					Code:    500,
					Message: "internal server error",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// Auth middleware
func Auth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Code:    401,
				Message: "authorization header required",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Code:    401,
				Message: "invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]
		authService := service.NewAuthService(nil, nil, jwtSecret)
		userID, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Code:    401,
				Message: "invalid token: " + err.Error(),
			})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}