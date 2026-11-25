package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TwoC2PService struct {
	env        string
	merchantID string
	secretKey  string
	returnURL  string
	webhookURL string
}

func NewTwoC2PService(env, merchantID, secretKey, returnURL, webhookURL string) *TwoC2PService {
	return &TwoC2PService{
		env:        env,
		merchantID: merchantID,
		secretKey:  secretKey,
		returnURL:  returnURL,
		webhookURL: webhookURL,
	}
}

type PaymentTokenRequest struct {
	InvoiceNo   string
	Description string
	Amount      float64
	Currency    string
}

type PaymentTokenResponse struct {
	PaymentToken string `json:"paymentToken"`
	WebPayURL    string `json:"webPaymentUrl"`
}

func (s *TwoC2PService) endpoint() string {
	if s.env == "production" {
		return "https://pgw.2c2p.com/payment/4.3/paymentToken"
	}
	return "https://sandbox-pgw.2c2p.com/payment/4.3/paymentToken"
}

// CreatePaymentToken signs the 2C2P PGW v4.3 JWT payload and requests a paymentToken.
func (s *TwoC2PService) CreatePaymentToken(_ context.Context, req PaymentTokenRequest) (*PaymentTokenResponse, error) {
	if s.merchantID == "" || s.secretKey == "" {
		return nil, fmt.Errorf("2c2p merchant credentials not configured (endpoint: %s)", s.endpoint())
	}

	claims := jwt.MapClaims{
		"merchantID":         s.merchantID,
		"invoiceNo":          req.InvoiceNo,
		"description":        req.Description,
		"amount":             req.Amount,
		"currencyCode":       req.Currency,
		"frontendReturnUrl":  s.returnURL,
		"backendReturnUrl":   s.webhookURL,
		"iat":                time.Now().Unix(),
	}
	signedPayload, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.secretKey))
	if err != nil {
		return nil, err
	}

	// TODO: POST {"payload": signedPayload} to s.endpoint() and decode JWT response.
	return &PaymentTokenResponse{
		PaymentToken: signedPayload,
		WebPayURL:    s.endpoint(),
	}, nil
}
