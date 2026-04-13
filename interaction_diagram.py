# Requirements: pip install matplotlib numpy
# Usage: python interaction_diagram.py --kn 1.2 --rn 0.18

"""
Interaction Diagram Overlay Tool (Configurable)
==============================================
Overlays reference lines with relative radial extensions.
"""

import argparse
import json
import os
import sys

import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import numpy as np

# ── Defaults & Config ────────────────────────────────────────────────────────

DEFAULT_CONFIG_PATH = "config.json"

DEFAULT_STYLE = {
    "horizontal_line": {"color": "red", "linestyle": "--", "linewidth": 1.5, "alpha": 0.85},
    "vertical_line": {"color": "red", "linestyle": "--", "linewidth": 1.5, "alpha": 0.85},
    "radial_line": {"color": "green", "linestyle": ":", "linewidth": 1.0, "alpha": 0.80},
    "dot": {"visible": True, "color": "red", "markersize": 8},
    "label": {
        "visible": True, "fontsize": 9, "color": "white", "fontweight": "bold",
        "facecolor": "red", "alpha": 0.75, "padding": 0.3
    }
}


def load_config(config_path):
    """Load configuration from a JSON file."""
    if not os.path.exists(config_path):
        if config_path == DEFAULT_CONFIG_PATH:
            return {}
        else:
            sys.exit(f"Error: Config file not found: {config_path}")
    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except Exception as e:
        sys.exit(f"Error loading config file: {e}")


# ── Calibration & Coordinate Mapping ─────────────────────────────────────────

def calibrate(p1_px, p1_val, p2_px, p2_val):
    """Compute an affine pixel ↔ data-coordinate transform."""
    rn1, kn1 = p1_val
    rn2, kn2 = p2_val
    px1_x, px1_y = p1_px
    px2_x, px2_y = p2_px

    if rn2 == rn1 or kn2 == kn1:
        raise ValueError("Calibration points must not share an axis value.")

    scale_x = (px2_x - px1_x) / (rn2 - rn1)
    scale_y = (px2_y - px1_y) / (kn2 - kn1)
    origin_x = px1_x - rn1 * scale_x
    origin_y = px1_y - kn1 * scale_y

    return {
        "scale_x": scale_x, "scale_y": scale_y,
        "origin_x": origin_x, "origin_y": origin_y,
    }


def to_pixel(rn, kn, transform):
    """Convert real-world (Rn, Kn) to pixel (x, y)."""
    pixel_x = transform["origin_x"] + rn * transform["scale_x"]
    pixel_y = transform["origin_y"] + kn * transform["scale_y"]
    return pixel_x, pixel_y


# ── Interactive mode ─────────────────────────────────────────────────────────

def interactive_mode(image_path):
    """Run an interactive calibration session."""
    img = mpimg.imread(image_path)
    fig, ax = plt.subplots()
    ax.imshow(img)
    ax.set_title("Click Point 1 - a known (Rn, Kn) location")
    ax.axis("off")
    plt.show(block=False)

    pts1 = fig.ginput(1, timeout=0)
    if not pts1: sys.exit("Error: No click.")
    px1 = [int(round(pts1[0][0])), int(round(pts1[0][1]))]
    raw1 = input("    Enter Rn and Kn for Point 1: ").split()
    val1 = [float(raw1[0]), float(raw1[1])]

    ax.set_title("Click Point 2 - another known (Rn, Kn) location")
    fig.canvas.draw()
    pts2 = fig.ginput(1, timeout=0)
    if not pts2: sys.exit("Error: No click.")
    px2 = [int(round(pts2[0][0])), int(round(pts2[0][1]))]
    raw2 = input("    Enter Rn and Kn for Point 2: ").split()
    val2 = [float(raw2[0]), float(raw2[1])]

    plt.close(fig)
    kn = float(input("\n    Enter Kn to plot: "))
    rn = float(input("    Enter Rn to plot: "))

    config = {
        "image_path": image_path,
        "calibration": {
            "point1": {"pixel": px1, "value": val1},
            "point2": {"pixel": px2, "value": val2}
        }
    }
    return kn, rn, config


