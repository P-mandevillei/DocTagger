"""Check repository-controlled and publisher-supplied Marketplace prerequisites."""

from pathlib import Path
from html.parser import HTMLParser
import json
import re
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
failures = []


def check(condition, label, detail=""):
    marker = "PASS" if condition else "BLOCKED"
    print(f"[{marker}] {label}{(': ' + detail) if detail else ''}")
    if not condition:
        failures.append(label)


required_site = ["index.html", "privacy.html", "terms.html", "support.html", "delete-data.html"]
for filename in required_site:
    check((ROOT / "docs" / filename).exists(), f"Public site file: {filename}")

missing_links = []
for path in (ROOT / "docs").glob("*.html"):
    source = path.read_text(encoding="utf-8")
    HTMLParser().feed(source)
    for target in re.findall(r'(?:href|src)="([^"#:]+)"', source):
        if target.startswith(("http://", "https://", "mailto:")):
            continue
        if not (path.parent / target).exists():
            missing_links.append(f"{path.name}: {target}")
check(not missing_links, "Public site relative links resolve", ", ".join(missing_links))

publisher_text = "\n".join(
    path.read_text(encoding="utf-8") for path in (ROOT / "docs").glob("*.html")
)
publisher_text += "\n" + (ROOT / "MARKETPLACE_LISTING.md").read_text(encoding="utf-8")
publisher_text += "\n" + (ROOT / "LICENSE").read_text(encoding="utf-8")
check(
    not re.search(r"\[(?:YOUR|VERIFY|SELECT|TRADER OR NON-TRADER) [^\]]+\]", publisher_text),
    "Publisher placeholders replaced",
    "choose the governing-law jurisdiction and EEA trader status",
)

config_text = (ROOT / "src" / "Config.js").read_text(encoding="utf-8")
configured_urls = re.findall(r"\b(?:home|privacy|terms|support|deletion):\s*'([^']*)'", config_text)
check(
    len(configured_urls) == 5 and all(url.startswith("https://") for url in configured_urls),
    "Production URLs configured in src/Config.js",
    "all five URLs must use the verified HTTPS domain",
)

manifest = json.loads((ROOT / "src" / "appsscript.json").read_text(encoding="utf-8"))
expected_scopes = {
    "https://www.googleapis.com/auth/documents.currentonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui",
}
check(set(manifest.get("oauthScopes", [])) == expected_scopes, "Manifest scope set is exact")
check(manifest.get("runtimeVersion") == "V8", "V8 runtime enabled")

image_requirements = {
    "icon-32.png": ((32, 32), True),
    "icon-128.png": ((128, 128), True),
    "card-banner-220x140.png": ((220, 140), False),
}
for filename, (size, needs_alpha) in image_requirements.items():
    path = ROOT / "assets" / filename
    valid = False
    if path.exists():
        with Image.open(path) as image:
            valid = image.size == size and (not needs_alpha or "A" in image.mode)
    check(valid, f"Graphic asset: {filename}", f"expected {size[0]}x{size[1]}")

screenshots = list((ROOT / "assets" / "screenshots").glob("*.png")) if (ROOT / "assets" / "screenshots").exists() else []
valid_screenshots = []
for path in screenshots:
    with Image.open(path) as image:
        if image.size in {(1280, 800), (640, 400), (2560, 1600)}:
            valid_screenshots.append(path)
check(
    bool(valid_screenshots),
    "At least one real product screenshot",
    "capture 1280x800 after deploying the production-branded add-on",
)

code = (ROOT / "src" / "Code.js").read_text(encoding="utf-8")
sidebar = (ROOT / "src" / "Sidebar.html").read_text(encoding="utf-8")
check("dtiRequireDataUseConsent_" in code and "consentCheckbox" in sidebar, "In-product consent gate")
check("dtiSafeSheetText" in code, "Formula-leading text protection")
check("deleteCurrentDocumentData" in code, "Per-document deletion control")
check("dtiContextForRange_" not in code, "No surrounding passage collection")
check("add-ons1.css" in sidebar, "Google Editor add-on CSS package")

branding_text = "\n".join(
    path.read_text(encoding="utf-8")
    for path in [
        ROOT / "README.md",
        ROOT / "MARKETPLACE_LISTING.md",
        ROOT / "OAUTH_VERIFICATION.md",
        ROOT / "src" / "Code.js",
        ROOT / "src" / "Sidebar.html",
        ROOT / "src" / "Help.html",
        *sorted((ROOT / "docs").glob("*.html")),
    ]
)
check("Doc Tag Index" not in branding_text, "DocTagger branding is consistent")

print()
if failures:
    print(f"{len(failures)} prerequisite(s) remain blocked.")
    sys.exit(1)
print("Repository and publisher-supplied prerequisites are complete. Continue with live review testing.")
