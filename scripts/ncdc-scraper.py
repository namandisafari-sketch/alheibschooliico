#!/usr/bin/env python3
"""
NCDC Uganda Primary Curriculum Scraper
Downloads and extracts syllabus topics from NCDC/UNEB curriculum PDFs.
Usage: python3 ncdc-scraper.py [--download] [--parse]
"""
import requests, re, json, sys, os
from bs4 import BeautifulSoup

# Known NCDC curriculum resources
SOURCES = {
    "uneb_primary": "https://uneb.ac.ug/abridged-curricula-from-ncdc-primary",
    "exotic_notes": "https://exoticnotes.com/notes/primary/download/all-curriculums-for-primary-schools-by-ncdc-from-primary-one-p1-to-primary-seven-p7-all-subjects",
}

# Uganda NCDC primary subjects (P1-P7)
SUBJECTS = {
    "ENG": "English", "MTC": "Mathematics", "SCI": "Integrated Science",
    "SST": "Social Studies", "LIT1": "Literacy I", "LIT2": "Literacy II",
    "NUM": "Numeracy", "AGR": "Agriculture", "CRE": "Religious Education (CRE)",
    "IRE": "Religious Education (IRE)", "PE": "Physical Education",
    "CRT": "Creative Arts", "LL": "Local Language", "LSK": "Life Skills",
}

def fetch_uneb_links():
    """Attempt to extract PDF links from UNEB website"""
    print("Fetching UNEB curriculum page...")
    r = requests.get(SOURCES["uneb_primary"], timeout=15)
    soup = BeautifulSoup(r.text, "html.parser")
    links = []
    for cls in ["P1", "P2", "P3", "P4", "P5", "P6", "P7"]:
        # Try to find any link containing the class name
        for a in soup.find_all("a", href=True):
            if cls in a.get_text() or cls in a["href"]:
                links.append({"class": cls, "url": a["href"], "text": a.get_text(strip=True)})
    return links

def fetch_ncdc_downloads():
    """Try to get curriculum PDFs from NCDC website"""
    print("Fetching NCDC downloads page...")
    r = requests.get("https://www.ncdc.go.ug/downloads", timeout=15)
    soup = BeautifulSoup(r.text, "html.parser")
    pdfs = []
    for a in soup.find_all("a", href=True):
        if ".pdf" in a["href"].lower():
            pdfs.append({"url": a["href"], "text": a.get_text(strip=True)})
    return pdfs

def extract_pdf_text(pdf_url):
    """Download PDF and extract text (requires PyMuPDF: pip install pymupdf)"""
    try:
        import fitz  # PyMuPDF
        r = requests.get(pdf_url, timeout=30)
        doc = fitz.open(stream=r.content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except ImportError:
        print("Install pymupdf: pip install --break-system-packages pymupdf")
        return None
    except Exception as e:
        print(f"PDF error: {e}")
        return None

def parse_topics_from_text(text, subject_code, class_level):
    """Parse structured topics from curriculum text"""
    lines = text.split("\n")
    topics = []
    current_topic = None
    for line in lines:
        line = line.strip()
        # Skip headers and page numbers
        if not line or line.isdigit() or len(line) < 5:
            continue
        # Detect topic headers (usually ALL CAPS or numbered)
        if re.match(r"^(TOPIC|THEME|UNIT|MODULE)\s+\d+|^[A-Z\s]{10,}$", line, re.IGNORECASE):
            if current_topic:
                topics.append(current_topic)
            current_topic = {"title": line, "sub_topics": [], "lessons": 0}
        elif current_topic and re.match(r"^\d+\.?\s+\w", line):
            current_topic["sub_topics"].append(line)
    if current_topic:
        topics.append(current_topic)
    return topics

def generate_sql_inserts(data):
    """Generate SQL INSERT statements for curriculum_plans and curriculum_topics"""
    sql = ["-- NCDC Curriculum Data - Auto-generated", f"-- Source: {json.dumps(SOURCES, indent=2)}", ""]
    for entry in data:
        class_id = f"{{class_{entry['class'].lower()}_id}}"  # Placeholder
        subject_id = f"{{subject_{entry['subject_code']}_id}}"
        sql.append(f"-- {entry['class']} - {entry['subject_name']}")
        for i, topic in enumerate(entry.get("topics", [])):
            sql.append(f"""
INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
VALUES ('{class_id}', '{subject_id}', '{entry.get('term', 'Term I')}', 2026, {json.dumps(topic['title'])}, {i + 1}, 'Auto-extracted from NCDC curriculum');
""".strip())
    return "\n".join(sql)

def main():
    print("=== NCDC Uganda Primary Curriculum Scraper ===\n")
    
    # Step 1: Try to fetch links from UNEB
    uneb_links = fetch_uneb_links()
    if uneb_links:
        print(f"\nFound {len(uneb_links)} links on UNEB:")
        for l in uneb_links:
            print(f"  [{l['class']}] {l['text'][:50]} → {l['url']}")
    else:
        print("No PDF links found on UNEB page (likely JS-loaded)")
    
    # Step 2: Try NCDC downloads
    ncdc_pdfs = fetch_ncdc_downloads()
    if ncdc_pdfs:
        print(f"\nFound {len(ncdc_pdfs)} PDFs on NCDC:")
        for p in ncdc_pdfs[:10]:
            print(f"  {p['text'][:50]} → {p['url']}")
    
    # Step 3: If we have PDFs, download and parse
    if "--parse" in sys.argv:
        print("\nParsing would require PDF URLs. Use --download first.")
    
    print("\nDone. Sources checked:", ", ".join(SOURCES.keys()))
    print("\nManual steps if automated scraping fails:")
    print("1. Visit https://uneb.ac.ug/abridged-curricula-from-ncdc-primary")
    print("2. Click each class link (P2-P7) to download PDFs")
    print("3. Place PDFs in ./curriculum_pdfs/")
    print("4. Re-run: python3 ncdc-scraper.py --parse")

if __name__ == "__main__":
    main()