# ── Overlay drawing ──────────────────────────────────────────────────────────

def resolve_boundary(val, current_point_val, image_limit_px, transform, axis):
    """Resolve 'point', numeric, or None boundaries into pixel coordinates."""
    if val == "point": return current_point_val
    if isinstance(val, (int, float)):
        if axis == "rn":
            px, _ = to_pixel(val, 0, transform)
            return px
        else:
            _, py = to_pixel(0, val, transform)
            return py
    return 0 if val is None else val


def evaluate_conditional_limits(rules, kn, rn, type_key):
    """Find the first matching rule in a list of conditional limits."""
    sorted_rules = sorted(rules, key=lambda x: max(x.get("if_rn_above", 0), x.get("if_kn_above", 0)), reverse=True)
    for rule in sorted_rules:
        match = False
        if "if_rn_above" in rule and rn > rule["if_rn_above"]:
            match = True
        elif "if_kn_above" in rule and kn > rule["if_kn_above"]:
            match = True
        if match:
            return rule.get(f"then_{type_key}")
    return None


def plot_overlay(image_path, kn, rn, transform, config, output_path):
    """Draw reference lines and annotations with multi-variable conditional limits."""
    img = mpimg.imread(image_path)
    img_h, img_w = img.shape[:2]
    pixel_x, pixel_y = to_pixel(rn, kn, transform)
    origin_px_x, origin_px_y = to_pixel(0.0, 0.0, transform)

    fig, ax = plt.subplots()
    ax.imshow(img)
    ax.axis("off")

    style = config.get("style", {})
    h_style = style.get("horizontal_line", DEFAULT_STYLE["horizontal_line"]).copy()
    v_style = style.get("vertical_line", DEFAULT_STYLE["vertical_line"]).copy()
    r_style = style.get("radial_line", DEFAULT_STYLE["radial_line"]).copy()
    d_style = style.get("dot", DEFAULT_STYLE["dot"])
    l_style = style.get("label", DEFAULT_STYLE["label"])

    # ── Horizontal Line Bounds ──
    h_start_rn = h_style.pop("start_rn", None)
    h_end_rn = h_style.pop("end_rn", "full")
    h_cond_limits = h_style.pop("conditional_limits", [])
    h_override = evaluate_conditional_limits(h_cond_limits, kn, rn, "end_rn")
    if h_override is not None: h_end_rn = h_override

    if h_end_rn == "full":
        ax.axhline(y=pixel_y, **h_style)
    else:
        h_px_start = resolve_boundary(h_start_rn, pixel_x, 0, transform, "rn")
        h_px_end = resolve_boundary(h_end_rn, pixel_x, img_w, transform, "rn")
        ax.plot([h_px_start, h_px_end], [pixel_y, pixel_y], **h_style)

    # ── Vertical Line Bounds ──
    v_start_kn = v_style.pop("start_kn", None)
    v_end_kn = v_style.pop("end_kn", "full")
    v_cond_limits = v_style.pop("conditional_limits", [])
    v_override = evaluate_conditional_limits(v_cond_limits, kn, rn, "end_kn")
    if v_override is not None: v_end_kn = v_override

    if v_end_kn == "full":
        ax.axvline(x=pixel_x, **v_style)
    else:
        v_px_start = resolve_boundary(v_start_kn, pixel_y, img_h, transform, "kn")
        v_px_end = resolve_boundary(v_end_kn, pixel_y, 0, transform, "kn")
        ax.plot([pixel_x, pixel_x], [v_px_start, v_px_end], **v_style)

    # ── Radial line (origin to intersection + extension) ──
    extension_px = r_style.pop("extension", 0)
    r_target_px_x, r_target_px_y = pixel_x, pixel_y
    
    if extension_px != 0:
        # Calculate unit vector from origin to point
        dx = pixel_x - origin_px_x
        dy = pixel_y - origin_px_y
        dist = np.sqrt(dx**2 + dy**2)
        if dist > 0:
            ux, uy = dx / dist, dy / dist
            r_target_px_x = pixel_x + ux * extension_px
            r_target_px_y = pixel_y + uy * extension_px
    
    # Plot radial line last so it's on top
    ax.plot([origin_px_x, r_target_px_x], [origin_px_y, r_target_px_y], zorder=10, **r_style)

    # Intersection dot
    if d_style.get("visible", True):
        ax.plot(pixel_x, pixel_y, "o", color=d_style.get("color", "red"),
                markersize=d_style.get("markersize", 8), zorder=5)

    # Intersection label
    if l_style.get("visible", True):
        ax.annotate(
            f"Rn = {rn:.3f}\nKn = {kn:.3f}",
            xy=(pixel_x, pixel_y),
            xytext=(pixel_x + 15, pixel_y - 15),
            fontsize=l_style.get("fontsize", 9),
            color=l_style.get("color", "white"),
            fontweight=l_style.get("fontweight", "bold"),
            bbox=dict(
                boxstyle=f"round,pad={l_style.get('padding', 0.3)}",
                facecolor=l_style.get("facecolor", "red"),
                alpha=l_style.get("alpha", 0.75),
                edgecolor="none"
            ),
        )

    # Save
    dpi = config.get("output", {}).get("dpi", 150)
    plt.savefig(output_path, dpi=dpi, bbox_inches="tight", pad_inches=0)
    if plt.get_backend().lower() not in ["agg", "svg", "pdf", "ps"]:
        plt.show()
    return pixel_x, pixel_y


