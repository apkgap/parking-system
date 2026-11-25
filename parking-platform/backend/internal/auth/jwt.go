package auth

import (
	"crypto/md5"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(secret, userID, email, role string, ttlMinutes int) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(ttlMinutes) * time.Minute)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(hash), err
}

// VerifyPassword supports both modern bcrypt and legacy WordPress phpass ($P$ / $H$) hashes.
// Returns (matched, needsRehash).
func VerifyPassword(plain, storedHash, algo string) (bool, bool) {
	if algo == "bcrypt" || strings.HasPrefix(storedHash, "$2a$") || strings.HasPrefix(storedHash, "$2y$") || strings.HasPrefix(storedHash, "$2b$") {
		normalized := strings.Replace(storedHash, "$2y$", "$2a$", 1)
		err := bcrypt.CompareHashAndPassword([]byte(normalized), []byte(plain))
		return err == nil, strings.HasPrefix(storedHash, "$2y$")
	}
	if strings.HasPrefix(storedHash, "$P$") || strings.HasPrefix(storedHash, "$H$") {
		return verifyWPPhpass(plain, storedHash), true
	}
	return false, false
}

const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

func verifyWPPhpass(password, storedHash string) bool {
	if len(storedHash) < 12 {
		return false
	}
	countLog2 := strings.IndexByte(itoa64, storedHash[3])
	if countLog2 < 7 || countLog2 > 30 {
		return false
	}
	count := 1 << countLog2
	salt := storedHash[4:12]

	sum := md5.Sum([]byte(salt + password))
	hash := sum[:]
	for i := 0; i < count; i++ {
		next := md5.Sum(append(hash, []byte(password)...))
		hash = next[:]
	}
	encoded := storedHash[:12] + encode64(hash, 16)
	return encoded == storedHash
}

func encode64(input []byte, count int) string {
	var out strings.Builder
	for i := 0; i < count; {
		val := int(input[i])
		i++
		out.WriteByte(itoa64[val&0x3f])
		if i < count {
			val |= int(input[i]) << 8
		}
		out.WriteByte(itoa64[(val>>6)&0x3f])
		if i >= count {
			break
		}
		i++
		if i < count {
			val |= int(input[i]) << 16
		}
		out.WriteByte(itoa64[(val>>12)&0x3f])
		if i >= count {
			break
		}
		i++
		out.WriteByte(itoa64[(val>>18)&0x3f])
	}
	return out.String()
}

var ErrUnauthorized = errors.New("unauthorized")
