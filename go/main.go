package main

import (
	"bufio"
	"fmt"
	"os"
	"runtime"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	for {
		input, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		cmd := strings.TrimSpace(input)
		switch cmd {
		case "sysinfo":
			fmt.Printf("OS: %s\nArch: %s\nCPUs: %d\nGo Version: %s\n", runtime.GOOS, runtime.GOARCH, runtime.NumCPU(), runtime.Version())
		case "exit":
			fmt.Println("Exiting...")
			return
		default:
			fmt.Println("Unknown command")
		}
	}
}
