package utils

import (
	"bufio"
	"io"
	"os"
	"strings"
)

type Environment struct {
	DbName     string
	DbUsername string
	DbPassword string
	ClientPath string
}

var Env Environment

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
		Env.DbName = value
	case "DB_USERNAME":
		Env.DbUsername = value
	case "DB_PASSWORD":
		Env.DbPassword = value
	case "CLIENT_PATH":
		Env.ClientPath = value
	}
}
