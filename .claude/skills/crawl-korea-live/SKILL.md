---
name: crawl-korea-live
description: Research Korean live commerce platforms (SSG, Naver, Kakao, CJ OnStyle) and build crawlers to extract products, events, coupons, benefits, and promotions
argument-hint: "[platform-name]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - WebFetch
  - WebSearch
---

# Korea Live Commerce Crawler Research & Development

Research Korean live commerce platforms and build crawlers following the project architecture.

## IMPORTANT: Brand Filtering Rule

**Only save broadcasts for brands that exist in the `brands` table.**

- Before saving a broadcast, check if the brand exists in the database
- If brand is not found in DB → **SKIP the broadcast** (do not save)
- Use brand matching via `brand_name` field or product brand names
- Reference brand list: `crawler/config/brands.json` or query `brands` table
- Log skipped broadcasts with reason: "Brand not in DB: {brand_name}"

```python
# Example brand check in saver
def save_broadcast(self, data: dict, skip_unknown_brand: bool = True):
    brand_name = data.get('brand_name')
    brand_id = self.get_brand_id(brand_name)

    if skip_unknown_brand and not brand_id:
        return {'status': 'skipped', 'reason': f'Brand not in DB: {brand_name}'}

    # Continue with save...
```

## Target Platforms

| Platform | URL | Priority | DB Count |
|----------|-----|----------|----------|
| SSG Live | m.ssg.com/liveCommerce | Active | 9 |
| Naver Shopping Live | shoppinglive.naver.com | In Progress | 465 |
| Kakao Shopping Live | shoppinglive.kakao.com | Active | 31 |
| CJ OnStyle | cjonestyle.com | Active | - |
| Coupang Live | coupang.com | Medium | - |
| 11Street Live | 11st.co.kr | Medium | - |

## Database Schema (2 Tables Only)

### Table 1: `broadcasts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `external_id` | text | Platform's broadcast ID |
| `title` | text | Broadcast title |
| `brand_name` | text | Brand name |
| `broadcast_url` | text | Live URL |
| `replay_url` | text | VOD/replay URL |
| `stand_by_image` | text | Thumbnail |
| `broadcast_date` | timestamptz | Start time |
| `expected_start_date` | timestamptz | Scheduled time |
| `status` | text | live/scheduled/replay |
| `platform_id` | uuid | FK to platforms |
| `brand_id` | uuid | FK to brands |
| **JSONB Columns** | | |
| `purchase_benefits` | jsonb | Purchase-based benefits |
| `participation_events` | jsonb | Events (구매인증, 채팅왕) |
| `announcements` | jsonb | Notices/공지사항 |
| `precautions` | jsonb | Precautions/유의사항 |
| `coupons_data` | jsonb | Coupon information |
| `benefits_data` | jsonb | General benefits |
| `chat_messages` | jsonb | Chat/QnA messages |
| `promotion_images` | jsonb | Promotion banner images |

### Table 2: `broadcast_products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `broadcast_id` | bigint | FK to broadcasts |
| `product_id` | text | Platform's product ID |
| `name` | text | Product name |
| `brand_name` | text | Brand |
| `original_price` | numeric | Original price |
| `discounted_price` | numeric | Sale price |
| `discount_rate` | numeric | Discount % |
| `stock` | integer | Inventory |
| `image_url` | text | Product image |
| `link_url` | text | Product page URL |

## JSONB Field Structures (Database Format)

Reference: `crawler/cj/persistence/transformer.py`, `crawler/shared/persistence/base_transformer.py`

### `benefits` (구매 혜택)

**benefit_category values (UPPERCASE):**
`GIFT_BY_AMOUNT`, `GIFT_PROMOTION`, `COUPON`, `POINT`, `SERVICE`, `DISCOUNT`, `FREE_SHIPPING`, `OTHER`

```json
[
  {
    "benefit_category": "GIFT_BY_AMOUNT",
    "benefit_title": "구매금액대별 사은품",
    "benefit_details": "상세 설명",
    "items": [
      {"condition": "4만원 이상", "name": "세럼", "volume": "5ml", "quantity": "1개", "additional_info": null},
      {"condition": "8만원 이상", "name": "텀블러", "additional_info": "한정수량 100개"}
    ],
    "target_scope": "전원",
    "validity_period": "방송중만",
    "additional_info": "합배송, 구매확정 필요"
  }
]
```

