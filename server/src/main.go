package main

import (
	"bufio"
	"database/sql"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-sql-driver/mysql"
)

//	weekListGet
//		header
//			u8 versionNumber
//			u8 weekCount
//			u8 memberCount
//		memberName[memberCount]
//			u8 length
//			u8[length] data
//		week[weekCount]
//			u8[7] weekNumbers
//			u32[7 * memberCount] bandAvailability

type Env struct {
	dbName     string
	dbUsername string
	dbPassword string
	clientPath string
}

var env Env
var db *sql.DB

func main() {
	var err error

	err = EnvSet()
	if err != nil {
		log.Fatal(err)
	}

	err = DbSet()
	if err != nil {
		log.Fatal(err)
	}

	var mux *http.ServeMux = http.NewServeMux()

	var client http.Handler = http.FileServer(http.Dir(env.clientPath))

	mux.Handle("GET /", client)
	mux.HandleFunc("GET /bands/{name}", BandGet)

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func EnvSet() error {

	file, err := os.Open("./.env")

	if err != nil {
		return err
	}

	defer file.Close()

	var reader *bufio.Reader = bufio.NewReader(file)

	for {

		line, err := reader.ReadString('\n')

		if err == nil {
			envParse(line)
			continue
		}

		if err == io.EOF {
			if len(line) > 0 {
				envParse(line)
			}
			break
		}

		return err

	}

	return nil
}

func envParse(line string) {

	line, _, _ = strings.Cut(line, "#")

	if len(line) == 0 {
		return
	}

	key, value, _ := strings.Cut(line, "=")

	key = strings.TrimSpace(key)
	value = strings.TrimSpace(value)

	switch key {
	case "DB_NAME":
		env.dbName = value
	case "DB_USERNAME":
		env.dbUsername = value
	case "DB_PASSWORD":
		env.dbPassword = value
	case "CLIENT_PATH":
		env.clientPath = value
	}
}

func DbSet() error {

	cfg := mysql.NewConfig()
	cfg.User = env.dbUsername
	cfg.Passwd = env.dbPassword
	cfg.Net = "tcp"
	cfg.Addr = "127.0.0.1:3306"
	cfg.DBName = env.dbName

	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())

	return err

}

func BandGet(w http.ResponseWriter, r *http.Request) {

	bandName := r.PathValue("name")

	rows, err := db.Query(`
		SELECT members.name 
		FROM members 
		JOIN bands ON bands.id = members.band_id 
		WHERE LOWER(TRIM(bands.name)) = LOWER(TRIM(?))
	`, bandName)

	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}
	defer rows.Close()

	var body []byte = make([]byte, 1024)
	var nextByte int = 1
	var memberCount byte = 0
	var memberName sql.RawBytes

	for rows.Next() {

		err := rows.Scan(&memberName)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var memberNameLen int = len(memberName)

		body[nextByte] = byte(memberNameLen)
		nextByte++

		copy(body[nextByte:], memberName)
		nextByte += memberNameLen
		memberCount++

	}

	err = rows.Err()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	body[0] = memberCount
	body = body[:nextByte]

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/octet-stream")

	var n int
	n, err = w.Write(body)
	log.Println(n)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

// func WeekGet() {

// }
