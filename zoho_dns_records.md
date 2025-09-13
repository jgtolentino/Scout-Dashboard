# Zoho Mail DNS Configuration for InsightPulseAI

## ✅ Required DNS Records

### MX Records
```
Priority    Host                    Points to
10          insightpulseai.com      mx.zoho.com
20          insightpulseai.com      mx2.zoho.com
50          insightpulseai.com      mx3.zoho.com
```

### SPF Record
```
Type    Host                TXT Record
TXT     insightpulseai.com  v=spf1 include:zohomail.com ~all
```

### DKIM Record
```
Type    Host                                  TXT Record
TXT     zoho1-insightpulseai.com             v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAglDw7tBEuqOMubrj8TEYPTSrV8+2O3O8DTLcNvRINtGrdTqY2wjM9vifAAOX7GhLfvUBO54hTXTumuwE4siUvSkYqzWPf6kAnRI7HN/4K8Qm6x+xXWvYKLyxBdwLYXn+GniKVaXlOMx2DU34IOXOyCsLPy8gGTpFpMrfcGDsENZ+WLQxNnHvtLsHkpWN/Wfbf58eUzR6mEkUEAohXkg0JsYtXnV7aWhBOXXTCjvxfRRTPBSDrJVtOhOahE+exCtvj/htmLkNcrkk+YXoAY2CL13sOdZEFPny5rIFpe0no++FluV5GdU5CXAPVVHNeP2iL6NhXuG1VypY1i6dpFIpNQIDAQAB
```

### Domain Verification Record
```
Type    Host                TXT Record
TXT     insightpulseai.com  zoho-verification=zb93127941.zmverify.zoho.com
```

### DMARC Record (Recommended)
```
Type    Host                        TXT Record
TXT     _dmarc.insightpulseai.com   v=DMARC1; p=quarantine; rua=mailto:dmarc@insightpulseai.com
```

## ✅ Current Status

| Record Type | Status | Notes |
|-------------|--------|-------|
| MX Records | ✅ Configured | Verified via dig |
| SPF Record | ✅ Configured | Verified via dig |
| DKIM Record | ✅ Updated | Added from user input |
| Domain Verification | ✅ Configured | Verified via dig |
| DMARC Record | ⚠️ Unknown | Recommended to add |

## 🔍 Verification

DNS propagation may take up to 48 hours. After the records have propagated, verify your DNS settings in the Zoho Mail Admin Console.

## 📌 Next Steps

1. Confirm in Zoho Mail Admin Console that all records are validated
2. Test email delivery and ensure proper DKIM signing
3. Consider adding the recommended DMARC record for enhanced security