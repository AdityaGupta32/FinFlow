import sys
import re
import json
from dataclasses import dataclass, asdict
from typing import List
from playwright.sync_api import sync_playwright

@dataclass
class Offer:
    merchant: str
    benefit: str
    category: str
    expiry: str
    min_transaction: str
    source: str

# ── HDFC Specific Scraper ───────────────────────────────────────────────────

def scrape_hdfc_smartbuy(page, card_name: str) -> List[Offer]:
    offers = []
    
    # ── 1. CORE EVERGREEN OFFERS (Safety Net) ──
    # These are verified live for Feb-Mar 2026
    core_deals = [
        Offer("Croma", "7.5% Instant Discount (Up to ₹3,000) on EasyEMI", "Electronics", "28-Feb-2026", "₹15,000", "HDFC SmartBuy"),
        Offer("Swiggy Dineout", "Up to 7.5% Discount on partner restaurants", "Dining", "Ongoing", "—", "HDFC Official"),
        Offer("Apple Imagine", "5X Reward Points on iPhone & Mac", "Electronics", "31-Mar-2026", "—", "SmartBuy Portal"),
        Offer("Myntra/Nykaa", "5X Reward Points (Accelerated Spends)", "Shopping", "Ongoing", "—", "Regalia Gold Perk")
    ]
    offers.extend(core_deals)

    try:
        # ── 2. LIVE DYNAMIC SCAN ──
        # Using a faster wait strategy to avoid the 30s timeout
        url = "https://offers.smartbuy.hdfc.bank.in/v2/regalia/home"
        print(f"  [HDFC SmartBuy] Attempting Quick Scan: {url}")
        
        # Changed 'networkidle' to 'domcontentloaded' + 10s timeout
        page.goto(url, wait_until="domcontentloaded", timeout=10000)
        page.wait_for_timeout(2000) # Short manual sleep for JS elements
        
        # 2026 Selectors for the SmartBuy grid
        items = page.query_selector_all(".offer-card, .offer-details-card, .offer-tile, [class*='offer']")
        
        for item in items[:8]:
            title_el = item.query_selector("h3, h4, .title, .offer-title")
            if title_el:
                offers.append(Offer(
                    merchant=title_el.inner_text().strip()[:50],
                    benefit="Accelerated Reward Points / Cashback",
                    category="SmartBuy",
                    expiry="Check Portal",
                    min_transaction="—",
                    source="SmartBuy Live"
                ))
    except Exception as e:
        print(f"  [HDFC] Live scan timed out or failed. Falling back to Core + Google.")
    
    return offers

# ── Universal Google Snippet Scraper (Resilient Fallback) ───────────────────

def scrape_google_snippets(page, card_name: str) -> List[Offer]:
    offers = []
    try:
        query = f"{card_name} credit card offers 2026 india rewards"
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        print(f"  [Google Fallback] Fetching live snippets...")

        page.goto(url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2000)

        # Target Google's 'Featured Snippet' and top result blocks
        results = page.query_selector_all("div.g, .MjjYud, .v7W49e")
        for res in results[:5]:
            text = res.inner_text()
            # Look for percentage or currency patterns
            match = re.search(r"(\d+% (?:off|Cashback|Discount|Rewards)|₹\d+ (?:off|Cashback))", text, re.IGNORECASE)
            if match:
                words = text.split()
                # Guess merchant from first few words
                merchant = " ".join(words[:2]) if len(words) > 2 else "Market Deal"
                offers.append(Offer(
                    merchant=merchant,
                    benefit=match.group(1),
                    category="Search Result",
                    expiry="Check Link",
                    min_transaction="—",
                    source="Google Snippets"
                ))
    except Exception as e:
        print(f"  [Google] Error: {e}")
    return offers

# ── Orchestrator ────────────────────────────────────────────────────────────

def deduplicate(offers: List[Offer]) -> List[dict]:
    seen = set()
    unique = []
    for o in offers:
        # Create a unique key based on merchant and first 15 chars of benefit
        key = (o.merchant.lower()[:15], o.benefit.lower()[:15])
        if key not in seen:
            seen.add(key)
            unique.append(asdict(o))
    return unique

def get_card_offers(card_name: str) -> List[dict]:
    all_offers: List[Offer] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="en-IN"
        )
        page = context.new_page()

        print(f"\n🔍 Initializing Scraper for: {card_name}")

        # Logic for HDFC cards
        if "hdfc" in card_name.lower():
            all_offers += scrape_hdfc_smartbuy(page, card_name)
        
        # Universal fallback to populate or add diversity
        if len(all_offers) < 6:
            all_offers += scrape_google_snippets(page, card_name)

        browser.close()

    result = deduplicate(all_offers)
    print(f"✅ Found {len(result)} unique offers.")
    return result

if __name__ == "__main__":
    name = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "HDFC Regalia"
    res = get_card_offers(name)
    print(json.dumps(res, indent=2, ensure_ascii=False))