### `special_goods` (라이브 특가 상품)

⚠️ **includes** = 기본 구성품, **gift_items** = 증정품(덤)

```json
[
  {
    "name": "슈퍼바이탈 2종 세트",
    "description": "트리플 기획",
    "original_price": "139,000원",
    "first_discount_price": "100,080원",
    "first_discount_rate": "28%",
    "max_discount_price": "93,190원",
    "max_discount_rate": "33%",
    "includes": ["슈퍼바이탈 크림 60ml", "슈퍼바이탈 세럼 50ml"],
    "tags": ["단독상품", "트리플 기획"],
    "stock_info": "한정수량",
    "gift_items": ["토트백", "5종 키트"],
    "additional_info": "포토리뷰 1,000원 적립"
  }
]
```

### `participation_events` (참여 이벤트)

**event_type values (lowercase - after transformer mapping):**
`purchase_verification`, `purchase_king`, `chat_king`, `photo_review`, `first_come`, `raffle`, `share`, `other`

```json
[
  {
    "event_type": "purchase_verification",
    "event_name": "구매인증 이벤트",
    "prize": "스타벅스 기프티콘",
    "participation_method": "구매후기 + 인증샷 업로드",
    "participation_deadline": "방송 종료 후 24시간",
    "winners_count": "10명",
    "winner_criteria": "추첨",
    "delivery_schedule": "당첨 발표 후 2주 이내",
    "additional_info": "구매확정 후 참여 가능"
  }
]
```

### `notices` (공지사항)

```json
[
  {"content": "오늘 라이브 한정 최대 40% 할인!"},
  {"content": "선착순 100명 추가 사은품 증정"}
]
```

### `precautions` (유의사항 - flattened)

```json
[
  {"category": "배송", "content": "제주/도서산간 추가 배송비 3,000원"},
  {"category": "교환/환불", "content": "7일 이내 교환/환불 가능"}
]
```

### `comments_data` (통합 댓글/QnA)

```json
{
  "comments": [
    {
      "source": "ssg_qna|kakao_shopping_live|naver_livebridge",
      "comment_id": "123456",
      "message": "배송 얼마나 걸려요?",
      "created_at": "2026-01-27T10:30:00",
      "comment_type": "member|question|answer",
      "reactions": {"likes": 0, "dislikes": 0},
      "reply_count": 0,
      "metadata": {"nickname": "user123"}
    }
  ],
  "summary": {
    "total_count": 38,
    "by_source": {"ssg_qna": 38}
  }
}
```

### Event Category Mapping (Vision → DB)

| Vision Output (UPPERCASE) | Database (lowercase) |
|---------------------------|----------------------|
| PURCHASE_PROOF | purchase_verification |
| PURCHASE_KING | purchase_king |
| CHAT_KING | chat_king |
| PHOTO_REVIEW | photo_review |
| FIRST_COME | first_come |
| RAFFLE | raffle |
| SHARE | share |
| OTHER | other |

## Research Workflow

### Phase 1: Platform Investigation

1. **Explore platform structure**
   - Live broadcast listing page
   - VOD/replay listing page
   - Individual broadcast detail page
   - URL patterns

2. **Analyze data sources** (DevTools Network tab)
   - API endpoints (JSON) - easiest
   - HTML DOM structure - medium
   - Images/banners needing Vision - hardest

3. **Document in** `crawler/platforms/[platform]/investigation/`

### Phase 2: Data Mapping

Map platform fields to schema:

```
Platform Response          → broadcasts table
─────────────────────────────────────────────
broadcast_id/vod_id        → external_id
title/name                 → title
thumbnail/image            → stand_by_image
start_time                 → broadcast_date
scheduled_time             → expected_start_date
coupons[]                  → coupons_data (JSONB)
benefits[]                 → purchase_benefits (JSONB)
events[]                   → participation_events (JSONB)
notices[]                  → announcements (JSONB)

Platform Response          → broadcast_products table
─────────────────────────────────────────────
item_id                    → product_id
item_name                  → name
brand                      → brand_name
price                      → original_price
sale_price                 → discounted_price
discount_rate              → discount_rate
stock                      → stock
```

