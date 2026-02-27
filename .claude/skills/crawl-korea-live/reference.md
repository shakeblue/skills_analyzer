# Korea Live Commerce Crawler - Reference Guide

## Amore Pacific Brands (Complete List)

```python
# From crawler/config/brands.json - Use for filtering broadcasts
AMORE_BRANDS = {
    # Code: (English Name, Korean Name)
    "LABOH": ("LABO-H", "라보에이치"),
    "RYO": ("RYO", "려"),
    "LONGTAKE": ("LONGTAKE", "롱테이크"),
    "MAMONDE": ("Mamonde", "마몽드"),
    "MEDIAN": ("Median", "메디안"),
    "MAKEON": ("makeON", "메이크온"),
    "MISEENSCENE": ("Mise-en-scène", "미장센"),
    "BEREADY": ("BeREADY", "비레디"),
    "SULWHASOO": ("Sulwhasoo", "설화수"),
    "SKINU": ("SkinU", "스킨유"),
    "AMOREBASIC": ("Amore Basic", "아모레베이직"),
    "AMORESEONGSU": ("Amore Seongsu", "아모레성수"),
    "AMOREPACIFIC": ("AMOREPACIFIC", "아모레퍼시픽"),
    "IOPE": ("IOPE", "아이오페"),
    "AESTURA": ("AESTURA", "에스트라"),
    "AP": ("AP Beauty", "에이피"),
    "ODYSSEY": ("ODYSSEY", "오디세이"),
    "ILLIYOON": ("ILLIYOON", "일리윤"),
    "PUZZLEWOOD": ("Puzzlewood", "퍼즐우드"),
    "PRIMERA": ("Primera", "프리메라"),
    "HANYUL": ("Hanyul", "한율"),
    "HAPPYBATH": ("Happy Bath", "해피바스"),
    "HERA": ("HERA", "헤라"),
    "HOLLYTUAL": ("Hollytual", "홀리튜얼"),
    "ETUDE": ("ETUDE", "에뛰드"),
    "INNISFREE": ("Innisfree", "이니스프리"),
    "OSULLOC": ("OSULLOC", "오설록"),
    "ESPOIR": ("ESPOIR", "에스쁘아"),
    "AMOREMALL": ("Amoremall", "아모레몰"),
    "LANEIGE": ("Laneige", "라네즈"),
    "VITALBEAUTY": ("Vital Beauty", "바이탈뷰티"),
}

# Korean keywords for filtering (includes variations)
AMORE_KEYWORDS_KR = [
    "라보에이치", "려", "롱테이크", "마몽드", "메디안", "메이크온",
    "미장센", "미쟝센", "비레디", "설화수", "스킨유",
    "아모레베이직", "아모레성수", "아모레퍼시픽", "아모레",
    "아이오페", "에스트라", "에이피", "오디세이", "일리윤",
    "퍼즐우드", "프리메라", "한율", "해피바스", "헤라",
    "홀리튜얼", "홀리추얼", "에뛰드", "이니스프리", "오설록",
    "에스쁘아", "아모레몰", "라네즈", "바이탈뷰티",
]

# English keywords for filtering
AMORE_KEYWORDS_EN = [
    "LABO-H", "LABOH", "RYO", "LONGTAKE", "MAMONDE", "MEDIAN",
    "MAKEON", "MISE-EN-SCENE", "MISEENSCENE", "BEREADY",
    "SULWHASOO", "SKINU", "AMORE", "AMOREPACIFIC",
    "IOPE", "AESTURA", "AP BEAUTY", "ODYSSEY", "ILLIYOON",
    "PUZZLEWOOD", "PRIMERA", "HANYUL", "HAPPY BATH", "HAPPYBATH",
    "HERA", "HOLLYTUAL", "ETUDE", "INNISFREE", "OSULLOC",
    "ESPOIR", "AMOREMALL", "LANEIGE", "VITAL BEAUTY", "VITALBEAUTY",
]
```

## Platform-Specific Notes

### SSG Live (Active)
- **Base URL**: `m.ssg.com/liveCommerce`
- **Data Sources**: HTML listing + API for products + Gripcloud API for chat
- **Key APIs**:
  - Products: `GET /api/liveCommerce/getBrocItemList?scomBrocOrgaId={id}`
  - FAQ/Notices: `https://api.gripcloud.show/v1/faq/{id}`
  - QnA: `https://api.gripcloud.show/v1/qna/vod/{vod_id}`
- **Notes**: Requires mobile viewport (390x844), SSL verify disabled

### CJ OnStyle (Active)
- **Base URL**: `cjonestyle.com`
- **Data Sources**: HTML + Vision for promotion banners
- **Notes**: Heavy use of promotional images requiring vision extraction

### Naver Shopping Live (In Progress)
- **Base URL**: `shoppinglive.naver.com`
- **View URL**: `view.shoppinglive.naver.com/lives/{broadcastId}`
- **Data Sources**: CJ OnStyle transformer (via Livebridge) + Vision extraction
- **Current Status**: 465 broadcasts in DB (441 BLOCK, 24 NONE)
- **Key Issues**:
  - Status mapping needed: BLOCK→ended, NONE→unknown
  - 24 broadcasts missing vision extraction data
- **Good Data Fields**: benefits, participation_events, special_goods, precautions (when vision extraction works)
- **Needs**: Native Naver crawler (currently uses CJ livebridge integration)

