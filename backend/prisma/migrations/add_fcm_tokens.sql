-- Add FCM token fields to User model
ALTER TABLE "User" ADD COLUMN "fcmToken" TEXT;
ALTER TABLE "User" ADD COLUMN "devicePlatform" TEXT;

-- Create index for faster lookups
CREATE INDEX "User_fcmToken_idx" ON "User"("fcmToken");