### Phase 3: Build Crawler

#### Directory Structure
```
crawler/platforms/[platform]/
├── __init__.py
├── crawler.py              # Main crawler
├── config.py               # URLs, endpoints
├── html_selectors.py       # CSS selectors (if HTML)
├── prompts.py              # Vision prompts (if needed)
├── [platform]_persistence/
│   ├── saver.py            # Database operations
│   └── transformer.py      # Data transformation
└── investigation/          # Research scripts (gitignored)
```

#### Crawler Template
```python
@dataclass
class BroadcastData:
    external_id: str
    title: str
    broadcast_url: str
    stand_by_image: Optional[str] = None
    status: str = "replay"
    # JSONB fields
    purchase_benefits: Dict = field(default_factory=dict)
    participation_events: List = field(default_factory=list)
    coupons_data: List = field(default_factory=list)
    announcements: List = field(default_factory=list)
    precautions: List = field(default_factory=list)

@dataclass
class ProductData:
    product_id: str
    name: str
    original_price: int
    discounted_price: int
    discount_rate: Optional[float] = None
    image_url: Optional[str] = None

class PlatformCrawler:
    async def get_broadcast_list(self) -> List[BroadcastData]:
        """Crawl broadcast listing page"""
        pass

    async def get_broadcast_detail(self, broadcast_id: str) -> BroadcastData:
        """Extract all data from single broadcast"""
        pass

    def get_products(self, broadcast_id: str) -> List[ProductData]:
        """Get products (API or HTML)"""
        pass
```

### Phase 4: Test

```bash
cd /var/www/html/ai_cs/crawler
python platforms/[platform]/investigation/test_crawler.py
```

## Data Transformer Architecture

Transformers convert crawler output to frontend-ready database format. Each platform has its own transformer that extends `BaseTransformer`.

### Transformer Location
```
crawler/
├── shared/persistence/
│   ├── base_transformer.py    # Abstract base class
│   ├── upserter.py            # Database upsert operations
│   └── saver.py               # Unified save interface
│
├── cj/persistence/
│   └── transformer.py         # CJ OnStyle transformer (reference)
│
└── platforms/
    ├── ssg/ssg_persistence/
    │   └── transformer.py     # SSG transformer
    └── kakao/kakao_persistence/
        └── transformer.py     # Kakao transformer
```

### Base Transformer Interface

```python
from crawler.shared.persistence.base_transformer import BaseTransformer

class PlatformTransformer(BaseTransformer):
    PLATFORM_CODE = 'PLATFORM'  # SSG, KAKAO, NAVER, CJ, etc.

    def transform_broadcast(self, crawler_data: Dict) -> Dict:
        """Map crawler output to broadcasts table schema"""
        pass

    def transform_products(self, broadcast_id: int, products: List) -> List[Dict]:
        """Map products to broadcast_products table schema"""
        pass

    def transform_notices(self, notices: List) -> List[Dict]:
        """Map notices to JSONB format: [{"content": "..."}]"""
        pass

    def transform_chat_messages(self, messages: List) -> List[Dict]:
        """Map chat to unified format"""
        pass
```

### Frontend-Ready JSONB Structures

#### `benefits` (구매 혜택)
```json
[
  {
    "benefit_category": "GIFT_PROMOTION|COUPON|POINT|DISCOUNT",
    "benefit_title": "트리플 기획 구매 혜택",
    "target_scope": "구매자 전원",
    "items": [
      {
        "name": "샘플키트 3종",
        "volume": "25mL",
        "quantity": "1개",
        "condition": "5만원 이상 구매 시"
      }
    ],
    "validity_period": "방송 중 한정",
    "additional_info": "한달 포토리뷰 작성 시 2,000원 적립"
  }
]
```

#### `special_goods` (라이브 특가 상품)
```json
[
  {
    "name": "그린티 세라마이드 밀크 에센스 160mL 3개",
    "description": "트리플 기획 (본품 160mL x3)",
    "original_price": "66,000원",
    "first_discount_price": "44,220원",
    "max_discount_price": "37,580원",
    "includes": ["본품 160mL x3"],
    "gift_items": ["샘플 10개", "화장솜 3개"],
    "tags": ["트리플 기획", "15% Npay 적립"],
    "stock_info": "한정수량"
  }
]
```