### Kakao Shopping Live (Active)
- **Base URL**: `shoppinglive.kakao.com`
- **Data Sources**: API-based with cursor pagination
- **Key APIs**:
  - Live Archives: `GET /api/v1/live-archives?categoryId={id}&size={size}&cursor={cursor}`
  - Live Home: `GET /api/v1/live-home`
  - Categories: `GET /api/v1/categories`
  - Live Detail: `/live/{liveContentId}`
- **Category IDs**: Beauty/뷰티 = 4
- **Notes**:
  - Supports date range filtering (default 90 days)
  - Uses cursor-based pagination
  - Mobile User-Agent recommended

## Vision Extraction

**Prompt file:** `crawler/cj/prompts/improved_vision_prompt_v5_2.py`
**Extractor:** `crawler/cj/vision_extractor.py`

Vision extraction output (UPPERCASE categories) is transformed to database format (lowercase event_type) via `map_vision_output_to_db()` in `crawler/cj/persistence/transformer.py`

## Common Selectors

### Broadcast Listing
```python
# SSG
BROADCAST_LINKS = 'a[href*="liveCommerce"], a[href*="ssgLive"]'
BROADCAST_ID_PATTERN = r'(?:scomBrocOrgaId|reservationId)=([a-zA-Z0-9_]+)'

# Generic patterns
THUMBNAIL_IMG = 'img[class*="thumb"], img[class*="poster"]'
TITLE_TEXT = '[class*="title"], [class*="name"], h2, h3'
PRICE_TEXT = '[class*="price"], [class*="cost"]'
```

## Database Operations Example

```python
from supabase import create_client

class BroadcastSaver:
    def __init__(self):
        self.client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

    def save_broadcast(self, data: dict) -> dict:
        """Upsert broadcast with JSONB fields"""
        broadcast_data = {
            "external_id": data["external_id"],
            "title": data["title"],
            "brand_name": data["brand_name"],
            "broadcast_url": data.get("broadcast_url"),
            "replay_url": data.get("replay_url"),
            "stand_by_image": data.get("stand_by_image"),
            "status": data.get("status", "replay"),
            "platform_id": data.get("platform_id"),
            "brand_id": data.get("brand_id"),
            # JSONB fields (unified format)
            "benefits": data.get("benefits", []),  # [{benefit_category, benefit_title, items, ...}]
            "special_goods": data.get("special_goods", []),  # [{name, original_price, ...}]
            "participation_events": data.get("participation_events", []),  # [{event_type, event_name, ...}]
            "notices": data.get("notices", []),  # [{content}]
            "precautions": data.get("precautions", []),  # [{category, content}]
            "comments_data": data.get("comments_data", {}),  # {comments: [], summary: {}}
        }

        result = self.client.table("broadcasts").upsert(
            broadcast_data,
            on_conflict="external_id,platform_id"
        ).execute()

        return result.data[0] if result.data else None

    def save_products(self, broadcast_id: int, products: list):
        """Save products for a broadcast"""
        for product in products:
            product_data = {
                "broadcast_id": broadcast_id,
                "product_id": product["product_id"],
                "name": product["name"],
                "brand_name": product.get("brand_name"),
                "original_price": product.get("original_price"),
                "discounted_price": product.get("discounted_price"),
                "discount_rate": product.get("discount_rate"),
                "stock": product.get("stock"),
                "image_url": product.get("image_url"),
                "link_url": product.get("link_url"),
                "product_classification": product.get("product_classification", "sub"),  # main/sub
            }

            self.client.table("broadcast_products").upsert(
                product_data,
                on_conflict="broadcast_id,product_id"
            ).execute()
```

## GitHub Workflow Template

```yaml
name: Crawl [Platform]

on:
  schedule:
    - cron: '0 21 * * *'  # 6 AM KST
  workflow_dispatch:
    inputs:
      max_broadcasts:
        description: 'Max broadcasts to crawl'
        default: '30'

jobs:
  crawl:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r crawler/cj/requirements.txt
          playwright install chromium

      - name: Run crawler
        working-directory: crawler
        run: |
          python platforms/[platform]/crawler.py \
            --mode amore \
            --max ${{ github.event.inputs.max_broadcasts || '30' }} \
            --save-db
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Data Transformer Files

| File | Purpose |
|------|---------|
| `crawler/shared/persistence/base_transformer.py` | Abstract base class for all transformers |
| `crawler/cj/persistence/transformer.py` | CJ OnStyle transformer (most complete reference) |
| `crawler/platforms/ssg/ssg_persistence/transformer.py` | SSG transformer |
| `crawler/platforms/kakao/kakao_persistence/transformer.py` | Kakao transformer |

### Transformer Usage Example

```python
from crawler.platforms.ssg.ssg_persistence.transformer import SSGTransformer
from crawler.shared.persistence.upserter import BroadcastUpserter

# Transform crawler output
transformer = SSGTransformer()
db_data = transformer.transform_broadcast(crawler_output)
products = transformer.transform_products(db_data['id'], crawler_output.get('products', []))

# Save to database
upserter = BroadcastUpserter()
upserter.upsert_broadcast(db_data, platform_code='SSG')
upserter.upsert_products(products)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SSL Certificate Error | `verify=False` for requests, `ignore_https_errors=True` for Playwright |
| Content not loading | Wait for `networkidle`, add delays, try scrolling |
| Missing data | Check if in iframe, try mobile viewport |
| Rate limiting | Reduce concurrency, add delays |
| Korean encoding | `encoding='utf-8'`, `ensure_ascii=False` |
| Status mapping wrong | Check platform's original status values and update transformer |
| JSONB empty | Verify vision extraction is running, check raw_data.vision_extraction |
