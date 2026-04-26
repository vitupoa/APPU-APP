$content = Get-Content 'c:\Users\ADMIN\Krieta\backend\prisma\schema.prisma' -Raw
$content = $content.Substring(13)
Set-Content 'c:\Users\ADMIN\Krieta\backend\prisma\schema.prisma' -Value $content
