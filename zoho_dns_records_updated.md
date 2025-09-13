# Zoho Mail DNS Configuration for InsightPulseAI
## Updated DKIM Records

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

### DKIM Records

#### Primary DKIM Record (zoho1 selector)
```
Type    Host                                  TXT Record
TXT     zoho1._domainkey.insightpulseai.com   v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAglDw7tBEuqOMubrj8TEYPTSrV8+2O3O8DTLcNvRINtGrdTqY2wjM9vifAAOX7GhLfvUBO54hTXTumuwE4siUvSkYqzWPf6kAnRI7HN/4K8Qm6x+xXWvYKLyxBdwLYXn+GniKVaXlOMx2DU34IOXOyCsLPy8gGTpFpMrfcGDsENZ+WLQxNnHvtLsHkpWN/Wfbf58eUzR6mEkUEAohXkg0JsYtXnV7aWhBOXXTCjvxfRRTPBSDrJVtOhOahE+exCtvj/htmLkNcrkk+YXoAY2CL13sOdZEFPny5rIFpe0no++FluV5GdU5CXAPVVHNeP2iL6NhXuG1VypY1i6dpFIpNQIDAQAB
```

#### Secondary DKIM Record (zoho selector)
```
Type    Host                                TXT Record
TXT     zoho._domainkey.insightpulseai.com  v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmFj2PpxreN9r4Dv8DGdNpqc7VPsbAlDQh64jyTl78NCuXU4bAPHC2JCgeQkSnoxBH19Keewr62iRcsBNnHrz8HwgkbTg8ZwooC+Bd18Z9M4ZSwBD1IK53/lUKPMHmBAPoamo2COYKG+hmRvtxeJa3ZuX1Z9Hc2hYULEXg3pus9Su34FfD/GYb43ZaqSFqth4Qt14jOfBbX4lqAZJop2iwKRQCX00CBKugVHs/heVGnsBNKIqYMVgM9gtI0P2H81gxDlvisygCQVuuEHLHVmsx0UGBL+z3b4bMvaReWY66Otv2tUKP2rOssZCx9ZbtMrPJgx2xYv/tvtoQDi9A2pGBQIDAQAB
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

## ✅ Updated DNS Configuration

The InsightPulseAI domain now has multiple DKIM signatures configured for enhanced email deliverability and security:

1. The primary DKIM key using the `zoho1` selector
2. The secondary DKIM key using the `zoho` selector

Having multiple DKIM keys provides:
- Improved deliverability across email providers
- Redundancy in case one key is compromised
- Enhanced security for different email streams

## 🔍 Verification

To verify that both DKIM records are properly configured, you can use these DNS lookup commands:

```bash
dig zoho1._domainkey.insightpulseai.com TXT
dig zoho._domainkey.insightpulseai.com TXT
```

Both records should return the configured DKIM public keys.

## 📌 Recommendation

With multiple DKIM keys in place, it's recommended to:

1. Monitor email deliverability metrics
2. Regularly verify both DKIM keys are active
3. Consider rotating keys annually for enhanced security
4. Ensure proper alignment with your DMARC policy

## 📋 Next Steps

These updated DNS records have been documented and should be verified in the Zoho Mail Admin Console to ensure they are correctly recognized by the email system.