import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  id: string
  email: string
  name: string
  role: string
  exp: number
  iat: number
}

class AuthService {
  private readonly TOKEN_KEY = 'scout_auth_token'
  private readonly REFRESH_TOKEN_KEY = 'scout_refresh_token'

  // Store token securely
  setToken(token: string): void {
    try {
      // Validate token before storing
      const payload = this.decodeToken(token)
      if (payload && !this.isTokenExpired(token)) {
        localStorage.setItem(this.TOKEN_KEY, token)
      }
    } catch (error) {
      console.error('Invalid token:', error)
      throw new Error('Invalid authentication token')
    }
  }

  // Get stored token
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY)
    
    // Check if token exists and is not expired
    if (token && !this.isTokenExpired(token)) {
      return token
    }
    
    // Clear expired token
    if (token) {
      this.clearToken()
    }
    
    return null
  }

  // Set refresh token
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token)
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  // Clear all tokens
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }

  // Decode JWT token
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token)
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token)
      if (!payload || !payload.exp) {
        return true
      }
      
      // Check if token is expired (with 5 minute buffer)
      const expirationTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const buffer = 5 * 60 * 1000 // 5 minutes
      
      return currentTime > (expirationTime - buffer)
    } catch (error) {
      return true
    }
  }

  // Get user info from token
  getCurrentUser(): TokenPayload | null {
    const token = this.getToken()
    if (!token) {
      return null
    }
    
    return this.decodeToken(token)
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Check if user has required role
  hasRole(requiredRoles: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user) {
      return false
    }
    
    return requiredRoles.includes(user.role)
  }

  // Get authorization header
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken()
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    const token = localStorage.getItem(this.TOKEN_KEY)
    const refreshToken = this.getRefreshToken()
    
    if (!token || !refreshToken) {
      return false
    }
    
    if (this.isTokenExpired(token)) {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
        
        if (response.ok) {
          const data = await response.json()
          this.setToken(data.token)
          if (data.refreshToken) {
            this.setRefreshToken(data.refreshToken)
          }
          return true
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }
    
    return false
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export utility functions
export const isAuthenticated = () => authService.isAuthenticated()
export const getCurrentUser = () => authService.getCurrentUser()
export const hasRole = (roles: string[]) => authService.hasRole(roles)
export const getAuthHeader = () => authService.getAuthHeader()