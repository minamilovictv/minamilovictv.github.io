# Redirect stubs for renamed pages

Four pages were renamed after their old URLs had been indexed:

| old | new |
|---|---|
| about-accountability.html | wbfdocuments/ |
| projects.html | ourgrantees/ |
| visegrad.html | visegrad-fellowship/ |
| p2p.html | peer-to-peer/ |

**If the site is hosted somewhere that supports real redirects** (Apache,
nginx, Netlify, Cloudflare), use server-side 301s instead — they pass full
ranking signal and are invisible to visitors. Apache example:

    Redirect 301 /about-accountability.html /wbfdocuments/
    Redirect 301 /projects.html            /ourgrantees/
    Redirect 301 /visegrad.html            /visegrad-fellowship/
    Redirect 301 /p2p.html                 /peer-to-peer/

**If it is hosted on GitHub Pages**, which cannot do 301s, copy the four
HTML files in this folder to the site root instead. They redirect instantly
via script, keep the query string and anchor, carry a canonical to the new
URL and are marked noindex, so search engines transfer the page over.

Either way this needs doing before launch — without it those four URLs
return 404 and their search ranking is lost.
