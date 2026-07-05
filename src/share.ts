import type { Challenge } from "./types";
import { skillById } from "./data/challenges";

// Per-drawer accent so a cooking card ≠ a meditation card (CURIO.md §7).
const DRAWER_COLOR: Record<string, string> = {
  CUL: "#A9402A", PHO: "#1F5C52", MUS: "#6B4E8A", PRF: "#B9791C", MOV: "#1F5C52",
  LAN: "#163F38", CRA: "#A9402A", WDW: "#7A4A22", WRI: "#3B4A63", GAM: "#4A5240",
  MAG: "#6B4E8A", NAT: "#2E5E3A", GRW: "#3A6B3A", OUT: "#2E5E3A", MND: "#4A6B6B",
  SOC: "#A9402A", STY: "#8A4A6B",
};

function drawColor(id: string): string {
  return DRAWER_COLOR[id] ?? "#163F38";
}

// Share card (CURIO.md §7): drawer-colored ground, or photo-first if one exists.
export async function shareCard(c: Challenge, rating: number, note?: string, photo?: string): Promise<void> {
  const W = 1080, H = 1080;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  const ground = drawColor(c.skillId);
  const skill = skillById(c.skillId);

  const paint = () => {
    // eyebrow
    x.fillStyle = "rgba(248,244,231,0.72)";
    x.font = "700 30px ui-monospace, monospace";
    x.fillText(`TODAY'S CURIO · ${(skill?.name ?? "").toUpperCase()}`, 80, photo ? 700 : 150);

    // title, wrapped
    x.fillStyle = "#F8F4E7";
    x.font = "600 82px ui-serif, Georgia, serif";
    const words = c.title.split(" ");
    let line = "", y = photo ? 780 : 300;
    const maxY = photo ? 900 : 999;
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (x.measureText(t).width > W - 160) { x.fillText(line, 80, y); y += 96; line = w; if (y > maxY) break; }
      else line = t;
    }
    x.fillText(line, 80, y);

    if (note && !photo) {
      x.fillStyle = "rgba(248,244,231,0.78)";
      x.font = "italic 40px ui-serif, Georgia, serif";
      x.fillText(`"${note.slice(0, 44)}${note.length > 44 ? "…" : ""}"`, 80, y + 110);
    }

    // bottom bar
    x.fillStyle = "#F8F4E7";
    x.fillRect(0, H - 150, W, 150);
    x.fillStyle = ground;
    x.font = "60px ui-sans-serif, sans-serif";
    x.fillText("★".repeat(rating), 80, H - 55);
    x.fillStyle = "rgba(28,37,33,0.35)";
    x.fillText("★".repeat(5 - rating), 80 + rating * 62, H - 55);
    x.fillStyle = "#4B564E";
    x.font = "700 34px ui-monospace, monospace";
    x.textAlign = "right";
    x.fillText("curio · one small thing a day", W - 80, H - 58);
    x.textAlign = "left";
  };

  const finish = async () => {
    const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), "image/png"));
    const file = new File([blob], "curio.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: c.shareTemplate }); return; } catch { /* fall through */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "curio.png";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (photo) {
    // photo-first: image fills the top, a scrim + drawer color anchors the text
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        // cover-fit the photo into the top ~62%
        const ph = H * 0.62;
        const scale = Math.max(W / img.width, ph / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        x.drawImage(img, (W - dw) / 2, (ph - dh) / 2, dw, dh);
        // drawer-colored panel over the lower part
        const grad = x.createLinearGradient(0, ph - 160, 0, H);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, ground);
        x.fillStyle = ground;
        x.fillRect(0, ph, W, H - ph);
        x.fillStyle = grad;
        x.fillRect(0, ph - 160, W, 160);
        paint();
        resolve();
      };
      img.onerror = () => { x.fillStyle = ground; x.fillRect(0, 0, W, H); paint(); resolve(); };
      img.src = photo;
    });
  } else {
    x.fillStyle = ground;
    x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(248,244,231,0.05)";
    x.beginPath(); x.arc(W, 0, 620, 0, Math.PI * 2); x.fill();
    paint();
  }
  await finish();
}
