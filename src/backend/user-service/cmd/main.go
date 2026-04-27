// user-service main entry
package main

import (
	"log"
	"os"

	"github.com/tongxingzhe/user-service/internal/config"
	"github.com/tongxingzhe/user-service/internal/handler"
	"github.com/tongxingzhe/user-service/internal/middleware"
	"github.com/tongxingzhe/user-service/internal/repository"
	"github.com/tongxingzhe/user-service/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	var db *repository.Postgres
	var rdb *repository.Redis

	db, err := repository.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Printf("Warning: Database not available: %v", err)
		db = nil
	} else {
		defer db.Close()
	}

	rdb = repository.NewRedis(cfg.RedisAddr)
	if rdb != nil {
		defer rdb.Close()
	}

	var authService *service.AuthService
	var userService *service.UserService

	if db != nil && rdb != nil {
		authService = service.NewAuthService(db, rdb, cfg.JWTSecret)
		userService = service.NewUserService(db, rdb)
	} else {
		authService = service.NewAuthService(nil, nil, cfg.JWTSecret)
		userService = service.NewUserService(nil, nil)
	}

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)

	r := gin.Default()
	r.Use(middleware.CORS())
	r.Use(middleware.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		auth.POST("/sms/send", authHandler.SendSmsCode)
		auth.POST("/sms/login", authHandler.SmsLogin)
		auth.POST("/register", authHandler.Register)

		cycle := v1.Group("/cycle")
		cycle.GET("/diagnosis", userHandler.GetDiagnosis)
		cycle.GET("/dashboard", userHandler.GetDashboard)
		cycle.GET("/status", userHandler.GetCycleStatus)

		protected := v1.Group("")
		protected.Use(middleware.Auth(cfg.JWTSecret))
		{
			users := protected.Group("/users")
			users.GET("/me", userHandler.GetCurrentUser)
			users.PUT("/me", userHandler.UpdateCurrentUser)
			users.PUT("/me/skills", userHandler.UpdateUserSkills)
			users.GET("/:id", userHandler.GetUserById)
			users.GET("/search", userHandler.SearchUsers)

			cycle.POST("/diagnosis", userHandler.SubmitDiagnosis)
			cycle.POST("/tasks/:id/complete", userHandler.CompleteTask)

			graph := protected.Group("/graph")
			graph.GET("/trust-chain/:user_id", userHandler.GetTrustChain)
			graph.GET("/intimacy/:user_id", userHandler.GetIntimacy)
			graph.GET("/connection/:user_id", userHandler.GetConnection)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}