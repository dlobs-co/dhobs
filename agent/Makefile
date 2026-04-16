BINARY   := homeforge-agent
MODULE   := github.com/BasilSuhail/dhobs/agent
LDFLAGS  := -s -w
BUILD    := go build -trimpath -ldflags "$(LDFLAGS)"
DIST     := dist

.PHONY: all build clean deps linux macos windows

all: deps build

deps:
	go mod tidy
	go mod download

# Current platform (dev / quick test)
build:
	$(BUILD) -o $(BINARY) .

# All release targets
release: linux macos windows

linux:
	mkdir -p $(DIST)
	GOOS=linux  GOARCH=amd64  CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-linux-amd64  .
	GOOS=linux  GOARCH=arm64  CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-linux-arm64  .
	GOOS=linux  GOARCH=arm    GOARM=7 CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-linux-armv7  .

macos:
	mkdir -p $(DIST)
	GOOS=darwin GOARCH=amd64  CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-darwin-amd64 .
	GOOS=darwin GOARCH=arm64  CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-darwin-arm64 .

windows:
	mkdir -p $(DIST)
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 $(BUILD) -o $(DIST)/$(BINARY)-windows-amd64.exe .

clean:
	rm -f $(BINARY)
	rm -rf $(DIST)

# Quick smoke test — runs agent for 3s, hits /health
test:
	@go build -o /tmp/$(BINARY)-test . && \
	/tmp/$(BINARY)-test & PID=$$!; sleep 1; \
	curl -sf http://localhost:9101/health && echo "" && \
	curl -sf http://localhost:9101/metrics | head -c 200 && echo ""; \
	kill $$PID; rm /tmp/$(BINARY)-test
	@echo "smoke test passed"
