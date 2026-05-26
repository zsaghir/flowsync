#!/usr/bin/env python3
from collections import deque
from pathlib import Path
from shutil import copyfile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "public" / "assets" / "raw"
SPRITE_DIR = ROOT / "public" / "assets" / "sprites"

BUNNY_INPUT = RAW_DIR / "bunny-sheet.png"
HOURGLASS_INPUT = RAW_DIR / "hourglass-sheet.png"
BUNNY_FALLBACK = RAW_DIR / "bunny-sprites.png"
HOURGLASS_FALLBACK = RAW_DIR / "hourglass-sprites.png"

BUNNY_OUTPUTS = [
    "bunny-pomodoro.png",
    "bunny-complete.png",
    "bunny-motivation.png",
    "bunny-break.png",
]

HOURGLASS_OUTPUTS = [
    f"hourglass-frame-{index}.png" for index in range(1, 7)
]


def ensure_expected_raw_names() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if not BUNNY_INPUT.exists() and BUNNY_FALLBACK.exists():
        copyfile(BUNNY_FALLBACK, BUNNY_INPUT)
    if not HOURGLASS_INPUT.exists() and HOURGLASS_FALLBACK.exists():
        copyfile(HOURGLASS_FALLBACK, HOURGLASS_INPUT)


def split_bounds(total: int, count: int) -> list[tuple[int, int]]:
    return [
        (round(total * index / count), round(total * (index + 1) / count))
        for index in range(count)
    ]


def is_checker_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return True

    high = max(r, g, b)
    low = min(r, g, b)
    neutral = high - low <= 22
    bright_neutral = neutral and high >= 130

    # The generated sheets include a baked gray/white transparency checker plus
    # soft neutral preview bands near the edges. Restricting removal to pixels
    # connected to the slice edge protects enclosed artwork whites and highlights.
    very_light = low >= 210 and high - low <= 35
    return bright_neutral or very_light


def remove_checkerboard_from_edges(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        seen.add((x, y))
        if not is_checker_pixel(pixels[x, y]):
            continue

        pixels[x, y] = (255, 255, 255, 0)
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))

    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("sprite extraction produced an empty image")
    return bbox


def crop_with_padding(image: Image.Image, padding: int = 8) -> Image.Image:
    left, top, right, bottom = alpha_bbox(image)
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    largest: list[tuple[int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in seen or pixels[start_x, start_y][3] == 0:
                continue

            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            while queue:
                x, y = queue.popleft()
                if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
                    continue
                seen.add((x, y))
                if pixels[x, y][3] == 0:
                    continue
                component.append((x, y))
                queue.append((x + 1, y))
                queue.append((x - 1, y))
                queue.append((x, y + 1))
                queue.append((x, y - 1))

            if len(component) > len(largest):
                largest = component

    output = Image.new("RGBA", image.size, (255, 255, 255, 0))
    output_pixels = output.load()
    for x, y in largest:
        output_pixels[x, y] = pixels[x, y]
    return output


def extract_bunnies() -> None:
    sheet = Image.open(BUNNY_INPUT).convert("RGBA")
    for index, (left, right) in enumerate(split_bounds(sheet.width, 4)):
        section = sheet.crop((left, 0, right, sheet.height))
        clean = remove_checkerboard_from_edges(section)
        sprite = crop_with_padding(clean)
        sprite.save(SPRITE_DIR / BUNNY_OUTPUTS[index], "PNG")


def extract_hourglasses() -> None:
    sheet = Image.open(HOURGLASS_INPUT).convert("RGBA")
    frames = []
    for left, right in split_bounds(sheet.width, 6):
        section = sheet.crop((left, 0, right, sheet.height))
        clean = remove_checkerboard_from_edges(section)
        clean = keep_largest_alpha_component(clean)
        frames.append(crop_with_padding(clean))

    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    normalized = []

    for frame in frames:
        canvas = Image.new("RGBA", (max_width, max_height), (255, 255, 255, 0))
        offset = ((max_width - frame.width) // 2, (max_height - frame.height) // 2)
        canvas.alpha_composite(frame, offset)
        normalized.append(canvas)

    for output, frame in zip(HOURGLASS_OUTPUTS, normalized):
        frame.save(SPRITE_DIR / output, "PNG")

    clean_sheet = Image.new("RGBA", (max_width * len(normalized), max_height), (255, 255, 255, 0))
    for index, frame in enumerate(normalized):
        clean_sheet.alpha_composite(frame, (index * max_width, 0))
    clean_sheet.save(SPRITE_DIR / "hourglass-clean-sheet.png", "PNG")


def verify_outputs() -> None:
    expected = [SPRITE_DIR / name for name in BUNNY_OUTPUTS + HOURGLASS_OUTPUTS]
    expected.append(SPRITE_DIR / "hourglass-clean-sheet.png")
    missing = [path for path in expected if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing sprite outputs: " + ", ".join(str(path) for path in missing))


def main() -> None:
    SPRITE_DIR.mkdir(parents=True, exist_ok=True)
    ensure_expected_raw_names()
    if not BUNNY_INPUT.exists():
        raise FileNotFoundError(f"Missing raw bunny sheet: {BUNNY_INPUT}")
    if not HOURGLASS_INPUT.exists():
        raise FileNotFoundError(f"Missing raw hourglass sheet: {HOURGLASS_INPUT}")

    extract_bunnies()
    extract_hourglasses()
    verify_outputs()
    print(f"Extracted sprites to {SPRITE_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
