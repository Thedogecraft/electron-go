package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemInfo struct {
	OS       string  `json:"os"`
	Arch     string  `json:"arch"`
	CPUs     int     `json:"cores"`
	GoVer    string  `json:"goVersion"`
	CPUUsage float64 `json:"cpu"`
	Memory   string  `json:"memory"`
	Disk     string  `json:"disk"`
	Uptime   string  `json:"uptime"`
}

type Command struct {
	Action  string                 `json:"action"`
	Options map[string]interface{} `json:"options,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func getSystemInfo() SystemInfo {
	percent, _ := cpu.Percent(0, false)
	cpuUsage := 0.0
	if len(percent) > 0 {
		cpuUsage = percent[0]
	}

	vmStat, _ := mem.VirtualMemory()
	memUsage := fmt.Sprintf("%.2f%% (Used %v MB / Total %v MB)",
		vmStat.UsedPercent,
		vmStat.Used/1024/1024,
		vmStat.Total/1024/1024,
	)

	diskStat, _ := disk.Usage("/")
	diskUsage := "N/A"
	if diskStat != nil {
		diskUsage = fmt.Sprintf("%.2f%% (Used %.1f GB / Total %.1f GB)",
			diskStat.UsedPercent,
			float64(diskStat.Used)/1024/1024/1024,
			float64(diskStat.Total)/1024/1024/1024,
		)
	}

	uptime := fmt.Sprintf("%.0f seconds", float64(time.Now().Unix()%100000))

	return SystemInfo{
		OS:       runtime.GOOS,
		Arch:     runtime.GOARCH,
		CPUs:     runtime.NumCPU(),
		GoVer:    runtime.Version(),
		CPUUsage: cpuUsage,
		Memory:   memUsage,
		Disk:     diskUsage,
		Uptime:   uptime,
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Println("WebSocket connection established")

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		log.Println("Received message:", string(msg))

		var cmd Command
		if err := json.Unmarshal(msg, &cmd); err != nil {
			log.Println("Invalid command JSON:", err, "Message:", string(msg))
			continue
		}

		log.Println("Processing command:", cmd.Action)

		switch cmd.Action {
		case "get-system-info":
			info := getSystemInfo()
			// Format the response with type field
			response := map[string]interface{}{
				"type":   "system-info",
				"os":     info.OS,
				"cpu":    fmt.Sprintf("%.1f%%", info.CPUUsage),
				"cores":  fmt.Sprintf("%d cores", info.CPUs),
				"memory": info.Memory,
				"disk":   info.Disk,
				"uptime": info.Uptime,
			}

			jsonData, err := json.Marshal(response)
			if err != nil {
				log.Println("Error marshaling system info:", err)
				return
			}
			log.Println("Sending system info:", string(jsonData))
			if err := conn.WriteMessage(websocket.TextMessage, jsonData); err != nil {
				log.Println("Write error:", err)
			}
		case "clean-temp":
			log.Println("Cleaning temp folder...", cmd.Options)
		case "clear-recycle-bin":
			log.Println("Clearing recycle bin...")
		default:
			log.Println("Unknown action:", cmd.Action)
		}
	}
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	fmt.Println("WebSocket server running at ws://localhost:51820/ws")
	log.Fatal(http.ListenAndServe(":51820", nil))
}
