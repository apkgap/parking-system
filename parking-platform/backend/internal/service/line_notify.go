package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type LineNotifyService struct {
	accessToken string
	staffGroup  string
	httpClient  *http.Client
}

func NewLineNotifyService(accessToken, staffGroup string) *LineNotifyService {
	return &LineNotifyService{
		accessToken: accessToken,
		staffGroup:  staffGroup,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *LineNotifyService) PushText(ctx context.Context, to string, message string) error {
	if s.accessToken == "" || to == "" {
		return nil
	}
	payload := map[string]any{
		"to": to,
		"messages": []map[string]string{
			{"type": "text", "text": message},
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.line.me/v2/bot/message/push", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("line push failed with status %d", resp.StatusCode)
	}
	return nil
}

func (s *LineNotifyService) NotifyStaff(ctx context.Context, message string) error {
	return s.PushText(ctx, s.staffGroup, message)
}
