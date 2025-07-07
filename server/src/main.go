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

	// root
	mux.Handle("GET /", client)
	// band
	mux.HandleFunc("POST /band/new/{memberId}", routes.BandNew)
	mux.HandleFunc("GET /band/members/get/{bandId}", routes.BandMembersGet)
	mux.HandleFunc("POST /band/members/add/{bandId}/{memberId}", routes.BandMembersAdd)
	mux.HandleFunc("DELETE /band/members/remove/{bandId}/{memberId}", routes.BandMembersRemove)
	// member
	mux.HandleFunc("POST /member/new", routes.MemberNew)
	mux.HandleFunc("GET /member/id/get/{memberName}", routes.MemberIdGet)
	mux.HandleFunc("GET /member/bands/get/{memberId}", routes.MemberBandsGet)
	mux.HandleFunc("PATCH /member/name/set/{memberId}", routes.MemberNameSet)
	mux.HandleFunc("DELETE /member/bands/leave/{memberId}/{bandId}", routes.MemberBandLeave)
	// week
	mux.HandleFunc("GET /week/get/{bandId}/", routes.WeekGet)         // TODO: add month for UI
	mux.HandleFunc("GET /week/get/{bandId}/{offset}", routes.WeekGet) // TODO: add month for UI
	mux.HandleFunc("PATCH /week/set/{bandId}/{memberId}/{week}/{year}", routes.WeekSet)

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

// func stripTrailingSlashMiddleware(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		if r.URL.Path != "/" && strings.HasSuffix(r.URL.Path, "/") {
// 			// Redirect to the same path without the trailing slash
// 			http.Redirect(w, r, strings.TrimSuffix(r.URL.Path, "/"), http.StatusMovedPermanently)
// 			return
// 		}
// 		next.ServeHTTP(w, r)
// 	})
// }
