package routes

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/cheeem/practicescheduler/utils"
)

// create db in "utils" or another package to fix circular dependency

func BandGet(w http.ResponseWriter, r *http.Request) {

	bandName := r.PathValue("name")

	rows, err := utils.Db.Query(`
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
