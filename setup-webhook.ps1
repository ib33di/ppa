# PowerShell script to setup AdWhats webhook
# Usage: .\setup-webhook.ps1 -ApiToken "YOUR_TOKEN"
# Or set $env:ADWHATS_API_TOKEN before running

param(
    [string]$ApiToken = $env:ADWHATS_API_TOKEN,
    [int]$AccountId = 8249,
    [string]$WebhookUrl = "https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp",
    [string]$WebhookToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZfdG9rZW4iOiJlNGFiNGNlNS1kNTRiLTQxNDUtOTA2ZC1kNzZhYzc1NGY3MDgiLCJpYXQiOjE3Njc0ODA4MjksImV4cCI6MTc5OTAxNjgyOX0.USibzSRHChv2KhoFMmZscxhnECmKz-38aiBhYjssqyI"
)

if (-not $ApiToken -or $ApiToken -eq "YOUR_ADWHATS_API_TOKEN") {
    Write-Host "Error: AdWhats API Token is required!" -ForegroundColor Red
    Write-Host "Usage: .\setup-webhook.ps1 -ApiToken 'YOUR_TOKEN'" -ForegroundColor Yellow
    Write-Host "Or set environment variable: `$env:ADWHATS_API_TOKEN = 'YOUR_TOKEN'" -ForegroundColor Yellow
    exit 1
}

$body = @{
    whatsapp_account_id = $AccountId
    url = $WebhookUrl
    webhook_token = $WebhookToken
} | ConvertTo-Json

$headers = @{
    "token" = $ApiToken
    "Content-Type" = "application/json"
}

Write-Host "`n=== Setting up AdWhats Webhook ===" -ForegroundColor Cyan
Write-Host "Account ID: $AccountId" -ForegroundColor White
Write-Host "Webhook URL: $WebhookUrl" -ForegroundColor White
Write-Host "API Token: $($ApiToken.Substring(0, [Math]::Min(20, $ApiToken.Length)))..." -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://api.adwhats.net/webhooks/set" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✓ Success! Webhook setup completed." -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    Write-Host "`n✓ Webhook is now configured!" -ForegroundColor Green
    Write-Host "  Test it by sending 'YES' from WhatsApp to your AdWhats number." -ForegroundColor Yellow
} catch {
    Write-Host "`n✗ Error setting up webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetails:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nResponse Body:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
    exit 1
}
