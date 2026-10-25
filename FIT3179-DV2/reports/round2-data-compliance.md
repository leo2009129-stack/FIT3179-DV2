# Round 2 · Data compliance and source combination

## Official requirements

The specification (page 2) says: “Design your visualisation for the average Australian or Malaysian”, depending on campus. Clayton therefore means **the average Australian**. The page explicitly targets everyday Australian readers, assumes no finance background, and defines ASX, ETF, holding, sector, market capitalisation, portfolio weight, median, percentage points and GVA in context.

The data section says: “You must combine data from two different sources.” It does not say that every chart needs two sources, or that merely putting separate sources on one page constitutes a join. This project has substantive combinations, detailed below.

## Chart-by-chart evidence

Stable file IDs are retained. Visible figure numbers now follow reading order.

| Figure | Stable chart ID | Actual source / data | Grain, time, unit and role |
|---:|---|---|---|
| 01 | 01-directory | ASX official directory → industry-counts.json | 2,051 entries, 21 Oct 2026; industry-group count; unclassified categories retained |
| 02 | 04-histogram | BlackRock IOZ + ASX directory exact-code join → asx-ioz-linked.csv → sector-count-vs-weight.json | Same 200 stock holdings, 20 Oct 2026; ASX identities dated 21 Oct. Both percentages use IOZ sectors and the same population; ASX names appear in Tooltip |
| 03 | 02-treemap | BlackRock IOZ → holdings.json / treemap.json | 200 equities; normalised stock-portfolio weights; nested area, not company market cap |
| 04 | 03-concentration | BlackRock IOZ → concentration.json | Cumulative weight of ranked stock holdings; equal-weight comparison |
| 05 | 05-boxplot | BlackRock IOZ → holdings.json | Individual weights grouped by sector; raw weights drive Vega's boxplot |
| 06 | 06-heatmap | BlackRock IOZ → sector-bands.json | 44 cells partition all 200 positions into four individual-weight bands; counts, not combined value |
| 07 | 07-mekko | BlackRock IOZ → mekko.json | Width = sector weight; dark fraction = leading-three weight within sector |
| 08 | 08-history | RBA RDP 2019-04 supplementary graph 11 → historical-composition.json | 409 quarters, 1917 Q1–2019 Q1; Financial / Other / Resources; largest-100 coverage before 1980, whole-exchange thereafter |
| 09 | 12-waterfall | Same frozen RBA series → resources-sector-waterfall.json | Five March-quarter endpoints, 1980/1990/2000/2010/2019; identical whole-exchange population. Totals are percentages; steps are percentage-point changes |
| 10 | 09-choropleth | ABS State Accounts + Natural Earth Admin-1 | Eight regions, 2024–25 current-price Mining GVA / total industry GVA; regional whole-economy context, not ASX company activity |
| 11 | 10-symbols | ASX Foreign Entity Report + Natural Earth anchors + News Corp issuer evidence for deduplication | 30 Sep 2026, 136 securities / 135 named entities / 13 incorporation jurisdictions; not headquarters or all ASX companies |
| 12 | 11-bhp | GA site records + BHP operated-mine disclosure; ASX / IOZ for issuer identity and case selection | Three Copper SA sites, GA coordinates/status 2025, BHP relationship July 2026; one issuer, not three companies |

## Substantive combination 1: Map 11

1. **GA** supplies mine identities (`objectid`, `name`, `state`) and real latitude / longitude. Its data have no issuer / owner field.
2. **BHP** identifies Olympic Dam, Prominent Hill and Carrapateena as its Copper SA operating mines in its 8 July 2026 disclosure. This supplies the company–site relationship only, not independent coordinate verification. The site list is matched to GA by exact mine name plus state; each match has one record. GA object IDs and coordinates are retained unchanged.
3. This produces the map's actual analytical population: **operated sites of one identified ASX issuer**, not all Australian mines. Both the location and the operating relationship are needed to answer the question.
4. Exact issuer code **BHP** joins the ASX directory and BlackRock holdings. Its IOZ rank is 1 and weight is approximately 11.3273%, which justifies choosing this case. Portfolio weight occurs once at issuer level in `data/bhp-source-chain.json`, never summed across sites. The CSV contains site facts without repeated fund weights.

This is a real combination of geographic records and separately published company relationships, not two independent datasets placed side by side.

## Substantive combination 2: count versus weight

