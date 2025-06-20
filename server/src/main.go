package main

import (
	"log"
	"net/http"

	"github.com/cheeem/practicescheduler/routes"
	"github.com/cheeem/practicescheduler/utils"
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

func main() {
	var err error

	err = utils.EnvSet()
	if err != nil {
		log.Fatal(err)
	}

	err = utils.DbSet()
	if err != nil {
		log.Fatal(err)
	}

	var mux *http.ServeMux = http.NewServeMux()

	var client http.Handler = http.FileServer(http.Dir(utils.Env.ClientPath))

	mux.Handle("GET /", client)
	mux.HandleFunc("GET /band/{name}", routes.BandGet)

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
