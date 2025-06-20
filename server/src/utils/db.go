package utils

import (
	"database/sql"

	"github.com/go-sql-driver/mysql"
)

var Db *sql.DB

func DbSet() error {
	cfg := mysql.NewConfig()
	cfg.User = Env.DbUsername
	cfg.Passwd = Env.DbPassword
	cfg.Net = "tcp"
	cfg.Addr = "127.0.0.1:3306"
	cfg.DBName = Env.DbName

	var err error

	Db, err = sql.Open("mysql", cfg.FormatDSN())

	return err
}
