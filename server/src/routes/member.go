package routes

import (
	"context"
	"database/sql"
	"encoding/binary"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/cheeem/practicescheduler/utils"
)

// TODO: add nickname
func MemberNew(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()

	var err error

	var buf []byte

	buf, err = io.ReadAll(r.Body)

	if err != nil || len(buf) > 255 {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var memberName string = string(buf)

	var query string = `INSERT INTO (name) VALUES (?)`

	_, err = utils.Db.ExecContext(ctx, query, memberName)

	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

}

// format:
//
//	uint32 id
func MemberIdGet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var memberName string = r.PathValue("memberId")

	var memberId uint32

	var query string = `
		SELECT member.id 
		WHERE LOWER(member.id) = LOWER(?)
	`

	err = utils.Db.QueryRowContext(ctx, query, memberName).Scan(&memberId)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/octet-stream")

	// TODO: check if using a base array and creating slice views from it is an anti-pattern
	var buf [4]byte

	binary.BigEndian.PutUint32(buf[:], memberId)

	var n int
	n, err = w.Write(buf[:])

	log.Println(n, "bytes written")

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

// format:
//
//	byte bandCount
//	[]bands
//		uint32 id
//		byte len
//		[]byte name
func MemberBandsGet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var memberIdString string = r.PathValue("bandId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var query string = `
		SELECT bands.id, bands.name
		FROM bands 
		INNER JOIN ON member_bands ON member_bands.band_id = bands.id
		WHERE member_bands.member_id = ? 
	`

	var rows *sql.Rows
	rows, err = utils.Db.QueryContext(ctx, query, memberId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	defer rows.Close()

	var buf []byte = make([]byte, 0, 256) // add checks to see if nextByte exceeds 256 and resize??
	var nextByte int = 1
	var bandCount byte = 0
	var bandId uint32
	var bandName sql.RawBytes

	for rows.Next() {

		err := rows.Scan(&bandId, &bandName)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var memberNameLen int = len(bandName)

		binary.BigEndian.PutUint32(buf[nextByte:], bandId)
		nextByte += 4

		buf[nextByte] = byte(memberNameLen)
		nextByte++

		copy(buf[nextByte:], bandName)
		nextByte += memberNameLen
		bandCount++

	}

	err = rows.Err()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	buf[0] = bandCount
	var body []byte = buf[:nextByte]

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/octet-stream")

	var n int
	n, err = w.Write(body)
	log.Println(n, "bytes written")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}

}

func MemberNameSet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var memberIdString string = r.PathValue("bandId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var buf []byte
	buf, err = io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var memberName string = string(buf)

	var query string = `
		UPDATE members 
		SET name = ?
		WHERE id = ?
	`

	_, err = utils.Db.ExecContext(ctx, query, memberName, memberId)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
	}

}

func MemberBandLeave(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var memberIdString string = r.PathValue("bandId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var query string = `
		DELETE FROM band_members 
		WHERE member_id = ?
		AND band_id = ? 
	`

	_, err = utils.Db.ExecContext(ctx, query, memberId, bandId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}
