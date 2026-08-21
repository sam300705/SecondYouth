# SecondYouth custom domain

`vridhcare.in` is attached to the SecondYouth Production project on Vercel. The apex domain redirects to `https://www.vridhcare.in/` with HTTP 308, and both HTTPS endpoints currently return successful responses from Vercel.

## DNS configuration

Hostinger is authoritative for the domain through `ns1.dns-parking.com` and `ns2.dns-parking.com`. The existing Hostinger records are compatible with Vercel’s supported legacy configuration:

| Type | Name | Value | Status |
| --- | --- | --- | --- |
| CNAME | `www` | `cname.vercel-dns.com` | Verified in Hostinger |
| A | `@` | `76.76.21.21` | Supported legacy Vercel record; live HTTPS verification passed |

Vercel currently recommends the newer apex record `A @ 216.198.79.1`, but its domain verification explicitly confirms that the legacy `76.76.21.21` record continues to work. Because the domain is already serving the application successfully, the existing record was left unchanged to avoid an unnecessary DNS interruption. Vercel is responsible for the SSL certificate on the attached domain.

## Portfolio

The portfolio project card and README link SecondYouth’s primary live site to [vridhcare.in](https://vridhcare.in), while retaining the Vercel deployment and [GitHub repository](https://github.com/sam300705/SecondYouth) links.