# ── Terminal summary ─────────────────────────────────────────────────────────

def print_summary(kn, rn, pixel_x, pixel_y, output_path):
    """Print ASCII summary table."""
    w = 43
    border = "-" * w
    print()
    print(f"  +{border}+")
    print(f"  |{'Interaction Diagram - Plotted Point':^{w}}|")
    print(f"  +{border}+")
    print(f"  |  Intersection Value: Rn={rn:.3f}, Kn={kn:.3f} |")
    print(f"  |  Pixel coordinate  : ({pixel_x:.0f}, {pixel_y:.0f}){' ' * (14 - len(f'({pixel_x:.0f}, {pixel_y:.0f})') )}|")
    print(f"  +{border}+")
    out_line = f"  Output saved to: {output_path}"
    print(f"  |{out_line:<{w}}|")
    print(f"  +{border}+")
    print()


# ── CLI entry point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Overlay markers on an Interaction Diagram.")
    parser.add_argument("--kn", type=float, help="Kn value to plot")
    parser.add_argument("--rn", type=float, help="Rn value to plot")
    parser.add_argument("--config", default=DEFAULT_CONFIG_PATH, help="Path to JSON config")
    parser.add_argument("--image", help="Override image path")
    parser.add_argument("--output", help="Override output filename")
    parser.add_argument("--interactive", action="store_true", help="Interactive mode")

    args = parser.parse_args()
    config = load_config(args.config)

    if args.interactive:
        image_path = args.image or config.get("image_path")
        if not image_path: sys.exit("Error: No image path.")
        kn, rn, config = interactive_mode(image_path)
    else:
        if args.kn is None or args.rn is None:
            parser.print_help()
            sys.exit("\nError: --kn and --rn required.")
        kn, rn = args.kn, args.rn

    image_path = args.image or config.get("image_path")
    if not image_path or not os.path.isfile(image_path):
        sys.exit(f"Error: Invalid image path: {image_path}")

    cal = config.get("calibration", {})
    p1, p2 = cal.get("point1"), cal.get("point2")
    if not p1 or not p2:
        sys.exit("Error: Calibration missing. Use --interactive.")

    try:
        transform = calibrate(p1["pixel"], p1["value"], p2["pixel"], p2["value"])
    except Exception as e:
        sys.exit(f"Calibration error: {e}")

    output_path = args.output or config.get("output", {}).get("default_filename", "result.png")
    px_x, px_y = plot_overlay(image_path, kn, rn, transform, config, output_path)
    print_summary(kn, rn, px_x, px_y, output_path)


if __name__ == "__main__":
    main()
