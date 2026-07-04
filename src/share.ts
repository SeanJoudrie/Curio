import type { Challenge } from "./types";
import { skillById } from "./data/challenges";

// Share card (CURIO.md §7): teal ground, serif title, stars, watermark.
// Pure Canvas — no deps. Square 1080; "here's a weird thing I tried" energy.
export async function shareCard(c: Challenge, rating: number, note?: string): Promise<void> {
  const W = 1080, H = 1080;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;

  // ground
  x.fillStyle = "#163F38";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(248,244,231,0.05)";
  x.beginPath(); x.arc(W, 0, 620, 0, Math.PI * 2); x.fill();

  // eyebrow
  x.fillStyle = "rgba(248,244,231,0.6)";
  x.font = "700 30px ui-monospace, monospace";
  const skill = skillById(c.skillId);
  x.fillText(`TODAY'S CURIO · ${(skill?.name ?? "").toUpperCase()}`, 80, 140);

  // title, wrapped
  x.fillStyle = "#F8F4E7";
  x.font = "600 84px ui-serif, Georgia, serif";
  const words = c.title.split(" ");
  let line = "", y = 280;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (x.measureText(t).width > W - 160) { x.fillText(line, 80, y); y += 104; line = w; }
    else line = t;
  }
  x.fillText(line, 80, y);

  // note
  if (note) {
    x.fillStyle = "rgba(248,244,231,0.75)";
    x.font = "italic 40px ui-serif, Georgia, serif";
    x.fillText(`"${note.slice(0, 44)}${note.length > 44 ? "…" : ""}"`, 80, y + 110);
  }

  // bottom bar
  x.fillStyle = "#F8F4E7";
  x.fillRect(0, H - 150, W, 150);
  x.fillStyle = "#B9791C";
  x.font = "60px ui-sans-serif, sans-serif";
  x.fillText("★".repeat(rating) , 80, H - 55);
  x.fillStyle = "rgba(28,37,33,0.4)";
  x.fillText("★".repeat(5 - rating), 80 + rating * 62, H - 55);
  x.fillStyle = "#4B564E";
  x.font = "700 34px ui-monospace, monospace";
  x.textAlign = "right";
  x.fillText("curio · one small thing a day", W - 80, H - 58);
  x.textAlign = "left";

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
}
