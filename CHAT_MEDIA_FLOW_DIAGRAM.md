# Chat Media Upload - Visual Flow Diagram

## 🔄 Complete Upload Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER SELECTS FILE                                │
│                    (Photo, Video, or PDF)                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE VALIDATION                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Check file type (JPEG, PNG, GIF, WebP, MP4, WebM, PDF)        │   │
│  │ ✓ Check file size (10MB/100MB/20MB limits)                      │   │
│  │ ✓ Check extension (block .exe, .bat, .js, etc.)                 │   │
│  │ ✓ Show preview to user                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              REQUEST UPLOAD SIGNATURE FROM BACKEND                       │
│                                                                          │
│  POST /api/v1/chat/:chatId/media/signature                              │
│  {                                                                       │
│    "mediaType": "image",                                                │
│    "resourceType": "image"                                              │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND AUTHORIZATION CHECK                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Verify JWT token                                              │   │
│  │ ✓ Check user is participant in chat                             │   │
│  │ ✓ Determine correct folder (Direct/Group/Chama)                 │   │
│  │ ✓ Generate signed upload parameters                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RECEIVE UPLOAD SIGNATURE                              │
│  {                                                                       │
│    "signature": "abc123...",                                            │
│    "timestamp": 1234567890,                                             │
│    "folder": "Krieta/Chats/Direct/Images",                              │
│    "apiKey": "your_api_key",                                            │
│    "cloudName": "your_cloud"                                            │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  UPLOAD DIRECTLY TO CLOUDINARY                           │
│                                                                          │
│  POST https://api.cloudinary.com/v1_1/{cloud}/image/upload              │
│  FormData:                                                               │
│    - file: [binary data]                                                │
│    - signature: "abc123..."                                             │
│    - timestamp: 1234567890                                              │
│    - folder: "Krieta/Chats/Direct/Images"                               │
│    - api_key: "your_api_key"                                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDINARY PROCESSES FILE                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Validates signature                                            │   │
│  │ ✓ Stores file in specified folder                               │   │
│  │ ✓ Generates secure URL                                          │   │
│  │ ✓ Returns upload response                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RECEIVE CLOUDINARY URL                                │
│  {                                                                       │
│    "secure_url": "https://res.cloudinary.com/.../image.jpg",            │
│    "public_id": "Krieta/Chats/Direct/Images/abc123",                    │
│    "format": "jpg",                                                     │
│    "resource_type": "image"                                             │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  VALIDATE URL WITH BACKEND                               │
│                                                                          │
│  POST /api/v1/chat/media/validate                                       │
│  {                                                                       │
│    "mediaUrl": "https://res.cloudinary.com/.../image.jpg",              │
│    "mediaType": "image"                                                 │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SECURITY VALIDATION                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Verify URL is from Cloudinary                                 │   │
│  │ ✓ Verify URL uses HTTPS                                         │   │
│  │ ✓ Check for XSS patterns                                        │   │
│  │ ✓ Verify URL is from allowed chat folder                        │   │
│  │ ✓ Sanitize URL (remove query params)                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RECEIVE SANITIZED URL                                 │
│  {                                                                       │
│    "success": true,                                                     │
│    "sanitizedUrl": "https://res.cloudinary.com/.../image.jpg",          │
│    "mediaType": "image"                                                 │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEND MESSAGE WITH MEDIA                               │
│                                                                          │
│  POST /api/v1/chat/:chatId/messages                                     │
│  {                                                                       │
│    "payload": "Check out this photo!",                                  │
│    "mediaUrl": "https://res.cloudinary.com/.../image.jpg",              │
│    "mediaType": "image"                                                 │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND MESSAGE PROCESSING                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Verify user is participant                                    │   │
│  │ ✓ Validate media URL again                                      │   │
│  │ ✓ Sanitize payload (10,000 char limit)                          │   │
│  │ ✓ Save message to database                                      │   │
│  │ ✓ Broadcast via WebSocket                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MESSAGE DELIVERED TO RECIPIENTS                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ • Real-time via WebSocket                                        │   │
│  │ • Message includes media URL                                     │   │
│  │ • Recipients can view/download media                             │   │
│  │ • Media stored permanently in Cloudinary                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🛡️ Security Checkpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 1: CLIENT-SIDE VALIDATION                                        │
│  ├─ File type check                                                     │
│  ├─ File size check                                                     │
│  └─ Extension check                                                     │
│                                                                          │
│  Layer 2: AUTHORIZATION                                                 │
│  ├─ JWT token verification                                              │
│  ├─ Participant check                                                   │
│  └─ Folder permission check                                             │
│                                                                          │
│  Layer 3: CLOUDINARY VALIDATION                                         │
│  ├─ Signature verification                                              │
│  ├─ Folder enforcement                                                  │
│  └─ File processing                                                     │
│                                                                          │
│  Layer 4: URL VALIDATION                                                │
│  ├─ Cloudinary domain check                                             │
│  ├─ HTTPS enforcement                                                   │
│  ├─ XSS pattern detection                                               │
│  ├─ Folder verification                                                 │
│  └─ URL sanitization                                                    │
│                                                                          │
│  Layer 5: MESSAGE VALIDATION                                            │
│  ├─ Participant re-check                                                │
│  ├─ Media URL re-validation                                             │
│  ├─ Payload sanitization                                                │
│  └─ Length limits                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Folder Structure

```
Cloudinary Storage
│
└── Krieta/
    └── Chats/
        ├── Direct/
        │   ├── Images/
        │   │   └── [user uploads]
        │   └── Videos/
        │       └── [user uploads]
        │
        ├── Group/
        │   ├── Images/
        │   │   └── [group uploads]
        │   └── Videos/
        │       └── [group uploads]
        │
        ├── Chama/
        │   ├── Images/
        │   │   └── [chama uploads]
        │   └── Videos/
        │       └── [chama uploads]
        │
        └── GroupAvatar/
            └── Images/
                └── [group avatars]
```

## 🔐 Security Decision Tree

```
                    User Uploads File
                           │
                           ▼
                  Is file type allowed?
                    /            \
                  NO              YES
                  │                │
                  ▼                ▼
              REJECT         Is file size OK?
                              /          \
                            NO            YES
                            │              │
                            ▼              ▼
                        REJECT      Is extension safe?
                                      /          \
                                    NO            YES
                                    │              │
                                    ▼              ▼
                                REJECT      Is user participant?
                                              /          \
                                            NO            YES
                                            │              │
                                            ▼              ▼
                                        REJECT      Generate Signature
                                                           │
                                                           ▼
                                                    Upload to Cloudinary
                                                           │
                                                           ▼
                                                    Is URL from Cloudinary?
                                                      /          \
                                                    NO            YES
                                                    │              │
                                                    ▼              ▼
                                                REJECT      Is URL HTTPS?
                                                              /          \
                                                            NO            YES
                                                            │              │
                                                            ▼              ▼
                                                        REJECT      Contains XSS?
                                                                      /          \
                                                                    YES           NO
                                                                    │              │
                                                                    ▼              ▼
                                                                REJECT      Is folder correct?
                                                                              /          \
                                                                            NO            YES
                                                                            │              │
                                                                            ▼              ▼
                                                                        REJECT         ACCEPT
                                                                                          │
                                                                                          ▼
                                                                                   Save Message
```

## 🎯 Component Interaction

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Mobile     │◄───────►│   Backend    │◄───────►│  Cloudinary  │
│     App      │         │     API      │         │              │
│              │         │              │         │              │
└──────┬───────┘         └──────┬───────┘         └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│              │         │              │
│  Local File  │         │  PostgreSQL  │
│   Storage    │         │   Database   │
│              │         │              │
└──────────────┘         └──────────────┘

Flow:
1. Mobile App → Backend: Request signature
2. Backend → Mobile App: Return signature
3. Mobile App → Cloudinary: Upload file
4. Cloudinary → Mobile App: Return URL
5. Mobile App → Backend: Validate URL
6. Backend → Mobile App: Return sanitized URL
7. Mobile App → Backend: Send message
8. Backend → Database: Save message
9. Backend → Mobile App: Broadcast message
```

## 📊 Data Flow

```
User Input                Backend Processing              Storage
─────────                 ──────────────────              ───────

[File]                    
  │                       
  ├─► [Validate Type]     
  │                       
  ├─► [Validate Size]     
  │                       
  └─► [Check Extension]   
                          
[Request Signature]       
  │                       
  └─► [Auth Check] ──────► [JWT Verify]
      │                    
      └─► [Participant?] ─► [Database Query]
          │                 
          └─► [Generate] ──► [Cloudinary Sign]
                            
[Upload File]             
  │                       
  └─► [Cloudinary] ──────────────────────► [Cloud Storage]
      │                                     
      └─► [Return URL]                     
                          
[Validate URL]            
  │                       
  ├─► [Domain Check]      
  │                       
  ├─► [HTTPS Check]       
  │                       
  ├─► [XSS Check]         
  │                       
  └─► [Folder Check]      
                          
[Send Message]            
  │                       
  ├─► [Auth Check]        
  │                       
  ├─► [URL Validate]      
  │                       
  ├─► [Sanitize]          
  │                       
  └─► [Save] ────────────────────────────► [PostgreSQL]
      │                                     
      └─► [Broadcast] ──────────────────► [WebSocket]
```

---

**Visual Guide Version**: 1.0
**Last Updated**: 2024
**Status**: ✅ Complete