`data/asx-ioz-linked.csv` materialises 200 exact ASX-code / IOZ-ticker matches, with no unmatched codes or duplicate keys. It retains both source names and both classification fields. ASX contributes listed-company identity and names; BlackRock contributes sectors and weights. Figure 02 groups these matched holdings by **IOZ sector only**, then compares count / 200 with normalised portfolio weight. ASX company names identify the leading holdings in Tooltip.

No mapping equates ASX industry groups with IOZ sectors. The directory and fund dates differ by one day and are labelled separately; this is not a longitudinal company-continuity study.

## Actual primary sources and correspondence

- ASX directory: https://www.asx.com.au/asx/research/ASXListedCompanies.csv — official CSV dated 21 October 2026. Downloaded 21 October 2026; its 2,051 codes, names and industry groups match the earlier snapshot. Clean `data/directory.csv`; raw checksum in `reports/current-snapshot.json`.
- BlackRock IOZ: https://www.blackrock.com/au/products/251852/ishares-core-s-p-asx-200-etf/1478358644060.ajax?fileType=csv&fileName=IOZ_holdings&dataType=fund — official CSV as at 20 October 2026, downloaded 21 October 2026. Only 200 Equity rows retained; cash / futures excluded. Weights are normalised from equity market values. Published rounded equity-row weights sum to 99.78%; this is not used as the exact denominator. Raw checksum and current results: `reports/current-snapshot.json`.
- RBA: https://www.rba.gov.au/publications/rdp/2019/2019-04.html ; exact input download: https://www.rba.gov.au/publications/rdp/2019/2019-04/rdp-2019-04-supplementary-information.zip . Local graph 11 CSV is retained under `data/raw/rba/R code/graphs/`.
- ABS: https://www.abs.gov.au/statistics/economy/national-accounts/australian-national-accounts-state-accounts/2024-25-financial-year — fixed release, 20 November 2025; next scheduled release 18 November 2026. Raw Tables 2–9, Data2, exact current-price series IDs retained in `data/abs-series-metadata.json`.
- GA: https://pid.geoscience.gov.au/dataset/ga/150821 ; service schema https://services.ga.gov.au/gis/rest/services/AustralianOperatingMines/MapServer/0?f=pjson . Original `data/raw/ga-mines.geojson` has 347 operating-mine records; only three identified sites enter the BHP map.
- BHP: https://www.bhp.com/es/news/media-centre/releases/2026/07/another-step-forward-in-bhps-south-australian-growth-plans-with-award-of-design-and-supply-contract — 8 July 2026, About Copper SA identifies the three operating mines. Oak Dam is an exploration project and excluded.
- ASX Foreign Entity Report: https://www.asx.com.au/content/dam/asx/documents/listings/foreign-entity-data/2026/asx-foreign-entity-report-20260930.xlsx . Frozen original, explicit 13-jurisdiction crosswalk and record audit retained from Round 1.
- News Corp security classes: https://www.sec.gov/Archives/edgar/data/1564708/000156470826000175/nws-20260630.htm — issuer's 2026 filing establishes NWS / NWSLV as two classes of one entity; not counted twice.
- Natural Earth: https://github.com/nvkelso/natural-earth-vector — public-domain boundaries and jurisdiction label anchors. These are never company addresses.

ASX and BlackRock official CSV downloads were refreshed on 21 October 2026. The raw downloads, response headers and scoped processing script are retained in a separate local research archive. The published snapshot metadata records exact headers, source URLs, checksums and retrieval times. The RBA, ABS, GA, BHP and September foreign-report inputs remain unchanged. Public URLs may update later; this website displays dated snapshots rather than live values.

## Accuracy, limitations and verdict

**VERIFIED AND USABLE:** existing primary inputs; 200-code matched dataset; three exact GA / BHP site relationships; sector counts and weights; same-population historical steps; Round 1 map populations and coordinates.

The Boxplot calculates medians directly from individual holding weights in Vega-Lite. Derived sector median fields independently use the standard median, averaging the middle pair for an even sample size. The refreshed values are taken from the retained official downloads; no missing observations are estimated.

**Verdict:** the supplied requirement to combine two different sources is supported by actual joined records and by Map 11's marks, not just source-counting. Not every chart is claimed to contain two sources. If a studio imposes an additional oral rule beyond the supplied brief, that separate instruction needs human confirmation.

No full-ASX market-capitalisation total is available here. No causal link, company revenue, mine value, production volume, headquarters or geographic allocation of portfolio weight is inferred. The historical series ends in 2019; it is an explicitly historical question, not a claim to be the current market. Teacher grading / idiom classification, real hand-drawn sketch alignment, student details and public deployment remain separate human/submission checks.
