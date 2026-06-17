import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { 
  registerSchema, 
  loginSchema, 
  oauthSchema, 
  refreshTokenSchema, 
  logoutSchema,
  checkUsernameSchema
} from './auth.validation.js';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(401).json({ error: error.message });
      }
    }
  }

  static async oauthLogin(req: Request, res: Response) {
    try {
      const data = oauthSchema.parse(req.body);
      const result = await AuthService.oauthLogin(data);
      res.status(result.isNewUser ? 201 : 200).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        try {
          // Check if error is our custom JSON error for OAUTH_INCOMPLETE / USERNAME_COLLISION
          const parsed = JSON.parse(error.message);
          if (parsed.code) {
             res.status(400).json(parsed);
             return;
          }
        } catch { } // If not JSON parseable, it's a standard error
        
        res.status(401).json({ error: error.message });
      }
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const data = refreshTokenSchema.parse(req.body);
      const result = await AuthService.refreshToken({
        refresh_token: data.refresh_token,
        deviceId: data.device_id
      });
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(401).json({ error: error.message });
      }
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const data = logoutSchema.parse(req.body);
      await AuthService.logout({
        refresh_token: data.refresh_token,
        deviceId: data.device_id
      });
      // Add cache control headers to ensure client clears all cached data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async checkUsername(req: Request, res: Response) {
    try {
      const data = checkUsernameSchema.parse(req.query);
      // Wait we actually need to just check suggestions for availability
      const suggestions = await AuthService.suggestUsernames(data.username);
      // If the exact username they asked for is in suggestions, it's available!
      // But if the first suggestion is NOT exact match, it means it was taken.
      const isAvailable = suggestions[0] === data.username;

      res.status(200).json({
        username: data.username,
        isAvailable,
        suggestions: isAvailable ? [] : suggestions
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
