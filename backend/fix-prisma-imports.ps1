Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "from ['\"]\.\.\/generated\/prisma\/client\.js['\"]", "from '@prisma/client'"
    $newContent = $newContent -replace "from ['\"]\.\.\/\.\.\/generated\/prisma\/client\.js['\"]", "from '@prisma/client'"
    $newContent = $newContent -replace "from ['\"]\.\.\/\.\.\/\.\.\/generated\/prisma\/client\.js['\"]", "from '@prisma/client'"
    Set-Content -Path $_.FullName -Value $newContent -NoNewline
}
Write-Host "Fixed all Prisma imports"
