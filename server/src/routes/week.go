package routes

import (
	"context"
	"database/sql"
	"encoding/binary"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/cheeem/practicescheduler/utils"
)

func WeekNew(ctx context.Context, bandId int, week int, year int) (byte, error) {

	var err error
	var rows *sql.Rows

	var query string = `
		SELECT member_id  
		FROM band_members  
		WHERE band_id = ?
	`

	rows, err = utils.Db.QueryContext(ctx, query, bandId)
	if err != nil {
		return 0, err
	}

	defer rows.Close()

	var memberId int
	var memberIds []int = make([]int, 0, 10)
	var memberCount byte

	for rows.Next() {

		err := rows.Scan(&memberId)

		if err != nil {
			return 0, err
		}

		memberIds = append(memberIds, memberId)
		memberCount++

	}

	err = rows.Err()
	if err != nil {
		return 0, err
	}

	if memberCount == 0 { // TODO: turn "nil" into an actual error here
		return 0, nil
	}

	// !!! we might be able to benefit performance from prepared statements
	var queryBuilder strings.Builder
	var bandIds []int = make([]int, memberCount)

	queryBuilder.WriteString("INSERT INTO availability (band_id, member_id, week, year) VALUES (?,")
	//queryBuilder.WriteString(strconv.Itoa(bandId))
	// queryBuilder.WriteByte('?')
	// queryBuilder.WriteByte(',')
	queryBuilder.WriteString(strconv.Itoa(memberIds[0]))
	queryBuilder.WriteByte(',')
	queryBuilder.WriteString(strconv.Itoa(week))
	queryBuilder.WriteByte(',')
	queryBuilder.WriteString(strconv.Itoa(year))
	queryBuilder.WriteByte(')')
	bandIds[0] = bandId

	for i := byte(1); i < memberCount; i++ {
		queryBuilder.WriteString(",(?,")
		// queryBuilder.WriteString(strconv.Itoa(bandId))
		// queryBuilder.WriteByte(',')
		queryBuilder.WriteString(strconv.Itoa(memberIds[i]))
		queryBuilder.WriteByte(',')
		queryBuilder.WriteString(strconv.Itoa(week))
		queryBuilder.WriteByte(',')
		queryBuilder.WriteString(strconv.Itoa(year))
		queryBuilder.WriteByte(')')
		bandIds[i] = bandId
	}

	_, err = utils.Db.ExecContext(ctx, queryBuilder.String(), bandIds)
	if err != nil {
		return 0, err
	}

	return memberCount, nil

}

// format:
//
//	byte week
//	int16 year
//	byte memberCount
//	[7]byte weekdays
//	[7*memberCount]uint32 availability
func WeekGet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var offsetString string = r.PathValue("offset")
	var offset int
	offset, err = strconv.Atoi(offsetString)
	if err != nil {
		offset = 0
	}

	var dt time.Time = time.Now().UTC().AddDate(0, 0, offset*7)

	weekday := dt.Weekday()

	// rollback to monday
	if weekday == time.Sunday {
		dt = dt.AddDate(0, 0, -6)
	} else {
		dt = dt.AddDate(0, 0, -int(weekday)+1)
	}

	year, week := dt.ISOWeek()

	var query string = `
		SELECT 
			day0,
			day1,
			day2,
			day3,
			day4,
			day5,
			day6
		FROM availability 
		WHERE band_id = ? 
		AND week = ? 
		AND year = ? 
		ORDER BY member_id
	`

	rows, err := utils.Db.QueryContext(ctx, query, bandId, week, year)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	defer rows.Close()

	var buf []byte = make([]byte, 0, 256) // add checks to see if nextByte exceeds 256 and resize??
	var nextByte int = 4

	for nextByte < 7 {
		dt = dt.AddDate(0, 0, nextByte)
		buf[nextByte] = byte(dt.Day())
		nextByte++
	}

	var memberCount byte
	var day0 uint32
	var day1 uint32
	var day2 uint32
	var day3 uint32
	var day4 uint32
	var day5 uint32
	var day6 uint32

	for rows.Next() {

		err := rows.Scan(&day0, &day1, &day2, &day3, &day4, &day5, &day6)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		binary.BigEndian.PutUint32(buf[nextByte:], day0)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day1)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day2)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day3)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day4)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day5)
		nextByte += 4
		binary.BigEndian.PutUint32(buf[nextByte:], day6)
		nextByte += 4

		memberCount++

	}

	err = rows.Err()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var weekDoesNotExist bool = memberCount == 0
	if weekDoesNotExist {

		memberCount, err = WeekNew(ctx, bandId, week, year)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var invalidBandName bool = memberCount == 0

		if invalidBandName {
			w.WriteHeader(http.StatusUnprocessableEntity)
			return
		}

		var availabilityBytes int = 7 * 4 * int(memberCount)
		for nextByte < availabilityBytes {
			// TODO: might be able to optimize by setting bytes to integers instead so we spend less time jumping and looping
			buf[nextByte] = 0
			nextByte++
		}
	}

	buf[0] = byte(week)
	binary.BigEndian.PutUint16(buf[1:], uint16(year))
	buf[3] = memberCount
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

func WeekSet(w http.ResponseWriter, r *http.Request) {

	var ctx context.Context = r.Context()
	var err error

	var bandIdString string = r.PathValue("bandId")
	var bandId int
	bandId, err = strconv.Atoi(bandIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var memberIdString string = r.PathValue("memberId")
	var memberId int
	memberId, err = strconv.Atoi(memberIdString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var weekString string = r.PathValue("week")
	var week int
	week, err = strconv.Atoi(weekString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var yearString string = r.PathValue("year")
	var year int
	year, err = strconv.Atoi(yearString)
	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	var availability [7]uint32
	var buf [28]byte
	var n int
	n, err = r.Body.Read(buf[:]) // TODO: change to readfull..?
	if err != nil || n != 4*7 {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	for i := range 7 * 4 {
		availability[i] = binary.BigEndian.Uint32(buf[i:])
	}

	log.Println(availability)

	var query string = `
		UPDATE availability 
		SET 
			day0 = ? 
			day1 = ?
			day2 = ? 
			day3 = ?
			day4 = ? 
			day5 = ?
			day6 = ? 
		WHERE 
			band_id = ?
			member_id = ? 
			week = ? 
			year = ? 
	`

	_, err = utils.Db.ExecContext(ctx, query,
		availability,
		bandId,
		memberId,
		week,
		year,
	)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

}