#### `participation_events` (참여 이벤트)
```json
[
  {
    "event_type": "purchase_verification|purchase_king|chat_king|raffle|first_come|share",
    "event_name": "다이슨 슈퍼소닉 헤어드라이어 증정",
    "prize": "다이슨 슈퍼소닉 헤어드라이어",
    "winners_count": "1명",
    "winner_criteria": "추첨",
    "participation_method": "라이브 방송 시간 4만 원 이상 결제 시 자동응모",
    "participation_deadline": "12/15 (추첨)",
    "delivery_schedule": "당첨 발표 후 2주 이내"
  }
]
```

#### `precautions` (유의사항)
```json
[
  {
    "category": "배송",
    "content": "제주/도서산간 추가 배송비 3,000원"
  },
  {
    "category": "교환/환불",
    "content": "7일 이내 교환/환불 가능 (단, 개봉 시 불가)"
  }
]
```

#### `notices` (공지사항)
```json
[
  {"content": "오늘 라이브 한정 최대 40% 할인!"},
  {"content": "선착순 100명 추가 사은품 증정"}
]
```

#### `comments_data` (댓글/QnA - 통합 형식)
```json
{
  "comments": [
    {
      "source": "ssg_qna|kakao_chat|naver_livebridge",
      "message": "배송 얼마나 걸려요?",
      "created_at": "2026-01-27T10:30:00",
      "comment_type": "question",
      "metadata": {"nickname": "user123"}
    }
  ],
  "summary": {
    "total_count": 38,
    "by_source": {"ssg_qna": 38}
  }
}
```

### Event Category Mapping

Vision/API에서 추출된 이벤트 카테고리를 통합 `event_type`으로 매핑:

| Vision/API Category | DB event_type |
|---------------------|---------------|
| PURCHASE_PROOF | purchase_verification |
| PURCHASE_KING | purchase_king |
| CHAT_KING | chat_king |
| PHOTO_REVIEW | photo_review |
| FIRST_COME | first_come |
| RAFFLE | raffle |
| SHARE | share |
| OTHER | other |

### Status Mapping

각 플랫폼의 상태값을 통합 `status`로 매핑:

| Platform | Original | DB status |
|----------|----------|-----------|
| SSG | live/replay/scheduled | live/replay/scheduled |
| Kakao | ON_AIR | live |
| Kakao | END | replay |
| Kakao | SCHEDULED | scheduled |
| Naver | BLOCK | ended |
| Naver | NONE | unknown |
| CJ | onair | live |
| CJ | vod | replay |

### ID Generation Strategy

각 플랫폼별 고유 ID 생성 전략:

| Platform | ID Source | Range |
|----------|-----------|-------|
| CJ OnStyle | Native numeric ID | 0 - 10M |
| SSG | MD5 hash of ch_xxxxx | 100M - 2.1B |
| Kakao | Native numeric ID | Direct use |
| Naver | Native numeric ID | Direct use |

## Reference Files

| File | Purpose |
|------|---------|
| `docs/ai/design/feature-multi-platform-crawler-architecture.md` | Architecture |
| `database/migrations_v3/001_add_json_columns.sql` | JSONB columns |
| `crawler/platforms/ssg/crawler.py` | Reference implementation (HTML + API) |
| `crawler/platforms/ssg/ssg_persistence/saver.py` | DB save example |
| `crawler/platforms/kakao/crawler.py` | Reference implementation (API-based) |
| `crawler/platforms/kakao/kakao_persistence/saver.py` | Kakao DB save example |
| `crawler/platforms/cjonstyle/crawler.py` | Reference implementation (API + HTML) |

## Example Usage

```
User: /crawl-korea-live naver

Steps:
1. Research Naver Shopping Live structure
2. Find APIs for broadcast list, products
3. Identify what needs Vision extraction
4. Map to broadcasts + broadcast_products schema
5. Build crawler with persistence layer
6. Test and validate
```
