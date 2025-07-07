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

func BandNew(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var memberIdString string = r.PathValue("memberId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandNameBuf []byte
	bandNameBuf, err = io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandName string = string(bandNameBuf)

	var query string = `SELECT COUNT(1) FROM bands WHERE name = ?`

	var bandNameExists bool
	err = utils.Db.QueryRowContext(ctx, query, bandName).Scan(&bandNameExists)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}
	if bandNameExists {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var tx *sql.Tx
	tx, err = utils.Db.BeginTx(ctx, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	query = `INSERT INTO bands (name) VALUES (?)`

	var res sql.Result
	res, err = utils.Db.ExecContext(ctx, query, bandName)
	if err != nil {
		_ = tx.Rollback()
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandId int64
	bandId, err = res.LastInsertId()
	if err != nil {
		_ = tx.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	query = `INSERT INTO band_members (band_id, member_id) VALUES (?, ?)`

	_, err = utils.Db.ExecContext(ctx, query, bandId, memberId)
	if err != nil {
		_ = tx.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

// format:
//
//	byte memberCount
//	[]memberName members
//		uint32 id
//		byte len
//		byte[] name
func BandMembersGet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var query string = `
		SELECT members.id, members.name 
		FROM band_members 
		INNER JOIN members ON members.id = band_members.member_id
		WHERE band_members.band_id = ? 
		ORDER BY members.id 
	`

	var rows *sql.Rows
	rows, err = utils.Db.QueryContext(ctx, query, bandId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	defer rows.Close()

	var buf []byte = make([]byte, 256)
	var nextByte int = 1
	var memberCount byte = 0
	var memberId uint32
	var memberName sql.RawBytes

	for rows.Next() {

		err := rows.Scan(&memberId, &memberName)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var memberNameLen int = len(memberName)

		binary.LittleEndian.PutUint32(buf[nextByte:], memberId)
		nextByte += 4

		buf[nextByte] = byte(memberNameLen)
		nextByte++

		copy(buf[nextByte:], memberName)
		nextByte += memberNameLen
		memberCount++

	}

	err = rows.Err()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	buf[0] = memberCount
	var body []byte = buf[:nextByte]

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/octet-stream")

	var n int
	n, err = w.Write(body)
	log.Println(n, "bytes written")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

func BandMembersAdd(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var memberIdString string = r.PathValue("bandId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var query string = `INSERT INTO band_members (band_id, member_id) VALUES (?, ?)`

	_, err = utils.Db.ExecContext(ctx, query, bandId, memberId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

func BandMembersRemove(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var memberIdString string = r.PathValue("bandId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var query string = `
		DELETE FROM band_members 
		WHERE band_id = ? 
		AND member_id = ? 
	`

	_, err = utils.Db.ExecContext(ctx, query, bandId, memberId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}

func BandNameSet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()

	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandNameBuf []byte
	bandNameBuf, err = io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var bandName string = string(bandNameBuf)

	var query string = `
		UPDATE bands 
		SET name = ? 
		WHERE id = ? 
	`

	_, err = utils.Db.ExecContext(ctx, query, bandName, bandId)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

}
