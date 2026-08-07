import argparse
from pathlib import Path

REQUIRED_LINKS = (
    "https://x.com/aleimad7aden",
    "https://www.instagram.com/aleimad7aden/",
    "https://www.facebook.com/aleimad7aden/",
)


def validate_homepage(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    missing = [link for link in REQUIRED_LINKS if link not in html]

    if missing:
        raise SystemExit(
            "Missing required social links in index.html: " + ", ".join(missing)
        )

    print("Social footer validation passed")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate the office social links in the homepage footer."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate that all official social links exist in index.html.",
    )
    args = parser.parse_args()

    homepage = Path("index.html")
    if not homepage.exists():
        raise SystemExit("index.html not found")

    if args.check:
        validate_homepage(homepage)
        return

    validate_homepage(homepage)


if __name__ == "__main__":
    main()
